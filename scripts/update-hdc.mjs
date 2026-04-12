import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateHDC() {
  console.log("🚀 [HDC현대산업개발] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const hdcDescription = `기업소개:
1976년 한국도시개발로 시작한 HDC현대산업개발은 대한민국 최초의 아파트 전용 브랜드 '아이파크(IPARK)'를 통해 주거 혁신을 주도해 왔습니다. 단순 시공을 넘어 부지 확보부터 기획, 금융, 시공, 운영까지 전 과정을 아우르는 '종합 디벨로퍼'로서 독보적인 위치를 점하고 있습니다. 부산 해운대 아이파크, 수원 아이파크 시티 등 대규모 랜드마크를 통해 도시의 지도를 바꿔 왔으며, 최근에는 광운대역세권 개발 등 복합 개발 사업을 통해 미래 도시의 새로운 라이프스타일을 제안하고 있습니다.

기업이념:
- 풍요로운 삶과 신뢰받는 세상: 고객의 삶을 풍요롭게 하고 사회로부터 신뢰받는 기업을 지향합니다.
- 창의와 혁신: 유연한 사고로 새로운 가치를 창출하고 건설의 패러다임을 바꿉니다.
- 정도 경영: 투명하고 정직한 경영 원칙을 준수하여 지속가능한 성장을 실천합니다.

경영목표: 
Master of Mixed-Use Development (복합개발 주도) / Safety & Quality Innovation (안전 관리 혁신) / Future City Vision (미래 스마트 시티 구현)

주요사업: 
디벨로퍼사업(복합단지 개발) / 주택사업(아이파크) / 토목사업 / 운영사업(호텔, 레저)`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${hdcDescription},
        "updatedAt" = ${now}
      WHERE "name" = 'HDC현대산업개발'
    `;
    console.log("✅ HDC현대산업개발 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateHDC();
