import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateSK() {
  console.log("🚀 [SK에코플랜트] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const skDescription = `기업소개:
1977년 설립된 SK건설은 2021년 'SK에코플랜트'로 사명을 변경하며, 건설을 넘어 지구를 위한 환경 및 에너지 솔루션 기업으로의 대전환을 선언했습니다. 단순한 시공을 넘어 폐기물 처리, 수처리 등 환경 사업 전 과정(Value Chain)을 내재화한 아시아 최대의 환경 솔루션 기업으로 도약했습니다. 해상풍력, 태양광 등 신재생 에너지 사업과 함께 탄소 중립 사회 실현을 위한 기술 개발에 매진하며, '미래를 위한 푸른 해결사'로서 건설업의 새로운 패러다임을 열고 있습니다.

기업이념:
- SUPEX (Super Excellent): 인간의 능력으로 도달할 수 있는 최고 수준을 목표로 끊임없이 혁신합니다.
- 지속가능한 가치 창출: 사회적 가치와 경제적 가치를 동시에 추구하는 ESG 경영을 실천합니다.
- 신뢰와 창의: 정직한 경영으로 신뢰를 얻고, 유연한 사고로 미래형 솔루션을 제안합니다.

경영목표: 
Environment-Energy Hub (글로벌 환경 허브 도약) / Net Zero Catalyst (그린 에너지 선도) / Smart & Safe Solution (데이터 기반 미래 엔지니어링)

주요사업: 
환경사업(리사이클링, 수처리) / 에너지사업(해상풍력, 수소) / 솔루션사업(하이테크, 데이터센터, 주거)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${skDescription},
        "updatedAt" = ${now}
      WHERE "name" = 'SK에코플랜트'
    `;
    console.log("✅ SK에코플랜트 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateSK();
