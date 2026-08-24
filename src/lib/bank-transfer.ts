export const BANK_TRANSFER_ACCOUNT = {
  methodLabel: "무통장 입금",
  bankName: "국민은행",
  accountNumber: "75710204369078",
  accountHolder: "배살렘",
} as const;

export function formatBankAccountNumber(accountNumber: string): string {
  if (accountNumber.length === 14) {
    return `${accountNumber.slice(0, 6)}-${accountNumber.slice(6, 8)}-${accountNumber.slice(8)}`;
  }
  return accountNumber;
}
