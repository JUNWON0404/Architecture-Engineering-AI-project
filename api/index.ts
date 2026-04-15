import { createTRPCContext } from '../server/_core/context.js';
import { appRouter } from '../server/routers.js';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';

const app = express();

// 상세 에러 로그를 위한 미들웨어
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// tRPC 앤드포인트
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
}));

// 헬스체크 및 환경변수 진단
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    timestamp: Date.now() 
  });
});

// 전역 에러 핸들러
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
