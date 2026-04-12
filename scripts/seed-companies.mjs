import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const companiesData = [
  {
    name: "삼성물산(건설부문)",
    rank: 1,
    brand: "래미안",
    sector: "건축, 토목, 플랜트",
    salaryGuide: "5,500만 원~ (영끌 7,000+)",
    location: "서울 강동구 상일동",
    website: "https://www.secc.co.kr",
    description: `기업소개:
삼성물산 건설부문은 1977년 창립 이래 차별화된 기술력과 품질을 바탕으로 전 세계 고객들에게 가치 있는 공간과 환경을 제공해 왔습니다. 세계 최고층 빌딩인 부르즈 할리파, 인천대교, 말레이시아 메르데카 118 등 기념비적인 프로젝트를 성공적으로 수행하며 글로벌 시장에서의 위상을 공고히 하고 있습니다. 건축, 토목, 플랜트, 주택 등 건설 전 분야에서 업계를 선도하며, 최근에는 에너지 솔루션 및 친환경 신사업을 통해 지속 가능한 미래를 설계하고 있습니다.

기업이념:
"인재와 기술을 바탕으로 최고의 제품과 서비스를 창출하여 인류사회에 공헌한다." 삼성물산은 안전을 경영의 제1가치로 삼으며, 고객과 사회로부터 신뢰받는 'Global Solution Provider'를 지향합니다.

경영목표: 
안전 최우선 경영 / 미래 성장 동력 확보(수소, 태양광 등) / 디지털 전환 가속화

주요사업: 
건축사업(초고층, 하이테크) / 토목사업(인프라) / 플랜트사업(발전, 에너지 저장) / 주택사업(래미안)`
  },
  {
    name: "현대건설",
    rank: 2,
    brand: "힐스테이트, 디에이치",
    sector: "토목, 건축, 원자력, 플랜트",
    salaryGuide: "5,300만 원~ (영끌 7,000+)",
    location: "서울 종로구 계동",
    website: "https://www.hdec.kr",
    description: `기업소개:
현대건설은 1947년 현대토건사 라는 이름으로 시작되었습니다. 고 정주영 명예회장님의 '된다는 확신 90%와 반드시 되게 할 수 있다는 자신감 10%'라는 불굴의 개척정신으로 세워진 회사입니다. 뛰어난 기술력과 풍부한 시공경험을 토대로 토목, 건축, 플랜트, 원자력 등 건설 전 분야에 걸쳐 세계적인 경쟁력을 보유하고 있으며, 국민의 삶의 질 향상과 풍요로운 미래사회 구현을 위해 앞장서고 있습니다.

기업이념:
- 창조적 예지: 미래지향적인 사고로 고객과 사회에 부응하는 지혜.
- 적극 의지: 투철한 주인의식과 매사에 능동적으로 대응하는 자세.
- 강인한 추진력: "하면 된다!"라는 정신으로 목표를 달성하는 힘.

경영목표: 
미래역량 강화 / 기업가치 제고 / 책임경영

주요사업: 
토목사업 / 건축사업 / 플랜트사업 / 전기사업 / SOC사업`
  },
  {
    name: "대우건설",
    rank: 3,
    brand: "푸르지오, 써밋",
    sector: "주택, 플랜트, 토목",
    salaryGuide: "5,000만 원~ (영끌 6,500+)",
    location: "서울 중구 을지로",
    website: "https://www.daewooenc.com",
    description: `기업소개:
대우건설은 1973년 창립 이후 'Challenge, Passion, Creativity'라는 대우 정신을 바탕으로 대한민국 경제 성장과 궤를 같이해 왔습니다. 세계 최대 규모의 시화호 조력발전소, 거가대교 등 수많은 난공사를 성공시키며 기술력을 입증했으며, 해외 시장에서도 나이지리아, 이라크, 리비아 등 플랜트 시장의 강자로 자리매김했습니다. 단순 시공을 넘어 부동산 개발 전 과정을 아우르는 디벨로퍼로서의 역량을 강화하고 있습니다.

기업이념:
"모든 인류에게 더 나은 삶의 질을 제공할 수 있도록 건설 그 이상의 가치 있는 환경과 공간을 창조한다." (Your Dream, Our Space)

경영목표: 
내실 경영 강화 / 신성장 동력 발굴 / 안전 및 ESG 경영 정착

주요사업: 
주택건축사업(푸르지오) / 플랜트사업(LNG, 석유화학) / 토목사업(도로, 교량) / 부동산개발사업`
  },
  {
    name: "DL이앤씨",
    rank: 5,
    brand: "e편한세상, 아크로",
    sector: "주택, 토목, 플랜트",
    salaryGuide: "5,200만 원~ (영끌 6,800+)",
    location: "서울 종로구 평동",
    website: "https://www.dlenc.co.kr",
    description: `기업소개:
1939년 부림상회로 시작한 DL이앤씨(구 대림산업)는 대한민국 건설 역사의 효시로서 80여 년간 업계를 선도해 왔습니다. 경부고속도로, 국회의사당, 이순신대교 등 국가 핵심 인프라 구축의 주역이었으며, 최고급 주거 브랜드 '아크로'를 통해 주택 문화의 새로운 기준을 제시했습니다. 현재는 축적된 엔지니어링 역량을 바탕으로 글로벌 디벨로퍼로 도약하며, 친환경 에너지 및 신소재 사업으로 영역을 확장하고 있습니다.

기업이념:
"정직과 신뢰"를 바탕으로 고객에게 최고의 가치를 제공하는 '정도경영'을 실천합니다.

경영목표: 
지속가능한 글로벌 디벨로퍼로의 도약 / 선별 수주를 통한 수익성 제고 / 친환경 신사업(CCUS, SMR) 육성

주요사업: 
주택사업(e편한세상, 아크로) / 토목사업(교량, 항만) / 플랜트사업(석유화학, 가스)`
  },
  {
    name: "GS건설",
    rank: 6,
    brand: "자이 (Xi)",
    sector: "주택, 인프라, 플랜트",
    salaryGuide: "5,200만 원~ (영끌 6,800+)",
    location: "서울 종로구 청진동",
    website: "https://www.gsenc.com",
    description: `기업소개:
GS건설은 국내외에서 쌓아온 풍부한 시공 경험과 최고의 기술력을 바탕으로 고객의 꿈과 행복을 실현하는 공간을 만들어 왔습니다. 국내 아파트 브랜드 선호도 1위인 '자이'를 통해 주거 문화의 혁신을 주도하고 있으며, 에너지·환경 플랜트 분야에서도 세계적 경쟁력을 보유하고 있습니다. 최근에는 수처리 사업, 모듈러 주택, 2차전지 재활용 등 신사업을 통해 미래 성장 동력을 확보하고 안전을 경영의 최우선 가치로 삼고 있습니다.

기업이념:
"투명한 신뢰와 끊임없는 혁신으로 더 안전하고 행복한 삶의 미래를 완성합니다."

경영목표: 
고객 지향적 경영 / 브랜드 신뢰 회복 / 신사업 포트폴리오 다변화

주요사업: 
주택건축사업(자이) / 인프라사업 / 플랜트사업(환경, 석유화학) / 신사업(수처리, 모듈러)`
  }
];

