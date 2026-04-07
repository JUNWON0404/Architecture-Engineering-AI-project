export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

/** 클라이언트 localStorage: 희망 직무 라벨 문자열 배열(JSON) */
export const DESIRED_JOB_ROLES_STORAGE_KEY = "job-ready:desiredJobRoles";

/** 건설·건축 분야 대표 희망 직무(홈에서 다중 선택) */
export const REPRESENTATIVE_JOB_ROLES = [
  "건축시공·현장관리",
  "공무·발주처 대응",
  "구조설계·구조해석",
  "건축설비·MEP",
  "안전관리",
  "품질관리·감리",
  "BIM·디지털전환",
  "공공기술직·시설",
  "PM·공정관리",
  "견적·원가관리",
] as const;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
