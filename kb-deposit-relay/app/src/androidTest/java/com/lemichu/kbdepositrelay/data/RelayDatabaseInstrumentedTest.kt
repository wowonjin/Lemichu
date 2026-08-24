package com.lemichu.kbdepositrelay.data

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class RelayDatabaseInstrumentedTest {
    private lateinit var database: RelayDatabase
    private lateinit var dao: DepositEventDao

    @Before
    fun createDatabase() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, RelayDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.eventDao()
    }

    @After
    fun closeDatabase() {
        database.close()
    }

    @Test
    fun uniqueHashAndStaleSendingRecovery() = runBlocking {
        val first = event("event-1", "same-hash")
        val duplicate = event("event-2", "same-hash")

        assertNotEquals(-1L, dao.insert(first))
        assertEquals(-1L, dao.insert(duplicate))
        assertEquals(1, dao.markSending(first.eventId, now = 1_000L))
        assertEquals(EventStatus.SENDING.name, dao.getById(first.eventId)?.status)

        assertEquals(1, dao.recoverStaleSending(staleBefore = 2_000L, now = 3_000L))
        assertEquals(EventStatus.PENDING.name, dao.getById(first.eventId)?.status)
        assertEquals("전송 중단 복구", dao.getById(first.eventId)?.lastError)
    }

    private fun event(id: String, hash: String) = DepositEventEntity(
        eventId = id,
        eventHash = hash,
        bank = "KB",
        accountMask = "498125****8895",
        depositorName = "홍길동",
        amount = 1_000,
        transactionAt = "2026-08-24T14:00+09:00",
        isTest = false,
        status = EventStatus.PENDING.name,
        createdAt = 100,
        updatedAt = 100,
    )
}
