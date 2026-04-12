import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateHEC() {
  console.log("🚀 [현대엔지니어링] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const hecDescription = `기업소개:
현대엔지니어링은 1974년 설립 이래, 전 세계를 무대로 플랜트, 건축, 인프라, 자산관리 등 건설 전 분야에서 토탈 솔루션을 제공해 온 글로벌 엔지니어링 기업입니다. 현대자동차그룹의 일원으로서 '최고의 기술력으로 최고의 가치를 창출한다'는 신념 아래, 단순 시공을 넘어 설계 기술력 기반의 고부가가치 사업을 선도하고 있습니다. 특히 화공 및 전력 플랜트 분야의 독보적인 엔지니어링 역량은 전 세계 시장에서 강력한 경쟁력으로 인정받고 있습니다.

기업이념:
- 고객 최우선: 고객에게 최고의 품질과 서비스를 제공하여 신뢰와 감동을 주는 것을 최우선 가치로 삼습니다.
- 도전적 실행: 실패를 두려워하지 않는 개척 정신으로 새로운 시장과 미래 기술에 도전합니다.
- 소통과 협력: 조직 간의 벽을 허물고 협력하여 시너지를 창출하는 기업 문화를 지향합니다.
- 인재 존중: 구성원의 자율과 창의를 존중하고 잠재력을 극대화할 수 있는 환경을 조성합니다.

경영목표: 
Sustainability (지속가능한 성장) / Global Standard Safety (안전 경영) / Digital Engineering (디지털 설계 혁신)

주요사업: 
플랜트사업(화공, 전력) / 건축사업(힐스테이트, 지식산업센터) / 인프라사업 / 신사업(수소, SMR, 폐플라스틱 자원화)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${hecDescription},
        "updatedAt" = ${now}
      WHERE "name" = '현대엔지니어링'
    `;
    console.log("✅ 현대엔지니어링 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateHEC();