async function seed() {
  console.log("🚀 '깊이 있는 기업 리포트' 중심 전문 데이터 최신화 시작...");
  const now = Date.now();
  try {
    for (const company of companiesData) {
      await sql`
        INSERT INTO companies (
          "name", "sector", "rank", "brand", "hiringSeason", "salaryGuide", 
          "location", "website", "description", "createdAt", "updatedAt"
        ) VALUES (
          ${company.name}, ${company.sector}, ${company.rank}, ${company.brand}, 
          '상/하반기 정기채용', ${company.salaryGuide}, 
          ${company.location}, ${company.website}, 
          ${company.description}, 
          ${now}, ${now}
        )
        ON CONFLICT (name) DO UPDATE SET
          "sector" = EXCLUDED."sector",
          "rank" = EXCLUDED."rank",
          "brand" = EXCLUDED."brand",
          "salaryGuide" = EXCLUDED."salaryGuide",
          "location" = EXCLUDED."location",
          "website" = EXCLUDED."website",
          "description" = EXCLUDED."description",
          "updatedAt" = EXCLUDED."updatedAt"
      `;
      console.log(`✅ ${company.name} 상세 리포트 업데이트 완료`);
    }
    console.log("\n✨ 데이터베이스 최신화 완료!");
  } catch (error) {
    console.error("❌ 시딩 실패:", error.message);
  } finally {
    await sql.end();
  }
}

seed();
