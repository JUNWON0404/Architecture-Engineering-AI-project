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

  // 헬스체크용
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
