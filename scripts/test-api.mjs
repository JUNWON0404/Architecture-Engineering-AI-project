import { trpcClient } from "../server/_core/index.js";
// 직접 서버 함수 호출
import { getAllCompanies, getJobPostingsByCompanyId } from "../server/db.js";

console.log("🧪 API 테스트\n");

console.log("1️⃣ getAllCompanies 호출:");
try {
  const companies = await getAllCompanies();
  console.log(`   ✓ 반환 데이터:`, companies.length, "개");
  companies.forEach(c => {
    console.log(`     - [${c.id}] ${c.name}`);
  });
} catch (error) {
  console.error("   ✗ 에러:", error.message);
}

console.log("\n2️⃣ getJobPostingsByCompanyId(1) 호출:");
try {
  const jobs = await getJobPostingsByCompanyId(1);
  console.log(`   ✓ 반환 데이터:`, jobs.length, "개");
  jobs.forEach(j => {
    console.log(`     - [${j.id}] ${j.title}`);
  });
} catch (error) {
  console.error("   ✗ 에러:", error.message);
}

console.log("\n✅ 테스트 완료");
process.exit(0);
