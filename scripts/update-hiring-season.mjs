import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const updates = [
  { name: "삼성물산(건설부문)", season: "상반기(3월) / 하반기(9월)" },
  { name: "현대건설", season: "상반기(3월) / 하반기(9월)" },
  { name: "GS건설", season: "상반기(3월) / 하반기(9월)" },
  { name: "대우건설", season: "하반기(9월) 대규모 공채" },
  { name: "DL이앤씨", season: "하반기(9~10월) 정기 공채" },
  { name: "포스코이앤씨", season: "상반기(3월) / 하반기(9월)" },
  { name: "롯데건설", season: "채용연계형 인턴(6, 12월)" },
  { name: "SK에코플랜트", season: "상반기(3월) / 하반기(9월)" },
  { name: "HDC현대산업개발", season: "하반기(9월) 중심 정기 채용" }
];

async function updateHiringSeason() {
  console.log("🚀 주요 건설사 공채 시즌 데이터 업데이트 시작...");
  try {
    for (const item of updates) {
      const result = await sql`
        UPDATE companies 
        SET "hiringSeason" = ${item.season}, "updatedAt" = ${Date.now()}
        WHERE name = ${item.name}
      `;
      console.log(`✅ ${item.name} -> ${item.season} 업데이트 완료`);
    }
    console.log("\n✨ 데이터 업데이트가 성공적으로 완료되었습니다!");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateHiringSeason();
