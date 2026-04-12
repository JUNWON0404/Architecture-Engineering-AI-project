import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateGS() {
  console.log("🚀 [GS건설] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const gsDescription = `기업소개:
1969년 설립된 GS건설은 '최고의 가치를 창출하여 고객과 함께 성장하는 글로벌 기업'을 목표로 달려왔습니다. 국내 아파트 시장에서 압도적인 선호도를 자랑하는 브랜드 '자이(Xi)'를 통해 주거 문화의 패러다임을 바꿨으며, 에너지·환경 플랜트 분야에서도 세계적인 경쟁력을 보유하고 있습니다. 최근에는 투명한 신뢰와 끊임없는 혁신을 담은 새로운 비전을 선포하며, 단순한 건설사를 넘어 사회적 책임을 다하고 고객의 더 나은 삶을 책임지는 'Total Solution Provider'로 도약하고 있습니다.

기업이념:
- 고객지향: 모든 의사결정의 기준을 고객에 두고, 고객이 진정으로 원하는 가치를 제공합니다.
- 신뢰: 투명한 경영과 약속 이행으로 이해관계자들과의 신뢰를 구축합니다.
- 자율과 책임: 구성원의 자율성을 존중하되 결과에 대한 책임을 다하는 성숙한 조직 문화를 지향합니다.
- 미래지향: 현재의 성공에 안주하지 않고 변화를 주도하며 지속가능한 미래를 준비합니다.

경영목표: 
Brand Reconstruction (신뢰 회복) / New Energy Solution (친환경 사업 확장) / Safety & Quality First (안전 관리 강화)

주요사업: 
주택건축사업(자이) / 인프라사업(철도, 교량) / 플랜트사업(석유화학, 에너지) / 신사업(수처리, 모듈러 주택)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${gsDescription},
        "updatedAt" = ${now}
      WHERE "name" = 'GS건설'
    `;
    console.log("✅ GS건설 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateGS();
