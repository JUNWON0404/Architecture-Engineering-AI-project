export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Vite OAuth 포털 + 앱 ID가 있을 때만 로그인 URL을 만들 수 있습니다. */
export function isOAuthPortalConfigured(): boolean {
  const base = String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim();
  const appId = String(import.meta.env.VITE_APP_ID ?? "").trim();
  return Boolean(base && appId);
}

/**
 * 런타임에 현재 origin 기준 redirect URI로 로그인 URL을 만듭니다.
 * OAuth가 설정되지 않았거나 URL이 잘못된 경우 `null`.
 */
export function getLoginUrl(): string | null {
  if (typeof window === "undefined") return null;
  const base = String(import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim().replace(/\/+$/, "");
  const appId = String(import.meta.env.VITE_APP_ID ?? "").trim();
  if (!base || !appId) return null;

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${base}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch {
    return null;
  }
}
