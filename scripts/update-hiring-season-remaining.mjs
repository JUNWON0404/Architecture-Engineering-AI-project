import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const updates = [
  { name: "현대엔지니어링", season: "하반기(9월) 대규모 공채" },
  { name: "한화(건설부문)", season: "상반기 인턴(5월) / 하반기 공채(10월)" },
  { name: "DL건설", season: "하반기(11월) 중심 정기채용" },
  { name: "두산에너빌리티", season: "상반기(5월) 채용연계형 인턴" },
  { name: "코오롱글로벌", season: "상반기(1월) / 하반기(6월) 인턴십" },
  { name: "금호건설", season: "상반기(5월) / 하반기(9월)" },
  { name: "호반건설", season: "하반기(10월) 대규모 공채" },
  { name: "계룡건설산업", season: "상반기(5월) / 하반기(10월)" },
  { name: "제일건설", season: "상반기(2월) 및 수시채용" },
  { name: "서희건설", season: "상시 채용 (인재DB 중심)" },
  { name: "태영건설", season: "수시 채용 (현장 관리직)" },
  { name: "중흥토건", season: "상반기(3월) / 하반기(9월)" },
  { name: "대반건설", season: "상시 및 수시채용" }
];

async function updateHiringSeason() {
  console.log("🚀 나머지 건설사 공채 시즌 데이터 업데이트 시작...");
  try {
    for (const item of updates) {
      await sql`
        UPDATE companies 
        SET "hiringSeason" = ${item.season}, "updatedAt" = ${Date.now()}
        WHERE name = ${item.name}
      `;
      console.log(`✅ ${item.name} -> ${item.season} 업데이트 완료`);
    }
    console.log("\n✨ 모든 기업의 데이터 업데이트가 완료되었습니다!");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateHiringSeason();
