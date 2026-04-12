import { trpc } from "../client/src/lib/trpc";

async function diagnose() {
  console.log("🔍 Diagnosing tRPC Server...");
  
  try {
    // We can't easily use the trpc client here without a full React context or a fetch-based client.
    // Let's use standard fetch to call the endpoint.
    const baseUrl = "http://localhost:3000/api/trpc";
    
    console.log("1️⃣ Testing auth.me (Public Procedure)...");
    const meRes = await fetch(`${baseUrl}/auth.me?batch=1&input=%7B%7D`);
    const meData = await meRes.json();
    console.log("   Result:", JSON.stringify(meData[0]?.result?.data, null, 2));

    console.log("2️⃣ Testing company.list (Public Procedure)...");
    const listRes = await fetch(`${baseUrl}/company.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22sortBy%22%3A%22rank%22%7D%7D%7D`);
    const listData = await listRes.json();
    if (listRes.ok) {
      console.log("   ✓ Success! Companies count:", listData[0]?.result?.data?.json?.length);
    } else {
      console.error("   ❌ Failed!", listData);
    }

  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  }
}

diagnose();
