export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** 스프레드시트 ID (URL의 /d/ 와 /edit 사이). 환경 변수가 없으면 프로젝트 기본 시트 ID 사용 */
  googleSheetsSpreadsheetId:
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() ||
    "11qsSpEYFHjJ3_alMLLL6Ey0TBMgPWWknfqpsdFmN2bw",
  /** 서비스 계정 JSON 파일 경로 (GOOGLE_APPLICATION_CREDENTIALS 권장) */
  googleApplicationCredentials:
    process.env.GOOGLE_APPLICATION_CREDENTIALS ?? process.env.GOOGLE_SHEETS_CREDENTIALS_PATH ?? "",
};
