import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function updateLotte() {
  console.log("🚀 [롯데건설] 초고밀도 정밀 리포트 업데이트 시작...");
  const now = Date.now();
  
  const lotteDescription = `기업소개:
1959년 설립된 롯데건설은 반세기 넘는 역사 동안 대한민국 주거 문화와 랜드마크 건축을 선도해 왔습니다. 세계에서 5번째로 높은 롯데월드타워(555m)를 성공적으로 시공하며 세계적인 기술력을 인정받았으며, 주택 시장에서도 '롯데캐슬'과 하이엔드 브랜드 '르엘(LE-EL)'을 통해 품격 있는 주거 가치를 창출하고 있습니다. 최근에는 복합개발사업(Developer)과 실버주택 등 변화하는 인구 구조에 맞춘 신사업 분야로 영역을 확장하며 지속가능한 미래를 열어가고 있습니다.

기업이념:
- 사랑과 신뢰: 고객의 사랑을 바탕으로 최상의 가치를 제공하며 신뢰를 구축합니다.
- 정직과 신뢰: 투명한 경영과 원칙 준수를 통해 깨끗한 기업 문화를 정착시킵니다.
- 창의와 도전: 끊임없는 기술 혁신과 새로운 시장 개척을 통해 미래 경쟁력을 확보합니다.

경영목표: 
Master of Mixed-Use Development (복합개발 주도) / Beyond Construction (미래 신사업 확장) / Quality & Safety Excellence (최고의 품질과 안전)

주요사업: 
주택건축사업(롯데캐슬, 르엘) / 복합개발사업 / 토목사업 / 플랜트사업`;

  try {
    await sql`
      UPDATE companies SET 
        "description" = ${lotteDescription},
        "updatedAt" = ${now}
      WHERE "name" = '롯데건설'
    `;
    console.log("✅ 롯데건설 업데이트 완료");
  } catch (error) {
    console.error("❌ 업데이트 실패:", error.message);
  } finally {
    await sql.end();
  }
}

updateLotte();
