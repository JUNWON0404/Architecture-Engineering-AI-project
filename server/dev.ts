import http from "http";
import { createExpressApp } from "./_core/index";
import { setupVite } from "./_core/vite";

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createExpressApp();
    const server = http.createServer(app);

    // 개발 환경에서는 Vite 데브 서버를 Express에 통합
    if (process.env.NODE_ENV === "development") {
      console.log("[Local Dev] Setting up Vite dev server...");
      await setupVite(app, server);
    }

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`[Local Dev] 포트 ${port}가 이미 사용 중입니다.`);
        console.error(`[Local Dev] 해결: 기존 프로세스를 종료 후 재시작하세요.`);
        console.error(`[Local Dev]   Windows: netstat -ano | findstr :${port}  → taskkill /PID <pid> /F`);
      } else {
        console.error("[Local Dev] 서버 에러:", err);
      }
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`[Local Dev] Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("[Local Dev] Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
