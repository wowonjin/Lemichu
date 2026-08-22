import "server-only";
import { NAVER_API_BASE_URL } from "@/lib/naver/config";
import { getNaverAccessToken, invalidateNaverToken } from "@/lib/naver/auth";

export type NaverInvalidInput = {
  name?: string;
  type?: string;
  message?: string;
};

export class NaverApiError extends Error {
  status: number;
  code?: string;
  invalidInputs?: NaverInvalidInput[];
  raw?: unknown;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; invalidInputs?: NaverInvalidInput[]; raw?: unknown }
  ) {
    super(message);
    this.name = "NaverApiError";
    this.status = status;
    this.code = options?.code;
    this.invalidInputs = options?.invalidInputs;
    this.raw = options?.raw;
  }

  /** 사용자에게 보여줄 사람이 읽기 쉬운 메시지 */
  toDisplayMessage(): string {
    if (this.invalidInputs && this.invalidInputs.length > 0) {
      const details = this.invalidInputs
        .map((input) => `${input.name ?? "필드"}: ${input.message ?? input.type ?? "유효하지 않음"}`)
        .join(", ");
      return `${this.message} (${details})`;
    }
    return this.message;
  }
}

type NaverFetchOptions = {
  method?: string;
  /** JSON 직렬화할 바디 */
  json?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** 내부 재시도 플래그 (직접 설정하지 마세요) */
  _retried?: boolean;
};

function buildUrl(path: string, query?: NaverFetchOptions["query"]): string {
  const url = new URL(`${NAVER_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * 인증 토큰을 자동 첨부하는 커머스 API 호출 래퍼.
 * - 401 + GW.AUTHN 응답 시 토큰을 강제 재발급하여 1회 재시도합니다.
 * - 오류 응답은 NaverApiError 로 변환합니다.
 */
export async function naverFetch<T = unknown>(
  path: string,
  options: NaverFetchOptions = {}
): Promise<T> {
  const { method = "GET", json, query, _retried = false } = options;
  const accessToken = await getNaverAccessToken(_retried);

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text || null;
  }

  if (response.ok) {
    return parsed as T;
  }

  const errorBody = (parsed ?? {}) as {
    code?: string;
    message?: string;
    invalidInputs?: NaverInvalidInput[];
  };

  // 인증 토큰 만료(GW.AUTHN) → 재발급 후 1회 재시도
  if (response.status === 401 && errorBody.code === "GW.AUTHN" && !_retried) {
    invalidateNaverToken();
    return naverFetch<T>(path, { ...options, _retried: true });
  }

  throw new NaverApiError(
    errorBody.message ?? `네이버 커머스 API 오류 (HTTP ${response.status})`,
    response.status,
    { code: errorBody.code, invalidInputs: errorBody.invalidInputs, raw: parsed }
  );
}
