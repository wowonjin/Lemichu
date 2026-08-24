package com.lemichu.kbdepositrelay.notification

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.lemichu.kbdepositrelay.RelayApplication
import com.lemichu.kbdepositrelay.core.KbDepositParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class KbNotificationListenerService : NotificationListenerService() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNotificationPosted(statusBarNotification: StatusBarNotification?) {
        val notificationPackage = statusBarNotification?.packageName ?: return
        serviceScope.launch {
            try {
                val graph = (application as RelayApplication).graph
                val selectedPackage = graph.settingsStore.current().selectedSmsPackage

                // Privacy boundary: never access extras until the package is approved.
                if (selectedPackage.isBlank() || notificationPackage != selectedPackage) return@launch

                val notification = statusBarNotification.notification ?: return@launch
                val textInMemory = extractText(notification)
                val parsed = KbDepositParser.parse(textInMemory) ?: return@launch
                graph.eventRepository.record(parsed, isTest = false)
            } catch (cancellation: CancellationException) {
                throw cancellation
            } catch (_: Exception) {
                // Intentionally silent: notification content must never reach logs.
            }
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        (application as RelayApplication).graph.workScheduler.enqueueImmediateHeartbeat()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun extractText(notification: Notification): String {
        val extras = notification.extras
        val textParts = mutableListOf<CharSequence>()
        extras.getCharSequence(Notification.EXTRA_TITLE)?.let(textParts::add)
        extras.getCharSequence(Notification.EXTRA_TEXT)?.let(textParts::add)
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.let(textParts::add)
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
            ?.forEach(textParts::add)
        return textParts.joinToString(separator = "\n")
    }
}
