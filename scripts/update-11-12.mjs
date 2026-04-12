import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function update11To12() {
  console.log("🚀 [11-12위] 한화, 호반건설 초고밀도 리포트 업데이트 시작...");
  const now = Date.now();
  
  const hanwhaDesc = `기업소개:
1967년 설립된 한화 건설부문은 '디벨로퍼형 복합개발'과 '글로벌 대형 프로젝트'의 강자로 자리매김해 왔습니다. 대한민국 건설 역사상 최대 규모의 해외 신도시 수출인 이라크 비스마야 프로젝트를 통해 세계적인 도시 건설 역량을 증명했습니다. 2022년 한화(주)로 합병되며 그룹 내 핵심 부문으로서 수소 에너지, 해상풍력 등 친환경 신사업과 대규모 복합개발사업을 결합한 미래형 건설 모델을 구축하고 있습니다.

기업이념:
- 신용과 의리: 한화그룹의 핵심 가치로서, 약속을 지키는 신뢰 경영과 구성원 간의 유대감을 중시합니다.
- 도전, 헌신, 정도: 변화를 주도하는 도전정신, 고객과 사회에 대한 헌신, 정직한 성장을 실천합니다.

경영목표: 
Green Infrastructure (친환경 에너지 인프라 주도) / Complex Development (대규모 복합개발 혁신) / Value-up Safety (생명 존중 안전 문화)

주요사업: 
복합개발사업(서울역 북부역세권 등) / 주택건축사업(포레나) / 플랜트사업(수소, 화공) / 토목사업(에너지 단지 조성)`;

  const hobanDesc = `기업소개:
1989년 창업하여 탄탄한 재무 건전성과 공격적인 사업 확장을 통해 급성장한 실속형 강자입니다. 무차입 경영 원칙과 철저한 리스크 관리로 업계 최고 수준의 신용 등급을 유지하며 흔들림 없는 성장을 지속해 왔습니다. 최근에는 건설을 넘어 미디어, 리조트, 유통 등 다양한 분야로 사업을 다각화하며 종합 리빙 솔루션 그룹으로 도약하고 있습니다.

기업이념:
- 고객 만족: 최고의 품질과 정직한 가치로 고객에게 감동을 주는 주거 공간을 제공합니다.
- 상생 협력: 협력사와 함께 성장하며 사회적 책임을 다하는 나눔 경영을 실천합니다.
- 내실 경영: 원칙 준수와 철저한 관리를 통해 지속 가능한 성장을 추구합니다.

경영목표: 
Smart Life Innovator (첨단 기술 주거 혁신) / Open Innovation (스타트업 협업 및 신기술 확보) / Zero-Accident Culture (현장 사고 제로화)

주요사업: 
주택사업(호반써밋, 베르디움) / 토목건축사업(지식산업센터) / 리조트레저사업 / 스마트건설 투자`;

  try {
    await sql`UPDATE companies SET "description" = ${hanwhaDesc}, "updatedAt" = ${now} WHERE "name" LIKE '%한화%'`;
    await sql`UPDATE companies SET "description" = ${hobanDesc}, "updatedAt" = ${now} WHERE "name" LIKE '%호반%'`;
    console.log("✅ 한화, 호반건설 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

update11To12();
