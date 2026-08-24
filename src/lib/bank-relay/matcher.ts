import { normalizeDepositorName } from "@/lib/bank-relay/normalize";

export type MatchableBankOrder = {
  id: string;
  paymentMethod?: string;
  paymentStatus?: string;
  expectedAmount?: number;
  depositorName?: string;
  createdAtMillis: number;
  depositDueAtMillis: number;
};

export function exactDepositCandidates(
  orders: MatchableBankOrder[],
  deposit: { amount: number; depositorName: string; transactionAtMillis: number }
) {
  const normalized = normalizeDepositorName(deposit.depositorName);
  return orders.filter(
    (order) =>
      order.paymentMethod === "BANK_TRANSFER" &&
      order.paymentStatus === "WAITING_FOR_DEPOSIT" &&
      order.expectedAmount === deposit.amount &&
      normalizeDepositorName(order.depositorName || "") === normalized &&
      order.createdAtMillis > 0 &&
      order.depositDueAtMillis > 0 &&
      deposit.transactionAtMillis >= order.createdAtMillis &&
      deposit.transactionAtMillis <= order.depositDueAtMillis
  );
}

export function classifyExactCandidates(count: number) {
  if (count === 1) return "MATCHED" as const;
  if (count === 0) return "UNMATCHED" as const;
  return "AMBIGUOUS" as const;
}
