import "server-only";

import {
  getKakaoLoginConfig,
  KAKAO_PROFILE_URL,
  KAKAO_TOKEN_URL,
} from "@/lib/kakao-login/config";

export type KakaoProfile = {
  id: string;
  email?: string;
  name?: string;
  nickname?: string;
  profileImage?: string;
  mobile?: string;
};

type KakaoTokenResponse = {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type KakaoProfileResponse = {
  id?: number | string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email_needs_agreement?: boolean;
    name?: string;
    name_needs_agreement?: boolean;
    phone_number?: string;
    phone_number_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
  msg?: string;
};

export async function exchangeKakaoCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getKakaoLoginConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
    cache: "no-store",
  });

  const result = (await response.json()) as KakaoTokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description || result.error || "카카오 토큰 발급에 실패했습니다."
    );
  }

  return result.access_token;
}

function toHttpsUrl(url?: string) {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`;
  return undefined;
}

function normalizeKakaoPhone(value?: string) {
  if (!value) return undefined;

  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("82") ? `0${digits.slice(2)}` : digits;

  if (local.length === 10) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }

  if (local.length === 11) {
    return `${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }

  return undefined;
}

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const response = await fetch(KAKAO_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const result = (await response.json()) as KakaoProfileResponse;
  const id = result.id == null ? "" : String(result.id);

  if (!response.ok || !id) {
    throw new Error(result.msg || "카카오 프로필 조회에 실패했습니다.");
  }

  const account = result.kakao_account;
  const canUseEmail =
    Boolean(account?.email?.trim()) &&
    account?.email_needs_agreement !== true &&
    account?.is_email_valid !== false;
  const canUseName = Boolean(account?.name?.trim()) && account?.name_needs_agreement !== true;
  const canUsePhone =
    Boolean(account?.phone_number?.trim()) && account?.phone_number_needs_agreement !== true;

  return {
    id,
    email: canUseEmail ? account?.email?.trim() : undefined,
    name: canUseName ? account?.name?.trim() : undefined,
    nickname:
      account?.profile?.nickname?.trim() || result.properties?.nickname?.trim() || undefined,
    profileImage: toHttpsUrl(
      account?.profile?.profile_image_url || result.properties?.profile_image
    ),
    mobile: canUsePhone ? normalizeKakaoPhone(account?.phone_number) : undefined,
  };
}

export function buildKakaoUid(kakaoId: string) {
  return `kakao:${kakaoId}`;
}
