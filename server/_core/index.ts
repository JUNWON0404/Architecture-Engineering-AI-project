import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDb } from "../db";

export async function createExpressApp() {
  const app = express();
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Logging middleware for debugging
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });
  
  // Vercel/Serverless 환경을 위한 라우터 설정
  // Vercel rewrites에 의해 /api/trpc/... 요청이 이 앱으로 들어옴
  const apiRouter = express.Router();
  
  // OAuth callback (/api/auth/...)
  registerOAuthRoutes(apiRouter);
  
  // tRPC API (/api/trpc/...)
  apiRouter.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 모든 API 요청을 /api 프리픽스로 처리
  app.use("/api", apiRouter);
  
  // Vercel에서 /api 가 이미 스트립된 경우를 위해 루트에도 마운트
  app.use("/", apiRouter);

  // 헬스체크용
  app.get("/health", (req, res) => res.send("OK"));
  app.get("/api/health", (req, res) => res.send("OK"));

  return app;
}

const appPromise = createExpressApp();

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // DB 연결 시도 (비동기)
  getDb().catch(err => console.error("[Database] Init error:", err));
  
  const app = await appPromise;
  return app(req, res);
}
