import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

async function debugConnection() {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error("❌ 오류: .env 파일에 DATABASE_URL이 설정되어 있지 않습니다.");
    return;
  }

  console.log("🔍 연결 시도 중: ", url.split("@")[1]); // 보안을 위해 호스트 부분만 출력

  const client = postgres(url, { 
    connect_timeout: 5,
    ssl: "require", // Supabase는 보통 SSL이 필수입니다.
  });

  try {
    console.log("⏳ 데이터베이스 응답 대기 중 (최대 5초)...");
    const result = await client`SELECT version()`;
    console.log("✅ 연결 성공!");
    console.log("📊 DB 버전:", result[0].version);
    
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("📁 존재하는 테이블:", tables.map(t => t.table_name).join(", "));
    
  } catch (error) {
    console.error("❌ 연결 실패!");
    console.error("📌 에러 메시지:", error.message);
    console.error("📌 에러 코드:", error.code || "N/A");
    
    if (error.message.includes("ETIMEDOUT")) {
      console.log("\n💡 진단: 네트워크 타임아웃");
      console.log("- 인터넷 연결이 불안정하거나, 회사/카페 방화벽이 5432 포트를 막고 있을 수 있습니다.");
    } else if (error.message.includes("password authentication failed")) {
      console.log("\n💡 진단: 인증 실패");
      console.log("- .env의 비밀번호가 틀렸거나 DATABASE_URL 형식이 잘못되었습니다.");
    } else if (error.message.includes("self signed certificate")) {
      console.log("\n💡 진단: SSL 인증서 문제");
      console.log("- SSL 설정이 필요합니다.");
    }
  } finally {
    await client.end();
    process.exit();
  }
}

debugConnection();
