import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateDL() {
  console.log("🚀 [DL이앤씨] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const dlDescription = `기업소개:
1939년 부림상회로 시작한 DL이앤씨(구 대림산업)는 대한민국 건설 역사의 효시이자, 지난 80여 년간 업계를 선도해 온 신뢰의 기업입니다. 경부고속도로, 국회의사당, 소양강댐 등 국가 핵심 인프라 구축의 모든 역동적 순간에 함께해 왔습니다. 세계 최대 규모의 현수교인 터키 차나칼레 대교를 성공적으로 완공하며 독보적인 기술력을 전 세계에 증명했으며, 국내 최초의 아파트 브랜드와 하이엔드 브랜드 '아크로(ACRO)'를 통해 새로운 주거 기준을 정립했습니다.

기업이념:
- 정직과 신뢰: 창업주 이재준 회장님의 철학을 바탕으로, 편법 대신 정도(正道)를 걷는 기업 문화를 추구합니다.
- 고객 가치 창출: 최고의 품질과 기술력으로 고객의 기대를 뛰어넘는 가치를 제공하며, 한 번 맺은 인연을 소중히 여깁니다.
- 도전과 혁신: 현실에 안주하지 않고 끊임없는 기술 개발과 경영 혁신으로 미래 시장을 개척합니다.

경영목표: 
Sustainable Global Developer (글로벌 디벨로퍼 도약) / Safety Without Compromise (타협 없는 안전) / Eco-Friendly Innovation (친환경 신사업 육성)

주요사업: 
주택사업(아크로, e편한세상) / 토목사업(초장대교, 터널) / 플랜트사업(석유화학, CCUS) / 에너지사업`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${dlDescription},
        "updatedAt" = ${now}
      WHERE "name" = 'DL이앤씨'
    `;
    console.log("✅ DL이앤씨 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateDL();
