import 'dotenv/config';
import { invokeLLM } from '../server/_core/llm.ts';

async function testLLM() {
  console.log("LLM 연결 테스트 시작...");
  const key = process.env.BUILT_IN_FORGE_API_KEY;
  console.log("키 확인:", key ? `${key.substring(0, 2)}***` : "없음");
  try {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "건설사 취업을 위한 자기소개서 한 문장만 작성해줘." }],
    });
    console.log("✅ 결과:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

testLLM();
