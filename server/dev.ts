import { createExpressApp } from "./_core/index";

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createExpressApp();
    app.listen(port, () => {
      console.log(`[Local Dev] Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("[Local Dev] Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
