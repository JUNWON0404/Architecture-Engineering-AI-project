
import "dotenv/config";
import { createUserWithEmail, authenticateUser, getUserByEmail, getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function testAuthFlow() {
  console.log("🚀 [Auth Test] 시작: 실제 DB 인증 플로우 검증");
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "password1234!";
  const testName = "테스트유저";

  try {
    // 1. DB 연결 확인
    const db = await getDb();
    if (!db) throw new Error("DB 연결 실패");
    console.log("✅ [Auth Test] 1. DB 연결 성공");

    // 2. 회원가입 테스트
    console.log(`⏳ [Auth Test] 2. 회원가입 시도: ${testEmail}`);
    const newUser = await createUserWithEmail(testEmail, testPassword, testName);
    console.log("✅ [Auth Test] 2. 회원가입 성공 (ID:", newUser.id, ")");

    // 3. DB 저장 확인 (직접 쿼리)
    const savedUser = await getUserByEmail(testEmail);
    if (!savedUser) throw new Error("DB에서 사용자를 찾을 수 없음");
    console.log("✅ [Auth Test] 3. DB 저장 확인 완료");

    // 4. 로그인(인증) 테스트
    console.log("⏳ [Auth Test] 4. 로그인 시도 (비밀번호 검증)");
    const authenticatedUser = await authenticateUser(testEmail, testPassword);
    console.log("✅ [Auth Test] 4. 로그인 성공! (이름:", authenticatedUser.name, ")");

    // 5. 테스트 데이터 정리 (선택 사항 - 여기서는 유지하거나 삭제)
    // const drizzleDb = await getDb();
    // await drizzleDb!.delete(users).where(eq(users.email, testEmail));
    // console.log("🧹 [Auth Test] 5. 테스트 데이터 정리 완료");

    console.log("\n🎊 [결론] 로그인 및 회원가입 로직이 실제 DB에서 완벽하게 작동합니다!");
  } catch (error: any) {
    console.error("\n❌ [Auth Test] 실패:", error.message);
    process.exit(1);
  }
}

testAuthFlow();
