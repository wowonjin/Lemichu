const defaultPostLoginPath = "/my";

export function normalizeRedirectPath(
  redirectPath: string | null | undefined,
  fallback = defaultPostLoginPath
) {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return fallback;
  }

  if (redirectPath.startsWith("/login") || redirectPath.startsWith("/signup")) {
    return fallback;
  }

  return redirectPath;
}

export function getLoginHref(redirectPath: string | null | undefined) {
  const normalized = normalizeRedirectPath(redirectPath);
  return `/login?redirect=${encodeURIComponent(normalized)}`;
}

export function readPostLoginPath(searchParams: URLSearchParams) {
  return normalizeRedirectPath(
    searchParams.get("redirect") ?? searchParams.get("returnUrl")
  );
}
