import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateDaewoo() {
  console.log("🚀 [대우건설] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const daewooDescription = `기업소개:
대우건설은 1973년 창업주 김우중 회장님의 "세계는 넓고 할 일은 많다"라는 원대한 포부 아래 설립되었습니다. 한국 건설 역사상 가장 공격적인 해외 시장 개척자였으며, 나이지리아와 리비아 등 불모지에서 대한민국 건설의 위상을 높여왔습니다. 기술에 대한 집요함과 '하면 된다'는 투지, 그리고 창의적인 해법이 오늘의 대우건설을 만들었습니다. 단순한 건설사를 넘어 에너지와 주거 문화를 선도하는 글로벌 파이오니어로 진화하고 있습니다.

기업이념:
- Challenge (도전): 남들이 불가능하다고 말하는 시장에 가장 먼저 뛰어들어 길을 만듭니다. 나이지리아 LNG 플랜트 시장의 원청 수주가 그 증거입니다.
- Passion (열정): 불가능한 공기를 단축하고 난공사를 해결하며, 프로젝트에 생명력을 불어넣는 뜨거운 열정을 지향합니다.
- Creativity (창조): 기존의 관습을 깨는 새로운 시공법과 부동산 개발 모델로 고객에게 최고의 부가가치를 제공합니다.

경영목표: 
Your Dream, Our Space (미래 가치 창조) / Stability & Growth (내실 경영 강화) / Quality & Safety (책임 경영 정착)

주요사업: 
플랜트사업(LNG, 에너지) / 주택건축사업(푸르지오, 써밋) / 토목사업(도로, 교량, 항만) / 신사업(해상풍력, 디벨로퍼)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${daewooDescription},
        "updatedAt" = ${now}
      WHERE "name" = '대우건설'
    `;
    console.log("✅ 대우건설 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateDaewoo();
