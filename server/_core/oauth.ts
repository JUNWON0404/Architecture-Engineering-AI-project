import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { IRouter, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getGoogleRedirectUri(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

export function registerOAuthRoutes(app: IRouter) {
  // Google OAuth - 인증 시작
  app.get("/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).send("GOOGLE_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);
    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Google OAuth - 콜백 처리
  app.get("/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");

    if (error || !code) {
      console.error("[Google OAuth] Callback error:", error);
      res.redirect(302, "/login?error=google_auth_failed");
      return;
    }

    try {
      const redirectUri = getGoogleRedirectUri(req);

      // 코드를 액세스 토큰으로 교환
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        throw new Error(`Token exchange failed: ${text}`);
      }

      const tokenData = await tokenRes.json() as { access_token: string };

      // 사용자 정보 조회
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        throw new Error("Failed to fetch Google user info");
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;
        email: string;
        name: string;
        picture?: string;
      };

      const now = Date.now();
      await db.upsertUser({
        openId: `google:${userInfo.sub}`,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });

      const sessionToken = await sdk.createSessionToken(`google:${userInfo.sub}`, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/dashboard");
    } catch (err) {
      console.error("[Google OAuth] Callback failed:", err);
      res.redirect(302, "/login?error=google_auth_failed");
    }
  });

  // 기존 Manus OAuth 콜백 유지
  app.get("/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const now = Date.now();
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
