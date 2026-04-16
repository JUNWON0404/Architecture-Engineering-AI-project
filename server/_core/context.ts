import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// 로컬 개발 환경용 임시 사용자
const DEV_USER: User = {
  id: 1,
  openId: "dev-user-id",
  email: "dev@example.com",
  password: "",
  name: "개발 사용자",
  loginMethod: "email",
  role: "user",
  bio: "",
  targetJob: "",
  targetCompany: "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastSignedIn: Date.now(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    console.warn("[Auth] authenticateRequest failed:", String(error));
    user = null;
  }

  // 데이터베이스가 연결되지 않았거나 로그인이 실패한 경우, 로컬 개발 시에는 임시 사용자로 로그인 처리
  if (!user && process.env.NODE_ENV === "development") {
    console.warn("[Auth] Using DEV_USER fallback for local development");
    user = DEV_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
