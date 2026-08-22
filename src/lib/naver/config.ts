import "server-only";

/**
 * 네이버 커머스 API(스마트스토어) 서버 전용 설정.
 *
 * 모든 값은 서버에서만 접근하는 환경변수에서 읽습니다. (절대 NEXT_PUBLIC_* 사용 금지)
 *
 * - NAVER_COMMERCE_CLIENT_ID     애플리케이션 ID (예: 39XmpTBHKxGj3yt0I6ce2E)
 * - NAVER_COMMERCE_CLIENT_SECRET 애플리케이션 시크릿 (bcrypt salt 형식, $2a$...)
 * - NAVER_COMMERCE_ACCOUNT_ID    판매자 ID (예: ncp_1owsby_01) — type=SELLER 일 때 필요
 * - NAVER_COMMERCE_AUTH_TYPE     SELF | SELLER (기본 SELF: 내스토어 애플리케이션)
 */

export const NAVER_API_BASE_URL = "https://api.commerce.naver.com/external";

export type NaverAuthType = "SELF" | "SELLER";

export type NaverCommerceConfig = {
  clientId: string;
  clientSecret: string;
  accountId?: string;
  authType: NaverAuthType;
};

export function getNaverConfig(): NaverCommerceConfig | null {
  const clientId = process.env.NAVER_COMMERCE_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_COMMERCE_CLIENT_SECRET?.trim();
  const accountId = process.env.NAVER_COMMERCE_ACCOUNT_ID?.trim();
  const authType = (process.env.NAVER_COMMERCE_AUTH_TYPE?.trim() || "SELF") as NaverAuthType;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (authType === "SELLER" && !accountId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    accountId: accountId || undefined,
    authType: authType === "SELLER" ? "SELLER" : "SELF",
  };
}

export function requireNaverConfig(): NaverCommerceConfig {
  const config = getNaverConfig();
  if (!config) {
    throw new NaverConfigError(
      "네이버 커머스 API 설정이 없습니다. .env.local에 NAVER_COMMERCE_CLIENT_ID / NAVER_COMMERCE_CLIENT_SECRET" +
        " (SELLER 유형이면 NAVER_COMMERCE_ACCOUNT_ID 포함)를 설정한 뒤 서버를 다시 시작해주세요."
    );
  }
  return config;
}

export class NaverConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaverConfigError";
  }
}
