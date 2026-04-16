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
  // 환경변수로 고정 URL 지정 가능 (Vercel 배포 시 권장)
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  // x-forwarded-proto 헤더는 "https,https" 처럼 복수로 올 수 있으므로 첫 번째 값만 사용
  const rawProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(rawProto) ? rawProto[0] : rawProto?.split(",")[0]?.trim()) ?? req.protocol;
  const rawHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost) ?? req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

export function registerOAuthRoutes(app: IRouter) {
  // Google OAuth - 인증 시작
  app.get("/auth/google", (req: Request, res: Response) => {
    console.log("[OAuth] GOOGLE_CLIENT_ID set:", !!ENV.googleClientId, "| NODE_ENV:", process.env.NODE_ENV);
    if (!ENV.googleClientId) {
      console.error("[OAuth] Missing GOOGLE_CLIENT_ID. Available env keys:", Object.keys(process.env).filter(k => k.startsWith("GOOGLE")));
      res.status(500).send("GOOGLE_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }

    const redirectUri = getGoogleRedirectUri(req);
    console.log("[OAuth] redirect_uri:", redirectUri);
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
      console.log("[Google OAuth] Step 1: token exchange, redirect_uri:", redirectUri);

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
        throw new Error(`Step 1 failed - Token exchange: ${text}`);
      }
      console.log("[Google OAuth] Step 1: OK");

      const tokenData = await tokenRes.json() as { access_token: string };

      console.log("[Google OAuth] Step 2: fetch user info");
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        throw new Error(`Step 2 failed - User info: ${userInfoRes.status}`);
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;
        email: string;
        name: string;
        picture?: string;
      };
      console.log("[Google OAuth] Step 2: OK, email:", userInfo.email);

      const now = Date.now();
      const googleOpenId = `google:${userInfo.sub}`;
      console.log("[Google OAuth] Step 3: upsertUser, openId:", googleOpenId);
      await db.upsertUser({
        openId: googleOpenId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });
      console.log("[Google OAuth] Step 3: OK");

      if (!ENV.cookieSecret) {
        throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 확인하세요.");
      }

      const sessionToken = await sdk.createSessionToken(googleOpenId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[Google OAuth] Step 3.5: sessionToken created, length:", sessionToken.length);

      // 이전 세션 쿠키(secure/non-secure 양쪽) 모두 제거 후 새 쿠키 설정
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.clearCookie(COOKIE_NAME, { path: "/", secure: true, sameSite: "lax" });
      const cookieOpts = { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS };
      console.log("[Google OAuth] Step 4: setting cookie, opts:", JSON.stringify(cookieOpts));
      res.cookie(COOKIE_NAME, sessionToken, cookieOpts);
      console.log("[Google OAuth] Step 4: Set-Cookie header:", res.getHeader("set-cookie"));

      res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logging in...</title></head><body><script>window.location.replace('/dashboard');</script></body></html>`);
    } catch (err) {
      console.error("[Google OAuth] Callback failed:", String(err));
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
