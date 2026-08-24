package com.lemichu.kbdepositrelay.data

import com.lemichu.kbdepositrelay.core.ParsedDeposit
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EventRepositoryTest {
    private val parsed = ParsedDeposit(
        bank = "KB",
        accountMask = "498125****8895",
        depositorName = "홍길동",
        amount = 1_250_000,
        transactionAt = "2026-07-10T16:40+09:00",
    )

    @Test
    fun `inserted test event is pending and schedules unique queue`() = runTest {
        val writer = FakeWriter()
        val scheduler = FakeScheduler()
        val repository = EventRepository(
            eventWriter = writer,
            scheduler = scheduler,
            nowMillis = { 1234L },
            idFactory = { "event-id" },
        )

        val result = repository.record(parsed, isTest = true)

        assertEquals(EventRepository.RecordResult.INSERTED, result)
        assertEquals(1, scheduler.enqueueCount)
        assertEquals("event-id", writer.events.single().eventId)
        assertEquals(EventStatus.PENDING.name, writer.events.single().status)
        assertTrue(writer.events.single().isTest)
    }

    @Test
    fun `duplicate hash is ignored and does not enqueue another worker`() = runTest {
        val writer = FakeWriter()
        val scheduler = FakeScheduler()
        val repository = EventRepository(writer, scheduler, idFactory = { "id-${writer.calls}" })

        assertEquals(EventRepository.RecordResult.INSERTED, repository.record(parsed, false))
        assertEquals(EventRepository.RecordResult.DUPLICATE, repository.record(parsed, false))
        assertEquals(1, scheduler.enqueueCount)
        assertEquals(1, writer.events.size)
    }

    private class FakeWriter : EventWriter {
        val events = mutableListOf<DepositEventEntity>()
        var calls = 0

        override suspend fun insert(event: DepositEventEntity): Long {
            calls++
            if (events.any { it.eventHash == event.eventHash }) return -1
            events += event
            return events.size.toLong()
        }
    }

    private class FakeScheduler : SyncScheduler {
        var enqueueCount = 0
        override fun enqueueEventSync() {
            enqueueCount++
        }
    }
}
