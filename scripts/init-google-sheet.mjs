/**
 * Drizzle(MySQL) 테이블과 동일한 컬럼명으로 구글 시트 탭·1행 헤더를 만듭니다.
 * 실행 전: 스프레드시트를 서비스 계정 이메일에 "편집자"로 공유해야 합니다.
 *
 * .env 예시:
 *   GOOGLE_SHEETS_SPREADSHEET_ID=스프레드시트ID
 *   GOOGLE_APPLICATION_CREDENTIALS=./project-....json
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { google } from "googleapis";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
  "11qsSpEYFHjJ3_alMLLL6Ey0TBMgPWWknfqpsdFmN2bw";
const CREDS_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;

const TABLE_HEADERS = {
  cover_letters: ["id", "userId", "title", "company", "position", "content", "status", "createdAt", "updatedAt"],
  interview_questions: [
    "id",
    "userId",
    "question",
    "answer",
    "category",
    "company",
    "position",
    "difficulty",
    "isPublic",
    "createdAt",
    "updatedAt",
  ],
  resumes: ["id", "userId", "title", "content", "isDefault", "createdAt", "updatedAt"],
  schedules: [
    "id",
    "userId",
    "title",
    "company",
    "type",
    "scheduledAt",
    "description",
    "isCompleted",
    "createdAt",
    "updatedAt",
  ],
  company_bookmarks: [
    "id",
    "userId",
    "companyName",
    "industry",
    "position",
    "jobUrl",
    "deadline",
    "notes",
    "status",
    "createdAt",
    "updatedAt",
  ],
  checklist_items: [
    "id",
    "userId",
    "title",
    "description",
    "category",
    "isCompleted",
    "order",
    "createdAt",
    "updatedAt",
  ],
};

async function main() {
  if (!CREDS_PATH?.trim()) {
    console.error("GOOGLE_APPLICATION_CREDENTIALS(또는 GOOGLE_SHEETS_CREDENTIALS_PATH)에 서비스 계정 JSON 경로를 설정하세요.");
    process.exit(1);
  }
  const abs = path.isAbsolute(CREDS_PATH) ? CREDS_PATH : path.resolve(process.cwd(), CREDS_PATH);
  const creds = JSON.parse(readFileSync(abs, "utf8"));
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = new Set(
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? []
  );

  const requests = [];
  for (const title of Object.keys(TABLE_HEADERS)) {
    if (!existing.has(title)) {
      requests.push({ addSheet: { properties: { title } } });
    }
  }
  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log("추가된 탭:", requests.length);
  } else {
    console.log("새로 추가할 탭 없음 (이미 존재)");
  }

  for (const [title, headers] of Object.entries(TABLE_HEADERS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!1:1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
  }
  console.log("탭별 1행 헤더를 갱신했습니다. 스프레드시트 ID:", SPREADSHEET_ID);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
