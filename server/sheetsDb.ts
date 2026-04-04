import { getSheetsApi, getSpreadsheetId, escapeSheetTitleForRange, isGoogleSheetsConfigured } from "./googleSheets";

export type SheetRow = Record<string, string>;

function requireSheets() {
  if (!isGoogleSheetsConfigured()) {
    throw new Error(
      "Google Sheets가 설정되지 않았습니다. GOOGLE_SHEETS_SPREADSHEET_ID와 GOOGLE_APPLICATION_CREDENTIALS(서비스 계정 JSON 경로)를 .env에 넣어 주세요."
    );
  }
}

function rowsToObjects(headers: string[], dataRows: string[][]): SheetRow[] {
  return dataRows.map((cells) => {
    const row: SheetRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

/** 스프레드시트의 모든 탭(시트) 제목 */
export async function listSheetTabTitles(): Promise<string[]> {
  requireSheets();
  const sheets = await getSheetsApi();
  if (!sheets) throw new Error("Sheets API를 초기화할 수 없습니다. 자격 증명 JSON을 확인하세요.");
  const id = getSpreadsheetId();
  const res = await sheets.spreadsheets.get({ spreadsheetId: id });
  const titles =
    res.data.sheets?.map((s) => s.properties?.title).filter((t): t is string => Boolean(t)) ?? [];
  return titles;
}

/**
 * 탭 전체를 읽어 1행을 헤더로 보고 객체 배열로 반환합니다.
 * @param tab 시트 이름 (예: cover_letters)
 */
export async function readTabAsObjects(tab: string): Promise<SheetRow[]> {
  requireSheets();
  const sheets = await getSheetsApi();
  if (!sheets) throw new Error("Sheets API를 초기화할 수 없습니다.");
  const id = getSpreadsheetId();
  const range = `${escapeSheetTitleForRange(tab)}!A:ZZ`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range });
  const values = res.data.values;
  if (!values?.length) return [];
  const headers = (values[0] as string[]).map((h) => String(h).trim());
  const dataRows = values.slice(1).map((r) => (r as string[]).map((c) => (c == null ? "" : String(c))));
  return rowsToObjects(headers, dataRows);
}

/**
 * 헤더 행(1행)에 맞춰 한 줄을 추가합니다. 키는 1행 셀 텍스트와 동일해야 합니다.
 */
export async function appendRowToTab(tab: string, row: SheetRow): Promise<void> {
  requireSheets();
  const sheets = await getSheetsApi();
  if (!sheets) throw new Error("Sheets API를 초기화할 수 없습니다.");
  const id = getSpreadsheetId();
  const title = escapeSheetTitleForRange(tab);
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${title}!1:1`,
  });
  const headers = (headerRes.data.values?.[0] as string[] | undefined)?.map((h) => String(h).trim()) ?? [];
  if (!headers.length) {
    throw new Error(`시트 "${tab}"에 1행 헤더가 없습니다. npm run sheets:init 로 탭·헤더를 만든 뒤 다시 시도하세요.`);
  }
  const values = [headers.map((h) => row[h] ?? "")];
  await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `${title}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

/**
 * id 컬럼 값으로 행을 찾아, 지정한 필드만 덮어씁니다 (헤더 1행 기준).
 * 시트에 해당 id가 없으면 아무 작업도 하지 않습니다.
 */
export async function updateRowById(tab: string, idValue: string, updates: SheetRow): Promise<boolean> {
  requireSheets();
  const sheets = await getSheetsApi();
  if (!sheets) throw new Error("Sheets API를 초기화할 수 없습니다.");
  const id = getSpreadsheetId();
  const title = escapeSheetTitleForRange(tab);
  const range = `${title}!A:ZZ`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: id, range });
  const values = res.data.values;
  if (!values?.length) return false;
  const headers = (values[0] as string[]).map((h) => String(h).trim());
  const idCol = headers.indexOf("id");
  if (idCol < 0) throw new Error(`시트 "${tab}"에 id 열이 없습니다.`);

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    const row = values[i] as string[];
    if ((row[idCol] ?? "").trim() === idValue.trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex < 0) return false;

  const current = (values[rowIndex - 1] as string[]).map((c) => (c == null ? "" : String(c)));
  while (current.length < headers.length) current.push("");
  headers.forEach((h, col) => {
    if (h in updates) current[col] = updates[h] ?? "";
  });

  const updateRange = `${title}!A${rowIndex}:ZZ${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: updateRange,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [current.slice(0, headers.length)] },
  });
  return true;
}
