import { createTRPCContext } from '../server/_core/context';
import { appRouter } from '../server/routers';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';

const app = express();

// CORS 및 미들웨어 설정
app.use(cors());
app.use(express.json());

// tRPC 미들웨어 연결
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
}));

// 헬스체크용
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
