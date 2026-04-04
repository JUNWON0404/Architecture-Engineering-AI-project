import "dotenv/config";
import { getDb, getAllCompanies } from "../server/db";

console.log("🔍 DB 함수 테스트\n");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function test() {
  try {
    console.log("1️⃣ getDb() 호출:");
    const db = await getDb();
    if (!db) {
      console.log("   ✗ DB가 null입니다!");
      process.exit(1);
    }
    console.log("   ✓ DB 인스턴스 생성 성공");

    console.log("\n2️⃣ getAllCompanies() 호출:");
    const companies = await getAllCompanies();
    console.log(`   ✓ 타입: ${typeof companies}`);
    console.log(`   ✓ 배열 여부: ${Array.isArray(companies)}`);
    console.log(`   ✓ 길이: ${companies?.length || 0}`);
    
    if (Array.isArray(companies) && companies.length > 0) {
      console.log(`   ✓ 첫번째 데이터:`, JSON.stringify(companies[0], null, 2));
    } else {
      console.log("   ⚠️ 회사 데이터가 없습니다");
    }
  } catch (error) {
    console.error("✗ 에러:", error);
    process.exit(1);
  }

  console.log("\n✅ 테스트 완료");
  process.exit(0);
}

test();
