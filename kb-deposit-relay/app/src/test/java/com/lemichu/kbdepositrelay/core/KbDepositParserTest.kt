package com.lemichu.kbdepositrelay.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class KbDepositParserTest {
    private val sample = """
        [KB]7/10 16:40
        498125****8895
        홍길동
        1,250,000 입금
        1644-9999
    """.trimIndent()

    @Test
    fun `parses expected KB deposit fields`() {
        val parsed = KbDepositParser.parse(
            sample,
            Instant.parse("2026-08-24T05:00:00Z"),
        )

        requireNotNull(parsed)
        assertEquals("KB", parsed.bank)
        assertEquals("498125****8895", parsed.accountMask)
        assertEquals("홍길동", parsed.depositorName)
        assertEquals(1_250_000L, parsed.amount)
        assertEquals("2026-07-10T16:40+09:00", parsed.transactionAt)
    }

    @Test
    fun `rejects withdrawal markers even when deposit text is also present`() {
        assertNull(KbDepositParser.parse(sample.replace("입금", "인터넷출금 입금")))
        assertNull(KbDepositParser.parse(sample.replace("입금", "출금")))
    }

    @Test
    fun `rejects unrelated notification and OTP text`() {
        assertNull(KbDepositParser.parse("배송이 시작되었습니다."))
        assertNull(KbDepositParser.parse("[KB] 인증번호 123456은 3분간 유효합니다."))
    }

    @Test
    fun `uses previous year for Dec 31 notification seen on Jan 1`() {
        val parsed = KbDepositParser.parse(
            sample.replace("7/10 16:40", "12/31 23:59"),
            Instant.parse("2025-12-31T15:05:00Z"),
        )

        requireNotNull(parsed)
        assertEquals("2025-12-31T23:59+09:00", parsed.transactionAt)
        assertTrue(parsed.transactionAt.endsWith("+09:00"))
    }
}
