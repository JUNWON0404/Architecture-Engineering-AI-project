import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const companiesData = [
  { 
    name: "삼성물산(건설부문)", 
    rank: 1, 
    brand: "래미안", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Samsung_C%26T_Corporation_logo.svg/512px-Samsung_C%26T_Corporation_logo.svg.png",
    website: "https://www.secc.co.kr" 
  },
  { 
    name: "현대건설", 
    rank: 2, 
    brand: "힐스테이트/디에이치", 
    thumbnail: "https://www.hdec.kr/assets/images/common/logo.png",
    website: "https://www.hdec.kr" 
  },
  { 
    name: "대우건설", 
    rank: 3, 
    brand: "푸르지오/써밋", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Daewoo_E%26C_logo.svg/512px-Daewoo_E%26C_logo.svg.png",
    website: "https://www.daewooenc.com" 
  },
  { 
    name: "현대엔지니어링", 
    rank: 4, 
    brand: "힐스테이트", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/ko/thumb/d/d0/%ED%98%84%EB%8C%80%EA%B1%B4%EC%84%A4_%EB%A1%9C%EA%B3%A0.svg/512px-%ED%98%84%EB%8C%80%EA%B1%B4%EC%84%A4_%EB%A1%9C%EA%B3%A0.svg.png",
    website: "https://www.hec.co.kr" 
  },
  { 
    name: "DL이앤씨", 
    rank: 5, 
    brand: "e편한세상/아크로", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/ko/thumb/5/5a/DL%EA%B7%B8%EB%B3%B9_%EB%A1%9C%EA%B3%A0.svg/512px-DL%EA%B7%B8%EB%B3%B9_%EB%A1%9C%EA%B3%A0.svg.png",
    website: "https://www.dlenc.co.kr" 
  },
  { 
    name: "GS건설", 
    rank: 6, 
    brand: "자이", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/GS_Group_logo.svg/512px-GS_Group_logo.svg.png",
    website: "https://www.gsenc.com" 
  },
  { 
    name: "포스코이앤씨", 
    rank: 7, 
    brand: "더샵/오티에르", 
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/POSCO_logo.svg/512px-POSCO_logo.svg.png",
    website: "https://www.poscoenc.com" 
  }
];

async function seed() {
  console.log("🚀 고해상도 로고 데이터 반영 시작...");
  const now = Date.now();
  try {
    for (const company of companiesData) {
      await sql`
        UPDATE companies SET 
          "thumbnail" = ${company.thumbnail},
          "updatedAt" = ${now}
        WHERE "name" = ${company.name}
      `;
      console.log(`✅ ${company.name} 로고 업데이트 완료`);
    }
    console.log("\n✨ 주요 기업 고해상도 로고 반영 완료!");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

seed();
