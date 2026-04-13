import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env file");
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

const COMPANY_KEYWORDS = [
  { name: "삼성물산", keywords: "Integrity, 상생협력, 실행력, 글로벌마인드" },
  { name: "현대건설", keywords: "도전정신, 시너지발휘, 전문성, 정직청렴" },
  { name: "대우건설", keywords: "열정, 자율과책임, 도전과열정, 변화기여" },
  { name: "현대엔지니어링", keywords: "고객최우선, 도전적실행, 소통과협력, 인재존중" },
  { name: "GS건설", keywords: "자율과책임, 전문성, 소통과협력, 변화기여" },
  { name: "DL이앤씨", keywords: "절대적품질, 고객만족, 혁신추구, 안전우선" },
  { name: "포스코이앤씨", keywords: "주인의식, 상생, 안전제일, 기술혁신" },
  { name: "롯데건설", keywords: "창의, 열정, 도전, 실행력" },
  { name: "SK에코플랜트", keywords: "패기, 상호주의, 혁신, 실행중심" },
  { name: "HDC현대산업개발", keywords: "열정, 창의, 협력, 실행력" }
];

async function updateKeywords() {
  console.log("🚀 기업별 핵심 키워드 업데이트 시작...");
  
  for (const item of COMPANY_KEYWORDS) {
    await db.update(schema.companies)
      .set({ keywords: item.keywords })
      .where(eq(schema.companies.name, item.name));
    console.log(`✅ ${item.name} 키워드 업데이트 완료: [${item.keywords}]`);
  }

  console.log("✨ 모든 키워드 업데이트 완료!");
  process.exit(0);
}

updateKeywords().catch((err) => {
  console.error("❌ 업데이트 실패:", err);
  process.exit(1);
});
