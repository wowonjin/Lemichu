import "server-only";

export const NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
export const NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
export const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

export const NAVER_OAUTH_STATE_COOKIE = "lemichu_naver_oauth_state";
export const NAVER_OAUTH_REDIRECT_COOKIE = "lemichu_naver_oauth_redirect";
export const NAVER_FIREBASE_TOKEN_COOKIE = "lemichu_naver_firebase_token";

export type NaverLoginConfig = {
  clientId: string;
  clientSecret: string;
};

export function getNaverLoginConfig(): NaverLoginConfig {
  const clientId = process.env.NAVER_LOGIN_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_LOGIN_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "네이버 로그인 설정이 없습니다. .env.local에 NAVER_LOGIN_CLIENT_ID / NAVER_LOGIN_CLIENT_SECRET을 설정한 뒤 서버를 다시 시작해주세요."
    );
  }

  return { clientId, clientSecret };
}

export function isNaverLoginConfigured() {
  return Boolean(
    process.env.NAVER_LOGIN_CLIENT_ID?.trim() &&
      process.env.NAVER_LOGIN_CLIENT_SECRET?.trim()
  );
}
