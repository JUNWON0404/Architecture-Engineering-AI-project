import { readFileSync } from "fs";
import path from "path";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import { ENV } from "./_core/env";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function loadServiceAccount(): { client_email: string; private_key: string } | null {
  const rawPath = ENV.googleApplicationCredentials.trim();
  if (!rawPath) return null;
  const abs = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  try {
    const raw = readFileSync(abs, "utf8");
    return JSON.parse(raw) as { client_email: string; private_key: string };
  } catch {
    return null;
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(ENV.googleSheetsSpreadsheetId.trim() && ENV.googleApplicationCredentials.trim());
}

export function getSpreadsheetId(): string {
  return ENV.googleSheetsSpreadsheetId.trim();
}

let sheetsApi: sheets_v4.Sheets | null = null;

/** 서비스 계정 JWT로 Sheets v4 클라이언트 (싱글톤) */
export async function getSheetsApi(): Promise<sheets_v4.Sheets | null> {
  if (!isGoogleSheetsConfigured()) return null;
  if (sheetsApi) return sheetsApi;
  const creds = loadServiceAccount();
  if (!creds?.client_email || !creds?.private_key) return null;
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [SHEETS_SCOPE],
  });
  sheetsApi = google.sheets({ version: "v4", auth });
  return sheetsApi;
}

/** 시트 탭 이름에 공백·특수문자가 있으면 A1용으로 이스케이프 */
export function escapeSheetTitleForRange(title: string): string {
  if (/^[A-Za-z0-9_]+$/.test(title)) return title;
  return `'${title.replace(/'/g, "''")}'`;
}
