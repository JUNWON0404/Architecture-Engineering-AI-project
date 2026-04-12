import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const employeeData = [
  { name: "삼성물산(건설부문)", count: "5,933명" },
  { name: "현대건설", count: "6,900명" },
  { name: "대우건설", count: "5,503명" },
  { name: "현대엔지니어링", count: "6,770명" },
  { name: "DL이앤씨", count: "4,742명" },
  { name: "GS건설", count: "5,483명" },
  { name: "포스코이앤씨", count: "5,927명" },
  { name: "롯데건설", count: "3,676명" },
  { name: "SK에코플랜트", count: "3,688명" },
  { name: "HDC현대산업개발", count: "1,855명" },
  { name: "한화(건설부문)", count: "2,113명" },
  { name: "호반건설", count: "1,101명" },
  { name: "DL건설", count: "1,275명" },
  { name: "두산에너빌리티", count: "5,580명" },
  { name: "제일건설", count: "622명" },
  { name: "중흥토건", count: "488명" },
  { name: "계룡건설산업", count: "1,858명" },
  { name: "서희건설", count: "723명" },
  { name: "코오롱글로벌", count: "2,745명" },
  { name: "금호건설", count: "1,281명" }
];

async function updateEmployees() {
  console.log("🚀 건설사별 최신 정밀 인원수(2024 상반기 공시 기준) 업데이트 시작...");
  const now = Date.now();
  
  try {
    for (const item of employeeData) {
      await sql`
        UPDATE companies SET 
          "employees" = ${item.count},
          "updatedAt" = ${now}
        WHERE "name" LIKE ${'%' + item.name + '%'}
      `;
      console.log(`✅ ${item.name}: ${item.count} 업데이트 완료`);
    }
    console.log("\n✨ 인원수 데이터 최신화 완료!");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateEmployees();
