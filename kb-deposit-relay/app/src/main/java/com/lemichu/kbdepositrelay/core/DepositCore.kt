package com.lemichu.kbdepositrelay.core

import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.text.Normalizer
import java.time.DateTimeException
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

data class ParsedDeposit(
    val bank: String,
    val accountMask: String,
    val depositorName: String,
    val amount: Long,
    val transactionAt: String,
)

object KbDepositParser {
    val SEOUL: ZoneId = ZoneId.of("Asia/Seoul")

    private val kbMarker = Regex("""(?:\[KB\]|KB국민|국민은행)""", RegexOption.IGNORE_CASE)
    private val withdrawalMarker = Regex("""(?:인터넷\s*)?출금""")
    private val amountPattern = Regex("""(?<!\d)([0-9][0-9,]*)\s*원?\s*입금(?!\p{L})""")
    private val accountPattern = Regex("""(?<!\d)(\d{2,}[*xX•·-]{2,}\d{2,})(?!\d)""")
    private val datePattern = Regex("""(?<!\d)(\d{1,2})/(\d{1,2})\s+(\d{1,2}):(\d{2})(?!\d)""")
    private val phonePattern = Regex("""^\d{2,4}-\d{3,4}-\d{4}$""")

    fun parse(
        text: CharSequence,
        now: Instant = Instant.now(),
        zoneId: ZoneId = SEOUL,
    ): ParsedDeposit? {
        val value = text.toString()
        if (!kbMarker.containsMatchIn(value)) return null
        if (!value.contains("입금") || withdrawalMarker.containsMatchIn(value)) return null

        val amountMatch = amountPattern.find(value) ?: return null
        val amount = amountMatch.groupValues[1].replace(",", "").toLongOrNull()
            ?.takeIf { it > 0L }
            ?: return null
        val accountMask = accountPattern.find(value)?.groupValues?.get(1) ?: return null
        val date = datePattern.find(value) ?: return null
        val transactionAt = inferTransactionAt(
            month = date.groupValues[1].toIntOrNull() ?: return null,
            day = date.groupValues[2].toIntOrNull() ?: return null,
            hour = date.groupValues[3].toIntOrNull() ?: return null,
            minute = date.groupValues[4].toIntOrNull() ?: return null,
            now = now,
            zoneId = zoneId,
        ) ?: return null

        val lines = value.lineSequence().map { it.trim() }.filter { it.isNotEmpty() }.toList()
        val amountLine = lines.indexOfFirst { amountPattern.containsMatchIn(it) }
        if (amountLine < 0) return null
        val depositorName = lines.subList(0, amountLine)
            .asReversed()
            .firstOrNull(::isDepositorLine)
            ?.let(::normalizeName)
            ?: return null

        return ParsedDeposit(
            bank = "KB",
            accountMask = accountMask,
            depositorName = depositorName,
            amount = amount,
            transactionAt = transactionAt,
        )
    }

    internal fun inferTransactionAt(
        month: Int,
        day: Int,
        hour: Int,
        minute: Int,
        now: Instant,
        zoneId: ZoneId = SEOUL,
    ): String? {
        val nowAtZone = now.atZone(zoneId)
        return try {
            var candidate = ZonedDateTime.of(
                LocalDateTime.of(nowAtZone.year, month, day, hour, minute),
                zoneId,
            )
            if (candidate.isAfter(nowAtZone.plusDays(1))) {
                candidate = candidate.minusYears(1)
            }
            candidate.toOffsetDateTime().toString()
        } catch (_: DateTimeException) {
            null
        }
    }

    private fun isDepositorLine(line: String): Boolean {
        if (kbMarker.containsMatchIn(line)) return false
        if (datePattern.containsMatchIn(line) || accountPattern.containsMatchIn(line)) return false
        if (phonePattern.matches(line) || amountPattern.containsMatchIn(line)) return false
        if (line.contains("입금") || withdrawalMarker.containsMatchIn(line)) return false
        return line.length in 1..40 && line.any(Char::isLetter)
    }

    private fun normalizeName(value: String): String =
        Normalizer.normalize(value, Normalizer.Form.NFKC)
            .trim()
            .replace(Regex("""\s+"""), " ")
}

object RelayCrypto {
    fun eventHash(deposit: ParsedDeposit): String {
        val canonical = buildString {
            append(deposit.bank)
            append(deposit.accountMask)
            append(deposit.depositorName)
            append(deposit.amount)
            append(deposit.transactionAt)
        }
        return sha256(canonical)
    }

    fun sha256(value: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest(value.toByteArray(StandardCharsets.UTF_8))
            .toHex()

    fun hmacSha256Hex(secret: String, value: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256"))
        return mac.doFinal(value.toByteArray(StandardCharsets.UTF_8)).toHex()
    }

    fun signature(secret: String, timestamp: String, nonce: String, rawJsonBody: String): String =
        hmacSha256Hex(secret, "$timestamp.$nonce.$rawJsonBody")

    private fun ByteArray.toHex(): String = joinToString(separator = "") { "%02x".format(it) }
}
