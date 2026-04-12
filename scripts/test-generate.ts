import 'dotenv/config';
import { appRouter } from '../server/routers.ts';

async function testGenerate() {
  console.log("🚀 자소서 생성 API 테스트...");
  const ctx = {
    user: { id: 1, name: "테스트 사용자" },
    req: {} as any,
    res: {} as any,
  };

  try {
    const caller = appRouter.createCaller(ctx);
    const result = await (caller.coverLetter as any).generate({
      company: "현대건설",
      position: "토목시공",
      major: "토목공학",
      keywords: "#안전 #협업",
      keyStory: "현장 실습 때 사고를 예방한 경험이 있습니다.",
    });
    console.log("✅ 결과:", result.content.substring(0, 100) + "...");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

testGenerate();
