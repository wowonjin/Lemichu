import "server-only";

export function getRelayDeviceId() {
  return process.env.KB_RELAY_DEVICE_ID?.trim() || "kb-server-phone-01";
}

export function getRelayDeviceSecret() {
  const secret = process.env.KB_RELAY_DEVICE_SECRET?.trim() || "";
  if (secret.length < 32) throw new Error("KB_RELAY_DEVICE_SECRET_NOT_CONFIGURED");
  return secret;
}

export function getRelayAccountMask() {
  return process.env.KB_RELAY_ACCOUNT_MASK?.trim() || "";
}

export function getRelayDeviceName() {
  return process.env.KB_RELAY_DEVICE_NAME?.trim() || "KB 입금 서버폰";
}

export function getRelayDevicePhone() {
  return process.env.KB_RELAY_DEVICE_PHONE?.trim() || "";
}
