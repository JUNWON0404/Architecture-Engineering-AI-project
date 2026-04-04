import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = "./db.sqlite";

console.log("📁 Connecting to database:", dbPath);

try {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);
  
  console.log("✅ Database connected");
  
  // Run migrations
  console.log("🔄 Running migrations...");
  const migrationsFolder = path.join(__dirname, "drizzle", "migrations");
  console.log("📂 Migrations folder:", migrationsFolder);
  
  migrate(db, { migrationsFolder });
  console.log("✅ Migrations completed");
  
  // Check tables
  console.log("\n📋 Checking tables...");
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables found:", tables.length);
  tables.forEach(t => {
    console.log("  -", t.name);
  });
  
  // Check users table schema
  if (tables.some(t => t.name === "users")) {
    console.log("\n👤 Users table schema:");
    const schema = sqlite.prepare("PRAGMA table_info(users)").all();
    schema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });
  }
  
  sqlite.close();
  console.log("\n✅ All checks passed!");
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error);
  process.exit(1);
}
