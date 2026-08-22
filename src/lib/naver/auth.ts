import "server-only";
import {
  NAVER_API_BASE_URL,
  requireNaverConfig,
  type NaverCommerceConfig,
} from "@/lib/naver/config";
import { generateSignature } from "@/lib/naver/signature";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = {
  accessToken: string;
  /** epoch(ms) 기준 만료 시각 */
  expiresAt: number;
};

/**
 * 발급된 토큰을 메모리에 캐시합니다. (type + accountId 별)
 * 인증 토큰 유효 시간은 3시간이며, 남은 시간이 충분하면 재사용합니다.
 */
const tokenCache = new Map<string, CachedToken>();

/** 만료 30초 전부터는 새 토큰을 발급합니다(네트워크 지연 버퍼). */
const EXPIRY_BUFFER_MS = 30_000;

function cacheKey(config: NaverCommerceConfig): string {
  return `${config.authType}:${config.accountId ?? "self"}`;
}

export class NaverAuthError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "NaverAuthError";
    this.status = status;
    this.code = code;
  }
}

async function requestNewToken(config: NaverCommerceConfig): Promise<CachedToken> {
  const timestamp = Date.now();
  const signature = generateSignature(config.clientId, config.clientSecret, timestamp);

  // 반드시 application/x-www-form-urlencoded 로 전송 (JSON 전송 시 오류).
  const body = new URLSearchParams({
    client_id: config.clientId,
    timestamp: String(timestamp),
    client_secret_sign: signature,
    grant_type: "client_credentials",
    type: config.authType,
  });

  if (config.authType === "SELLER" && config.accountId) {
    body.set("account_id", config.accountId);
  }

  const response = await fetch(`${NAVER_API_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const errorBody = (parsed ?? {}) as { code?: string; message?: string };
    throw new NaverAuthError(
      errorBody.message ?? `네이버 인증 토큰 발급 실패 (HTTP ${response.status})`,
      response.status,
      errorBody.code
    );
  }

  const data = parsed as TokenResponse;
  if (!data?.access_token) {
    throw new NaverAuthError("네이버 인증 토큰 응답에 access_token 이 없습니다.", 500);
  }

  return {
    accessToken: data.access_token,
    expiresAt: timestamp + (data.expires_in ?? 10_800) * 1000,
  };
}

/**
 * 유효한 access token 을 반환합니다. 캐시에 충분히 남은 토큰이 있으면 재사용합니다.
 * @param forceRefresh 401(GW.AUTHN) fallback 시 true 로 호출해 강제 재발급.
 */
export async function getNaverAccessToken(forceRefresh = false): Promise<string> {
  const config = requireNaverConfig();
  const key = cacheKey(config);

  if (!forceRefresh) {
    const cached = tokenCache.get(key);
    if (cached && cached.expiresAt - EXPIRY_BUFFER_MS > Date.now()) {
      return cached.accessToken;
    }
  }

  const token = await requestNewToken(config);
  tokenCache.set(key, token);
  return token.accessToken;
}

/** 캐시된 토큰을 폐기합니다(주로 401 발생 시). */
export function invalidateNaverToken(): void {
  const config = requireNaverConfig();
  tokenCache.delete(cacheKey(config));
}
