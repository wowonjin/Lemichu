import { describe, expect, it } from "vitest";
import {
  classifyExactCandidates,
  exactDepositCandidates,
  type MatchableBankOrder,
} from "@/lib/bank-relay/matcher";
import { normalizeDepositorName } from "@/lib/bank-relay/normalize";

const transactionAtMillis = Date.parse("2026-08-24T14:31:00+09:00");

function order(overrides: Partial<MatchableBankOrder> = {}): MatchableBankOrder {
  return {
    id: "BT-1",
    paymentMethod: "BANK_TRANSFER",
    paymentStatus: "WAITING_FOR_DEPOSIT",
    expectedAmount: 1_250_000,
    depositorName: "홍길동",
    createdAtMillis: transactionAtMillis - 60_000,
    depositDueAtMillis: transactionAtMillis + 60_000,
    ...overrides,
  };
}

describe("strict bank deposit matching", () => {
  it("normalizes Unicode and whitespace without fuzzy matching", () => {
    expect(normalizeDepositorName("  홍  길동  ")).toBe("홍 길동");
    expect(normalizeDepositorName("ＡＢＣ")).toBe("ABC");
  });

  it("matches exactly one amount/name/waiting order", () => {
    const candidates = exactDepositCandidates([order()], {
      amount: 1_250_000,
      depositorName: "홍길동",
      transactionAtMillis,
    });
    expect(candidates.map((candidate) => candidate.id)).toEqual(["BT-1"]);
    expect(classifyExactCandidates(candidates.length)).toBe("MATCHED");
  });

  it("does not match a different amount, name, paid state, or expired order", () => {
    const variants = [
      order({ id: "amount", expectedAmount: 1_249_999 }),
      order({ id: "name", depositorName: "홍길순" }),
      order({ id: "paid", paymentStatus: "PAID" }),
      order({ id: "expired", depositDueAtMillis: transactionAtMillis - 1 }),
    ];
    const candidates = exactDepositCandidates(variants, {
      amount: 1_250_000,
      depositorName: "홍길동",
      transactionAtMillis,
    });
    expect(candidates).toHaveLength(0);
    expect(classifyExactCandidates(candidates.length)).toBe("UNMATCHED");
  });

  it("classifies two exact orders as ambiguous", () => {
    const candidates = exactDepositCandidates(
      [order({ id: "BT-1" }), order({ id: "BT-2" })],
      {
        amount: 1_250_000,
        depositorName: "홍길동",
        transactionAtMillis,
      }
    );
    expect(candidates).toHaveLength(2);
    expect(classifyExactCandidates(candidates.length)).toBe("AMBIGUOUS");
  });
});
