package com.lemichu.kbdepositrelay.network

import com.lemichu.kbdepositrelay.BuildConfig
import com.lemichu.kbdepositrelay.core.RelayCrypto
import com.lemichu.kbdepositrelay.data.DepositEventEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.time.Instant
import java.util.UUID
import java.util.concurrent.TimeUnit

sealed interface ApiResult {
    data object Success : ApiResult
    data class Retryable(val reason: String) : ApiResult
    data class PermanentFailure(val reason: String) : ApiResult
}

data class HeartbeatPayload(
    val deviceId: String,
    val appVersion: String,
    val batteryLevel: Int,
    val notificationListenerGranted: Boolean,
    val pendingQueueCount: Int,
    val lastEventAt: String?,
)

object RelayJson {
    fun deposit(event: DepositEventEntity, deviceId: String): String = buildString {
        append('{')
        field("eventId", event.eventId)
        field("eventHash", event.eventHash)
        field("deviceId", deviceId)
        field("bank", event.bank)
        field("accountMask", event.accountMask)
        field("depositorName", event.depositorName)
        numberField("amount", event.amount)
        field("transactionAt", event.transactionAt)
        booleanField("isTest", event.isTest, last = true)
        append('}')
    }

    fun heartbeat(payload: HeartbeatPayload): String = buildString {
        append('{')
        field("deviceId", payload.deviceId)
        field("appVersion", payload.appVersion)
        numberField("batteryLevel", payload.batteryLevel.toLong())
        booleanField("notificationListenerGranted", payload.notificationListenerGranted)
        numberField("pendingQueueCount", payload.pendingQueueCount.toLong())
        nullableField("lastEventAt", payload.lastEventAt, last = true)
        append('}')
    }

    private fun StringBuilder.field(name: String, value: String, last: Boolean = false) {
        appendQuoted(name)
        append(':')
        appendQuoted(value)
        if (!last) append(',')
    }

    private fun StringBuilder.nullableField(name: String, value: String?, last: Boolean = false) {
        appendQuoted(name)
        append(':')
        if (value == null) append("null") else appendQuoted(value)
        if (!last) append(',')
    }

    private fun StringBuilder.numberField(name: String, value: Long, last: Boolean = false) {
        appendQuoted(name)
        append(':')
        append(value)
        if (!last) append(',')
    }

    private fun StringBuilder.booleanField(name: String, value: Boolean, last: Boolean = false) {
        appendQuoted(name)
        append(':')
        append(value)
        if (!last) append(',')
    }

    private fun StringBuilder.appendQuoted(value: String) {
        append('"')
        value.forEach { character ->
            when (character) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\b' -> append("\\b")
                '\u000C' -> append("\\f")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> {
                    if (character.code < 0x20) {
                        append("\\u")
                        append(character.code.toString(16).padStart(4, '0'))
                    } else {
                        append(character)
                    }
                }
            }
        }
        append('"')
    }
}

class RelayApiClient(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .followRedirects(false)
        .followSslRedirects(false)
        .build(),
    private val epochSeconds: () -> Long = { Instant.now().epochSecond },
    private val nonceFactory: () -> String = { UUID.randomUUID().toString() },
) {
    suspend fun postDeposit(
        serverUrl: String,
        secret: String,
        deviceId: String,
        event: DepositEventEntity,
    ): ApiResult = post(
        serverUrl = serverUrl,
        endpoint = "/api/internal/bank-relay/deposits",
        secret = secret,
        deviceId = deviceId,
        rawBody = RelayJson.deposit(event, deviceId),
    )

    suspend fun postHeartbeat(
        serverUrl: String,
        secret: String,
        payload: HeartbeatPayload,
    ): ApiResult = post(
        serverUrl = serverUrl,
        endpoint = "/api/internal/bank-relay/heartbeat",
        secret = secret,
        deviceId = payload.deviceId,
        rawBody = RelayJson.heartbeat(payload),
    )

    private suspend fun post(
        serverUrl: String,
        endpoint: String,
        secret: String,
        deviceId: String,
        rawBody: String,
    ): ApiResult = withContext(Dispatchers.IO) {
        if (secret.isBlank()) return@withContext ApiResult.Retryable("Device Secret 미설정")
        val baseUrl = serverUrl.trim().trimEnd('/')
        val parsedBaseUrl = baseUrl.toHttpUrlOrNull()
            ?: return@withContext ApiResult.Retryable("서버 URL 오류")
        val localDebugHost = BuildConfig.DEBUG &&
            parsedBaseUrl.scheme == "http" &&
            parsedBaseUrl.host in LOCAL_DEBUG_HOSTS
        if (parsedBaseUrl.scheme != "https" && !localDebugHost) {
            return@withContext ApiResult.Retryable("HTTPS 서버 URL 필요")
        }
        val url = parsedBaseUrl.newBuilder()
            .encodedPath(endpoint)
            .query(null)
            .fragment(null)
            .build()

        val timestamp = epochSeconds().toString()
        val nonce = nonceFactory()
        val signature = RelayCrypto.signature(secret, timestamp, nonce, rawBody)
        val request = Request.Builder()
            .url(url)
            .header("X-Relay-Device", deviceId)
            .header("X-Relay-Timestamp", timestamp)
            .header("X-Relay-Nonce", nonce)
            .header("X-Relay-Signature", signature)
            .post(rawBody.toRequestBody(JSON_MEDIA_TYPE))
            .build()

        try {
            client.newCall(request).execute().use(::mapResponse)
        } catch (_: IOException) {
            ApiResult.Retryable("네트워크 오류")
        }
    }

    private fun mapResponse(response: Response): ApiResult = when {
        response.isSuccessful -> ApiResult.Success
        response.code == 401 -> ApiResult.PermanentFailure("인증 거부(401)")
        response.code >= 500 -> ApiResult.Retryable("서버 오류(${response.code})")
        else -> ApiResult.PermanentFailure("요청 거부(${response.code})")
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
        val LOCAL_DEBUG_HOSTS = setOf("localhost", "127.0.0.1", "10.0.2.2", "::1")
    }
}
