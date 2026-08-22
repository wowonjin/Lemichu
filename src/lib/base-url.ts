export function getBaseUrl(req: Request): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const origin = new URL(req.url).origin;
  const host = req.headers.get("host") || "";
  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  if (process.env.NODE_ENV !== "production" && isLocalhost) {
    return origin;
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (envBase) {
    return envBase.replace(/\/$/, "");
  }

  if (host && !isLocalhost) {
    return `https://${host}`;
  }

  return origin;
}
