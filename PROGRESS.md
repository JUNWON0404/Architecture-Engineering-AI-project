# 작업 요약 - 오늘의 개발 진행상황 (PROGRESS.md)

## 📅 2026-04-17 업데이트 내역 (최신)

### 1. 인증 시스템 안정화 (임시 조치)
- ⚠️ **구글 로그인 비활성화**: 원인 불명의 구글 로그인 오류로 인해 해당 기능을 임시 차단.
    - 프론트엔드(`Login.tsx`): 버튼 클릭 시 안내 알림(`alert`) 표시.
    - 백엔드(`oauth.ts`): `/api/auth/google` 접근 시 로그인 페이지로 리다이렉트 처리.
- ✅ **이메일 로그인 권장**: 안정적인 서비스 이용을 위해 일반 이메일/비밀번호 로그인 방식을 메인으로 유도.

### 2. 빌드 및 타입 안정성 강화
- ✅ **ThemeProvider 타입 오류 수정**: `App.tsx`에서 `ThemeProvider`에 잘못 전달되던 `defaultTheme`, `switchable` props 제거 (정의되지 않은 속성).
- ✅ **배포 검증**: `pnpm check` (tsc --noEmit)를 통한 전체 타입 검사 통과 및 Vercel 배포 완료.

---

## 📅 2026-04-15 업데이트 내역

### 1. 최신 아키텍처 통합 및 병합
- ✅ **버전 동기화**: 4월 13일자 최신 브랜치(`feature/refactor-education-layout`)를 `main`으로 병합 완료.
- ✅ **건설 뉴스 시스템**: `conslove.co.kr` RSS 연동 및 기업별 뉴스 필터링 기능 활성화.
- ✅ **자소서 내보내기**: MS Word(.doc) 형식 내보내기 유틸리티(`exportUtils.ts`) 신규 구현.

### 2. 인프라 및 DB 안정화
- ✅ **DB 연결 성공**: Supabase Connection Pooler(포트 6543)를 통한 실제 PostgreSQL 연결 완료.
- ✅ **스키마 확장**: 뉴스 스크랩(`news_scraps`) 및 기업별 메모(`company_notes`) 테이블 반영.
- ✅ **인증 검증**: 실제 DB 기반의 회원가입 및 로그인(BCrypt/JWT) 플로우 테스트 완료.

### 3. Vercel 배포 최적화
- ✅ **배포 설정**: `vercel.json` 경로 불일치(server/index.ts -> api/index.ts) 해결 및 루트 빌드 경로 최적화 완료.
- ✅ **라우팅 수리**: 정적 파일 서빙 오류 해결을 위한 `rewrites` 규칙 최적화.
- ✅ **환경 변수**: `DATABASE_URL`, `JWT_SECRET` 기반 배포 준비 완료.

---

## 🛠️ 기술적 특이사항
- **Database**: 로컬 Mock DB(`mock_db.json`)와 실제 Supabase DB 간의 하이브리드 자동 폴백 시스템 유지.
- **Vercel**: 서버리스 함수 제약으로 인해 `api/index.ts`를 별도 진입점으로 관리.

**작성자**: 베테랑 개발자 (Gemini CLI)
