import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

async function fixSchema() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL missing");
    return;
  }

  const sql = postgres(url, { ssl: "require" });

  try {
    console.log("🛠️  Checking and fixing 'companies' table schema...");
    
    // 필수 컬럼 추가 (존재하지 않을 경우에만)
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS "rank" integer;`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS "brand" text;`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS "hiringSeason" text;`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS "salaryGuide" text;`;
    
    console.log("✅ Schema update completed!");
    
    // 시딩 다시 시도
    console.log("🚀 Seeding data...");
    // 시딩 로직을 여기에 직접 넣거나 시딩 스크립트 호출
  } catch (error) {
    console.error("❌ Schema fix failed:", error.message);
  } finally {
    await sql.end();
  }
}

fixSchema();
