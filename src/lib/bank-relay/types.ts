export type BankDepositEventStatus =
  | "RECEIVED"
  | "MATCHED"
  | "UNMATCHED"
  | "AMBIGUOUS"
  | "IGNORED";

export type RelayDepositPayload = {
  eventId: string;
  eventHash: string;
  deviceId: string;
  bank: "KB";
  accountMask: string;
  depositorName: string;
  amount: number;
  transactionAt: string;
  isTest: boolean;
};

export type RelayHeartbeatPayload = {
  deviceId: string;
  appVersion: string;
  batteryLevel: number;
  notificationListenerGranted: boolean;
  pendingQueueCount: number;
  lastEventAt?: string;
};

export type RelayHeaders = {
  deviceId: string;
  timestamp: number;
  nonce: string;
};
