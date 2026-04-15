import { createTRPCContext } from '../server/_core/context';
import { appRouter } from '../server/routers';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';

const app = express();

// 기본 미들웨어
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// tRPC 앤드포인트 설정
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
}));

// Vercel 서버리스용 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
