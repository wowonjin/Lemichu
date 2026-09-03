import "server-only";

export const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
export const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
export const KAKAO_PROFILE_URL = "https://kapi.kakao.com/v2/user/me";

export const KAKAO_OAUTH_STATE_COOKIE = "lemichu_kakao_oauth_state";
export const KAKAO_OAUTH_REDIRECT_COOKIE = "lemichu_kakao_oauth_redirect";
export const KAKAO_FIREBASE_TOKEN_COOKIE = "lemichu_kakao_firebase_token";

export type KakaoLoginConfig = {
  clientId: string;
  clientSecret?: string;
};

export function getKakaoLoginConfig(): KakaoLoginConfig {
  const clientId = process.env.KAKAO_LOGIN_CLIENT_ID?.trim();
  const clientSecret = process.env.KAKAO_LOGIN_CLIENT_SECRET?.trim() || undefined;

  if (!clientId) {
    throw new Error(
      "카카오 로그인 설정이 없습니다. .env.local에 KAKAO_LOGIN_CLIENT_ID를 설정한 뒤 서버를 다시 시작해주세요."
    );
  }

  return { clientId, clientSecret };
}

export function isKakaoLoginConfigured() {
  return Boolean(process.env.KAKAO_LOGIN_CLIENT_ID?.trim());
}
