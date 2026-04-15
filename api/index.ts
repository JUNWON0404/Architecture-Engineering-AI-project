import "dotenv/config";
import { createExpressApp } from "../server/_core/index";

/**
 * Vercel Serverless Function Handler
 * 모든 에러를 가로채어 JSON으로 응답함으로써 'Unexpected token A'를 방지함.
 */
let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log("[Vercel] 앱 초기화 중...");
      cachedApp = await createExpressApp();
    }
    
    // Express 앱 실행
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("[Vercel] 핸들러 에러 발생:", err);
    
    // Vercel 기본 에러 페이지가 나가지 않도록 JSON 응답 강제
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.url
    });
  }
}
