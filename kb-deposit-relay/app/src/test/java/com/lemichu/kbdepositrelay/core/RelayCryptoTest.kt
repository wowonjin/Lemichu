package com.lemichu.kbdepositrelay.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class RelayCryptoTest {
    @Test
    fun `event hash uses exact field concatenation`() {
        val deposit = ParsedDeposit(
            bank = "KB",
            accountMask = "498125****8895",
            depositorName = "홍길동",
            amount = 1_250_000,
            transactionAt = "2026-07-10T16:40+09:00",
        )

        assertEquals(
            RelayCrypto.sha256("KB498125****8895홍길동12500002026-07-10T16:40+09:00"),
            RelayCrypto.eventHash(deposit),
        )
        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            RelayCrypto.sha256("abc"),
        )
    }

    @Test
    fun `HMAC matches RFC vector and signs exact raw body`() {
        assertEquals(
            "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
            RelayCrypto.hmacSha256Hex(String(CharArray(20) { '\u000b' }), "Hi There"),
        )

        val compact = RelayCrypto.signature(
            "test-secret",
            "1700000000",
            "123e4567-e89b-12d3-a456-426614174000",
            """{"eventId":"evt-1"}""",
        )
        val spaced = RelayCrypto.signature(
            "test-secret",
            "1700000000",
            "123e4567-e89b-12d3-a456-426614174000",
            """{ "eventId": "evt-1" }""",
        )
        assertNotEquals(compact, spaced)
    }
}
