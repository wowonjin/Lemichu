import crypto from "crypto";

export function generateTossOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `TP-${year}${month}${day}-${random}`;
}

export function getTossPaymentClientKey(): string {
  const value = (process.env.TOSS_PAYMENT_CLIENT_KEY || process.env.TOSS_CLIENT_KEY || "").trim();
  if (!value) {
    throw new Error("TOSS_PAYMENT_CLIENT_KEY_NOT_SET");
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("test_sk_") || lower.startsWith("live_sk_")) {
    throw new Error("TOSS_PAYMENT_CLIENT_KEY_IS_SECRET_KEY");
  }

  if (lower.includes("_gck_") || lower.startsWith("test_gck_") || lower.startsWith("live_gck_")) {
    throw new Error("TOSS_PAYMENT_CLIENT_KEY_IS_WIDGET_KEY");
  }

  return value;
}

export function getTossSecretKey(): string {
  const value = (process.env.TOSS_SECRET_KEY || "").trim();
  if (!value) {
    throw new Error("TOSS_SECRET_KEY_NOT_SET");
  }

  return value;
}

export function basicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}
