import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {}

  private decodeState(state: string): string {
    try { return atob(state); } catch (e) { return state; }
  }

  async getTokenByCode(code: string, state: string): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };
    const { data } = await this.client.post<ExchangeTokenResponse>(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }

  async getUserInfoByToken(token: ExchangeTokenResponse): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(GET_USER_INFO_PATH, {
      accessToken: token.accessToken,
    });
    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: 1000, // 타임아웃을 1초로 단축
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;
  
  // 개발용 캐시 (성능 최적화 핵심)
  private static _devUserCache: User | null = null;
  private static _isSystemOffline = false;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(platforms: unknown, fallback: string | null | undefined): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(platforms.filter((p): p is string => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    return "other";
  }

  async exchangeCodeForToken(code: string, state: string): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({ accessToken } as any);
    const loginMethod = this.deriveLoginMethod((data as any)?.platforms, (data as any)?.platform);
    return { ...(data as any), platform: loginMethod, loginMethod } as any;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return new SignJWT({ openId, appId: ENV.appId, name: options.name || "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null) {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      return payload as any;
    } catch (error) { return null; }
  }

  async getUserInfoWithJwt(jwtToken: string): Promise<GetUserInfoWithJwtResponse> {
    const { data } = await this.client.post(GET_USER_INFO_WITH_JWT_PATH, { jwtToken, projectId: ENV.appId });
    return data as any;
  }

  async authenticateRequest(req: Request): Promise<User> {
    // 1. 세션 확인
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    // 2. 개발 모드 Fast Fallback (시스템이 오프라인이면 즉시 캐시 반환)
    if (process.env.NODE_ENV === "development" && SDKServer._isSystemOffline && SDKServer._devUserCache) {
      return SDKServer._devUserCache;
    }

    const openId = session.openId;
    
    try {
      // 3. DB 사용자 조회
      let user = await db.getUserByOpenId(openId);

      if (!user) {
        // 4. DB에 없으면 OAuth 연동 시도 (타임아웃 1초)
        try {
          const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
          await db.upsertUser({
            openId: userInfo.openId,
            name: userInfo.name || "User",
            email: userInfo.email || null,
            loginMethod: userInfo.loginMethod || "oauth",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastSignedIn: Date.now(),
          });
          user = await db.getUserByOpenId(openId);
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            SDKServer._isSystemOffline = true;
            SDKServer._devUserCache = {
              id: 1, openId, name: session.name || "Dev User", email: "dev@localhost",
              role: "user", createdAt: Date.now(), updatedAt: Date.now(), lastSignedIn: Date.now()
            } as any;
            return SDKServer._devUserCache!;
          }
          throw e;
        }
      }

      if (!user) throw ForbiddenError("User not found");

      // 비동기로 로그인 시간 업데이트 (응답 대기 안함)
      db.upsertUser({ ...user, lastSignedIn: Date.now() }).catch(() => {});

      return user;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        SDKServer._isSystemOffline = true;
        SDKServer._devUserCache = { id: 1, openId, name: session.name || "Dev User" } as any;
        return SDKServer._devUserCache!;
      }
      throw error;
    }
  }
}

export const sdk = new SDKServer();
