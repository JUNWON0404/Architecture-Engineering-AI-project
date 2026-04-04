import { defineConfig } from "drizzle-kit";

// SQLite는 파일 기반이므로 경로만 필요
// 예: file:./db.sqlite 또는 :memory:
const dbPath = process.env.DATABASE_URL || "file:./db.sqlite";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
