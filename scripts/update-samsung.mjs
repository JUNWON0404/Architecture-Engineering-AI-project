import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateSamsung() {
  console.log("🚀 [삼성물산(건설부문)] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const samsungDescription = `기업소개:
삼성물산 건설부문은 1938년 삼성상회에서 시작된 삼성그룹의 모태이자, 1977년 건설 사업 진출 이후 대한민국 건설의 '글로벌 표준'을 제시해 온 리딩 기업입니다. '세상에 없던 높이'인 부르즈 할리파를 시공하며 인류의 한계에 도전했고, 반도체 하이테크 공정 시공 등 초정밀 건설 분야에서 독보적 지위를 점하고 있습니다. 단순히 건물을 짓는 것을 넘어, '인간의 삶을 풍요롭게 하는 공간'을 창조한다는 자부심으로 세계 최고의 엔지니어링 역량을 증명하고 있습니다.

기업이념:
- 인재제일: "기업은 곧 사람이다"라는 창업주 이병철 선대회장님의 철학을 계승하여, 최고의 인재들이 최고의 기술력을 발휘할 수 있는 문화를 구축합니다.
- 제일주의: 품질과 안전에서 타협하지 않는 '완벽함'을 추구하며, 모든 프로젝트에서 세계 최고(World Best)를 지향합니다.
- 사업보국: 건설을 통해 국가 인프라를 혁신하고 경제 발전에 기여하며, 인류 사회의 공동 번영을 위해 헌신합니다.

경영목표: 
Safety First (안전 최우선 경영) / Next Era Strategy (친환경 에너지 전환) / Digital Transformation (스마트 건설 혁신)

주요사업: 
빌딩사업(초고층, 랜드마크) / 하이테크사업(반도체, 데이터센터) / 인프라사업(도로, 교량, 항만) / 플랜트사업(원자력, 복합화력) / 주택사업(래미안)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${samsungDescription},
        "updatedAt" = ${now}
      WHERE "name" = '삼성물산(건설부문)'
    `;
    console.log("✅ 삼성물산(건설부문) 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateSamsung();
