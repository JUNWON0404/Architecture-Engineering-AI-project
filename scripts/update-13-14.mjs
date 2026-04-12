import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function update13To14() {
  console.log("🚀 [13-14위] DL건설, 두산에너빌리티 초고밀도 리포트 업데이트 시작...");
  const now = Date.now();
  
  const dlConstDesc = `기업소개:
DL건설(구 삼호, 고려개발 합병)은 DL그룹의 계열사로서 '최고의 기술과 성실한 시공'을 바탕으로 고품격 주거 시설과 기반 인프라를 공급해 왔습니다. 모그룹의 주택 명가 DNA를 공유하며, 중소형 정비사업과 물류센터, 공장 시공 분야에서 기민하고 효율적인 사업 수행 능력을 인정받고 있습니다. 대형 건설사의 시스템과 중견 건설사의 유연함을 갖춘 강소 기업으로서 내실 있는 성장을 거듭하고 있습니다.

기업이념:
- 정직과 신뢰: 원칙을 지키는 정직한 시공으로 고객과 사회로부터 두터운 신뢰를 얻습니다.
- 실천적 행동: 이론보다 실천을 중시하며, 현장 중심의 경영으로 문제를 해결합니다.
- 조화로운 발전: 협력사 및 지역사회와 조화를 이루며 함께 성장하는 공생의 가치를 추구합니다.

경영목표: 
Niche Market Leader (틈새 시장 수주 강화) / Operational Excellence (시공 효율 및 원가 경쟁력 제고) / Safety Habituation (안전의 내재화 및 생활화)

주요사업: 
주택사업(e편한세상 도시정비) / 건축사업(물류센터, 지식산업센터) / 토목사업(도로, 철도, 단지조성)`;

  const doosanDesc = `기업소개:
두산에너빌리티는 전 세계 에너지 패러다임의 변화를 주도하는 글로벌 에너지 솔루션 기업입니다. 원자력, 화력 등 발전 핵심 설비 제작에서 쌓은 독보적 역량을 바탕으로 플랜트 시공 분야에서도 글로벌 EPC 수행 능력을 보유하고 있습니다. SMR(소형모듈원전), 수소 가스터빈, 해상풍력 등 무탄소 에너지 기술을 선도하며 지구의 지속가능한 미래를 짓는 엔지니어링 리더로 자리매김하고 있습니다.

기업이념:
- 인재의 성장: 인재의 성장이 곧 회사의 성장이라는 믿음으로 사람을 키우는 경영을 실천합니다.
- 진정한 자부심: 정직하게 성과를 창출하여 세상에 기여한다는 자부심을 가집니다.
- 혁신적 사고: 고정관념을 깨는 기술 혁신으로 새로운 가치를 제공합니다.

경영목표: 
Carbon-Free Leader (무탄소 에너지 포트폴리오 완성) / Digital Power Plant (데이터 기반 발전/시공 혁신) / Safe Future (원전 수준의 절대 안전 품질 확보)

주요사업: 
원자력사업(대형원전, SMR) / 에너지플랜트(복합화력, 가스터빈) / 신재생에너지(해상풍력, 수소) / 특수 인프라 건설`;

  try {
    await sql`UPDATE companies SET "description" = ${dlConstDesc}, "updatedAt" = ${now} WHERE "name" LIKE '%DL건설%'`;
    await sql`UPDATE companies SET "description" = ${doosanDesc}, "updatedAt" = ${now} WHERE "name" LIKE '%두산에너빌리티%'`;
    console.log("✅ DL건설, 두산에너빌리티 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

update13To14();
