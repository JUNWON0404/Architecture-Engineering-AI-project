import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function refineHyundai() {
  console.log("🚀 [현대건설] 경영목표 및 상세 리포트 통일성 강화 작업 시작...");
  const now = Date.now();
  
  const hyundaiDescription = `기업소개:
현대건설은 1947년 현대토건사 라는 이름으로 시작되었습니다. 고 정주영 명예회장님의 '된다는 확신 90%와 반드시 되게 할 수 있다는 자신감 10%'라는 불굴의 개척정신으로 세워진 대한민국 건설의 종가(宗家)입니다. 올해로 창립 70주년을 넘어서며 설립정신을 계승하고 있으며, 상상하는 것은 무엇이든 이룰 수 있다는 불굴의 투지와 창조적 지혜로 오늘의 현대건설을 일구었습니다. 뛰어난 기술력과 풍부한 시공경험을 토대로 토목, 건축, 플랜트, 원자력 등 건설 전 분야에 걸쳐 세계적인 경쟁력을 보유하고 있으며, 인류의 삶의 질 향상과 풍요로운 미래 구현을 위해 앞장서고 있습니다.

기업이념:
- 창조적 예지: 미래지향적인 사고로 고객과 사회가 원하는 바에 부응하며 항상 새로움을 추구하는 지혜.
- 적극 의지: 투철한 주인의식과 매사에 능동적으로 대응하며 불굴의 투지로 미래를 개척하는 자세.
- 강인한 추진력: "하면 된다!"라는 정신으로 목표 달성을 위해 온 힘을 기울여 불가능을 가능케 하는 힘.

경영목표: 
미래역량 강화 (SMR·수소 등 에너지 전환 주도) / 기업가치 제고 (수익성 중심의 선별 수주 확대) / 책임경영 (안전·품질 중심의 현장 경영 실천)

주요사업: 
토목사업(도로, 교량, 항만) / 건축사업(아파트, 상업시설) / 플랜트사업(석유화학, 가스) / 원자력사업(원전 수출, SMR)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${hyundaiDescription},
        "updatedAt" = ${now}
      WHERE "name" = '현대건설'
    `;
    console.log("✅ 현대건설 데이터 보강 및 통일 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

refineHyundai();
