package com.lemichu.kbdepositrelay.worker

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.service.notification.NotificationListenerService
import androidx.core.app.NotificationManagerCompat
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.lemichu.kbdepositrelay.BuildConfig
import com.lemichu.kbdepositrelay.RelayApplication
import com.lemichu.kbdepositrelay.data.SyncScheduler
import com.lemichu.kbdepositrelay.network.ApiResult
import com.lemichu.kbdepositrelay.network.HeartbeatPayload
import com.lemichu.kbdepositrelay.notification.KbNotificationListenerService
import java.util.concurrent.TimeUnit

class RelayWorkScheduler(context: Context) : SyncScheduler {
    private val workManager = WorkManager.getInstance(context.applicationContext)
    private val connected = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    override fun enqueueEventSync() {
        val request = OneTimeWorkRequestBuilder<DepositSyncWorker>()
            .setConstraints(connected)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        workManager.enqueueUniqueWork(
            EVENT_SYNC_WORK,
            ExistingWorkPolicy.APPEND_OR_REPLACE,
            request,
        )
    }

    fun enqueueImmediateHeartbeat() {
        val request = OneTimeWorkRequestBuilder<HeartbeatWorker>()
            .setConstraints(connected)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        workManager.enqueueUniqueWork(
            IMMEDIATE_HEARTBEAT_WORK,
            ExistingWorkPolicy.APPEND_OR_REPLACE,
            request,
        )
    }

    fun ensurePeriodicHeartbeat() {
        val request = PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
            .setConstraints(connected)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        workManager.enqueueUniquePeriodicWork(
            PERIODIC_HEARTBEAT_WORK,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    private companion object {
        const val EVENT_SYNC_WORK = "kb-relay-event-sync"
        const val IMMEDIATE_HEARTBEAT_WORK = "kb-relay-immediate-heartbeat"
        const val PERIODIC_HEARTBEAT_WORK = "kb-relay-periodic-heartbeat"
    }
}

class DepositSyncWorker(
    appContext: Context,
    parameters: WorkerParameters,
) : CoroutineWorker(appContext, parameters) {
    override suspend fun doWork(): Result {
        val graph = (applicationContext as RelayApplication).graph
        val dao = graph.database.eventDao()
        val now = System.currentTimeMillis()
        dao.recoverStaleSending(now - STALE_SENDING_MILLIS, now)
        if (dao.pendingCount() == 0) return Result.success()

        val settings = graph.settingsStore.current()
        val secret = graph.secretStore.readSecret()
        if (settings.serverUrl.isBlank() || secret.isNullOrBlank()) {
            graph.settingsStore.recordServerResult(false, "서버 URL 또는 Secret 미설정")
            return Result.retry()
        }

        repeat(MAX_EVENTS_PER_RUN) {
            val event = dao.nextPending()
                ?: return if (dao.pendingCount() > 0) Result.retry() else Result.success()
            val claimed = dao.markSending(event.eventId, System.currentTimeMillis())
            if (claimed == 0) return@repeat

            when (
                val result = graph.apiClient.postDeposit(
                    serverUrl = settings.serverUrl,
                    secret = secret,
                    deviceId = settings.deviceId,
                    event = event,
                )
            ) {
                ApiResult.Success -> {
                    dao.markSent(event.eventId, System.currentTimeMillis())
                    graph.settingsStore.recordServerResult(true, "입금 이벤트 전송 성공")
                }

                is ApiResult.Retryable -> {
                    dao.returnToPending(event.eventId, result.reason, System.currentTimeMillis())
                    graph.settingsStore.recordServerResult(false, result.reason)
                    return Result.retry()
                }

                is ApiResult.PermanentFailure -> {
                    dao.markFailed(event.eventId, result.reason, System.currentTimeMillis())
                    graph.settingsStore.recordServerResult(false, result.reason)
                }
            }
        }
        return if (dao.pendingCount() > 0) Result.retry() else Result.success()
    }

    private companion object {
        const val MAX_EVENTS_PER_RUN = 50
        val STALE_SENDING_MILLIS = TimeUnit.MINUTES.toMillis(10)
    }
}

class HeartbeatWorker(
    appContext: Context,
    parameters: WorkerParameters,
) : CoroutineWorker(appContext, parameters) {
    override suspend fun doWork(): Result {
        val graph = (applicationContext as RelayApplication).graph
        val settings = graph.settingsStore.current()
        val secret = graph.secretStore.readSecret()
        if (settings.serverUrl.isBlank() || secret.isNullOrBlank()) {
            graph.settingsStore.recordServerResult(false, "서버 URL 또는 Secret 미설정")
            return Result.retry()
        }

        val payload = HeartbeatPayload(
            deviceId = settings.deviceId,
            appVersion = BuildConfig.VERSION_NAME,
            batteryLevel = batteryLevel(applicationContext),
            notificationListenerGranted =
                NotificationManagerCompat.getEnabledListenerPackages(applicationContext)
                    .contains(applicationContext.packageName),
            pendingQueueCount = graph.database.eventDao().pendingCount(),
            lastEventAt = graph.database.eventDao().lastEventAt(),
        )
        return when (
            val result = graph.apiClient.postHeartbeat(
                serverUrl = settings.serverUrl,
                secret = secret,
                payload = payload,
            )
        ) {
            ApiResult.Success -> {
                graph.settingsStore.recordServerResult(
                    success = true,
                    message = "Heartbeat 정상",
                    heartbeatAt = System.currentTimeMillis(),
                )
                Result.success()
            }

            is ApiResult.Retryable -> {
                graph.settingsStore.recordServerResult(false, result.reason)
                Result.retry()
            }

            is ApiResult.PermanentFailure -> {
                graph.settingsStore.recordServerResult(false, result.reason)
                Result.success()
            }
        }
    }

    @Suppress("DEPRECATION")
    private fun batteryLevel(context: Context): Int {
        val status = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            ?: return -1
        val level = status.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = status.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        return if (level >= 0 && scale > 0) level * 100 / scale else -1
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context) {
        val scheduler = RelayWorkScheduler(context)
        scheduler.ensurePeriodicHeartbeat()
        scheduler.enqueueImmediateHeartbeat()
        scheduler.enqueueEventSync()

        if (
            NotificationManagerCompat.getEnabledListenerPackages(context)
                .contains(context.packageName)
        ) {
            NotificationListenerService.requestRebind(
                ComponentName(context, KbNotificationListenerService::class.java),
            )
        }
    }
}
