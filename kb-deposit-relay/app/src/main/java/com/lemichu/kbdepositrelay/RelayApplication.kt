package com.lemichu.kbdepositrelay

import android.app.Application
import com.lemichu.kbdepositrelay.data.EventRepository
import com.lemichu.kbdepositrelay.data.KeystoreSecretStore
import com.lemichu.kbdepositrelay.data.RelayDatabase
import com.lemichu.kbdepositrelay.data.SettingsStore
import com.lemichu.kbdepositrelay.network.RelayApiClient
import com.lemichu.kbdepositrelay.worker.RelayWorkScheduler

class RelayApplication : Application() {
    lateinit var graph: AppGraph
        private set

    override fun onCreate() {
        super.onCreate()
        graph = AppGraph(this)
        graph.workScheduler.ensurePeriodicHeartbeat()
        graph.workScheduler.enqueueImmediateHeartbeat()
        graph.workScheduler.enqueueEventSync()
    }
}

class AppGraph(application: Application) {
    val settingsStore = SettingsStore(application)
    val secretStore = KeystoreSecretStore(application)
    val database = RelayDatabase.get(application)
    val apiClient = RelayApiClient()
    val workScheduler = RelayWorkScheduler(application)
    val eventRepository = EventRepository(database.eventDao(), workScheduler)
}
