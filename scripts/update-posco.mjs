import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updatePosco() {
  console.log("🚀 [포스코이앤씨] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const poscoDescription = `기업소개:
1994년 포스코그룹의 일원으로 출범한 포스코이앤씨는 제철 플랜트 시공에서 쌓은 독보적인 엔지니어링 역량을 바탕으로 건축, 토목, 플랜트 전 분야에서 비약적인 성장을 거듭해 왔습니다. 포스코의 고품질 강재를 활용한 차별화된 시공 기술과 스마트 건설 기법(BIM, 로보틱스)을 전 현장에 도입하여 업계 최고의 효율과 품질을 자랑합니다. 환경과 사회적 책임을 중시하는 '기업 시민' 경영 이념을 바탕으로 지속가능한 공간의 가치를 창출하고 있습니다.

기업이념:
- With POSCO (더불어 함께 발전하는 기업시민): 고객, 구성원, 협력사 등 모든 이해관계자와 공생의 발전을 추구합니다.
- 신뢰와 창의: 투명한 경영으로 신뢰를 얻고, 혁신적 사고로 새로운 해결책을 제시합니다.
- 도전과 열정: 포스코 특유의 개척 정신을 계승하여 최고를 향해 끊임없이 도전합니다.

경영목표: 
High-End Brand Strategy (오티에르 입지 강화) / Green Solution Provider (친환경 에너지 인프라 주도) / Digital Construction Innovation (스마트 건설 고도화)

주요사업: 
플랜트사업(이차전지, 수소) / 주택건축사업(더샵, 오티에르) / 토목사업(SOC, 신재생 에너지) / 글로벌 인프라사업`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${poscoDescription},
        "updatedAt" = ${now}
      WHERE "name" = '포스코이앤씨'
    `;
    console.log("✅ 포스코이앤씨 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updatePosco();
