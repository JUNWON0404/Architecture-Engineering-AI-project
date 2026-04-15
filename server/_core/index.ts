import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Express 앱 생성 함수
 * Vercel 등 서버리스 환경에서 안전하게 호출하기 위해 최상위 실행 코드를 제거함.
 */
export async function createExpressApp() {
  const app = express();
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Vercel/Serverless 환경을 위한 라우터 설정
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
  
  // 루트 경로 대응 (Vercel 리라이트 대응)
  app.use("/", apiRouter);

  // 헬스체크용
  app.get("/health", (req, res) => res.send("OK"));
  app.get("/api/health", (req, res) => res.send("OK"));

  return app;
}
