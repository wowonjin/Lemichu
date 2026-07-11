import "server-only";

import {
  getNaverLoginConfig,
  NAVER_PROFILE_URL,
  NAVER_TOKEN_URL,
} from "@/lib/naver-login/config";

export type NaverProfile = {
  id: string;
  email?: string;
  name?: string;
  nickname?: string;
  profileImage?: string;
  mobile?: string;
};

type NaverTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: string;
  error?: string;
  error_description?: string;
};

type NaverProfileResponse = {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
    mobile?: string;
  };
};

export async function exchangeNaverCode(
  code: string,
  redirectUri: string,
  state: string
) {
  const { clientId, clientSecret } = getNaverLoginConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    state,
    redirect_uri: redirectUri,
  });

  const response = await fetch(NAVER_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
    cache: "no-store",
  });

  const result = (await response.json()) as NaverTokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description || result.error || "네이버 토큰 발급에 실패했습니다."
    );
  }

  return result.access_token;
}

export async function fetchNaverProfile(accessToken: string): Promise<NaverProfile> {
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = (await response.json()) as NaverProfileResponse;

  if (!response.ok || result.resultcode !== "00" || !result.response?.id) {
    throw new Error(result.message || "네이버 프로필 조회에 실패했습니다.");
  }

  const profile = result.response;
  const id = profile.id as string;

  return {
    id,
    email: profile.email?.trim() || undefined,
    name: profile.name?.trim() || undefined,
    nickname: profile.nickname?.trim() || undefined,
    profileImage: profile.profile_image?.trim() || undefined,
    mobile: profile.mobile?.trim() || undefined,
  };
}

export function buildNaverUid(naverId: string) {
  return `naver:${naverId}`;
}
