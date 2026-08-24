package com.lemichu.kbdepositrelay.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import com.lemichu.kbdepositrelay.core.ParsedDeposit
import com.lemichu.kbdepositrelay.core.RelayCrypto
import kotlinx.coroutines.flow.Flow
import java.util.UUID

enum class EventStatus {
    PENDING,
    SENDING,
    SENT,
    FAILED,
}

@Entity(
    tableName = "deposit_events",
    indices = [
        Index(value = ["eventHash"], unique = true),
        Index(value = ["status"]),
    ],
)
data class DepositEventEntity(
    @PrimaryKey val eventId: String,
    val eventHash: String,
    val bank: String,
    val accountMask: String,
    val depositorName: String,
    val amount: Long,
    val transactionAt: String,
    val isTest: Boolean,
    val status: String,
    val createdAt: Long,
    val updatedAt: Long,
    val lastError: String? = null,
)

interface EventWriter {
    suspend fun insert(event: DepositEventEntity): Long
}

@Dao
interface DepositEventDao : EventWriter {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    override suspend fun insert(event: DepositEventEntity): Long

    @Query("SELECT * FROM deposit_events ORDER BY createdAt DESC LIMIT :limit")
    fun observeRecent(limit: Int = 20): Flow<List<DepositEventEntity>>

    @Query("SELECT COUNT(*) FROM deposit_events WHERE status IN ('PENDING', 'SENDING')")
    fun observePendingCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM deposit_events WHERE status IN ('PENDING', 'SENDING')")
    suspend fun pendingCount(): Int

    @Query("SELECT MAX(transactionAt) FROM deposit_events")
    suspend fun lastEventAt(): String?

    @Query("SELECT * FROM deposit_events WHERE status = 'PENDING' ORDER BY createdAt ASC LIMIT 1")
    suspend fun nextPending(): DepositEventEntity?

    @Query("SELECT * FROM deposit_events WHERE eventId = :eventId")
    suspend fun getById(eventId: String): DepositEventEntity?

    @Query(
        """
        UPDATE deposit_events
        SET status = 'SENDING', updatedAt = :now, lastError = NULL
        WHERE eventId = :eventId AND status = 'PENDING'
        """,
    )
    suspend fun markSending(eventId: String, now: Long): Int

    @Query(
        """
        UPDATE deposit_events
        SET status = 'SENT', updatedAt = :now, lastError = NULL
        WHERE eventId = :eventId
        """,
    )
    suspend fun markSent(eventId: String, now: Long)

    @Query(
        """
        UPDATE deposit_events
        SET status = 'FAILED', updatedAt = :now, lastError = :reason
        WHERE eventId = :eventId
        """,
    )
    suspend fun markFailed(eventId: String, reason: String, now: Long)

    @Query(
        """
        UPDATE deposit_events
        SET status = 'PENDING', updatedAt = :now, lastError = :reason
        WHERE eventId = :eventId
        """,
    )
    suspend fun returnToPending(eventId: String, reason: String, now: Long)

    @Query(
        """
        UPDATE deposit_events
        SET status = 'PENDING', updatedAt = :now, lastError = '전송 중단 복구'
        WHERE status = 'SENDING' AND updatedAt < :staleBefore
        """,
    )
    suspend fun recoverStaleSending(staleBefore: Long, now: Long): Int
}

@Database(
    entities = [DepositEventEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class RelayDatabase : RoomDatabase() {
    abstract fun eventDao(): DepositEventDao

    companion object {
        @Volatile
        private var instance: RelayDatabase? = null

        fun get(context: Context): RelayDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    RelayDatabase::class.java,
                    "kb-deposit-relay.db",
                ).build().also { instance = it }
            }
    }
}

interface SyncScheduler {
    fun enqueueEventSync()
}

class EventRepository(
    private val eventWriter: EventWriter,
    private val scheduler: SyncScheduler,
    private val nowMillis: () -> Long = System::currentTimeMillis,
    private val idFactory: () -> String = { UUID.randomUUID().toString() },
) {
    enum class RecordResult { INSERTED, DUPLICATE }

    suspend fun record(parsed: ParsedDeposit, isTest: Boolean): RecordResult {
        val now = nowMillis()
        val event = DepositEventEntity(
            eventId = idFactory(),
            eventHash = RelayCrypto.eventHash(parsed),
            bank = parsed.bank,
            accountMask = parsed.accountMask,
            depositorName = parsed.depositorName,
            amount = parsed.amount,
            transactionAt = parsed.transactionAt,
            isTest = isTest,
            status = EventStatus.PENDING.name,
            createdAt = now,
            updatedAt = now,
        )
        return if (eventWriter.insert(event) == -1L) {
            RecordResult.DUPLICATE
        } else {
            scheduler.enqueueEventSync()
            RecordResult.INSERTED
        }
    }
}
