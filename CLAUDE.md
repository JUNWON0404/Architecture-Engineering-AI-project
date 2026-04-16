# CLAUDE.md

## 필수 규칙
- 모든 응답은 **한국어**로 작성한다.
- 이모지 금지 (응답 및 커밋 메시지 포함).
- 코드 주석은 로직이 자명하지 않은 경우에만 작성한다.
- 파일 삭제 및 `git push`는 사용자 확인 없이 실행하지 않는다.
- 파일 읽기 시 `offset`/`limit`을 활용해 필요한 부분만 읽는다. 이미 읽은 파일은 재독하지 않고 참조한다.

## 프로젝트 개요
건설/건축 취업 플랫폼 (JobReady). 마스터 자소서 중심으로 이력서·면접·기업정보·일정 통합 관리.

## 커맨드
```bash
pnpm dev       # 개발 서버 (localhost:3000)
pnpm build     # Vite 빌드 → dist/
pnpm check     # tsc --noEmit (변경 후 필수)
pnpm db:push   # drizzle-kit generate && migrate
```

## 사용자 명령어
- `저장`: 변경된 파일만 스테이징 → 커밋 → 푸시 (푸시 전 사용자 승인 필수)

## 아키텍처
```
client/src/lib/trpc.ts → /api/trpc → server/routers.ts → server/db.ts → Supabase PostgreSQL
```
- 서버 진입점: 로컬 `server/dev.ts` / Vercel `server/vercel.ts` → esbuild → `api/index.js`
- `vercel.json` rewrites 규칙 임의 변경 금지. import 경로 대소문자 실제 파일과 100% 일치 필요.
- 경로 별칭: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

## DB 규칙
- 타임스탬프: `bigint({ mode: "number" })`, 삽입/수정 시 `Date.now()` 사용.
- Boolean: `integer` (0/1). 예: `isMaster`, `isCompleted`, `isDefault`.
- 스키마: `drizzle/schema.ts` / 마이그레이션: `drizzle/migrations/`

## 인증
- JWT 세션 토큰을 쿠키(`COOKIE_NAME`)에 저장. `server/_core/context.ts`에서 요청마다 검증.
- `protectedProcedure`: 로그인 필수. `publicProcedure`: 인증 불필요. `adminProcedure`: role=admin.
- **로컬 개발만** 인증 실패 시 `DEV_USER` 폴백 자동 적용. 배포 환경에서는 없음.

## 마스터 자소서
`coverLetters.isMaster=1`이 마스터. `cloneCoverLetter()`로 기업별 파생 생성, `parentId`로 연결.
브레인스토밍 데이터(`major`, `gpa`, `certifications`, `experience` 등)는 마스터에 집중 저장.

## 환경 변수
- `DATABASE_URL`: Supabase Connection Pooler (포트 6543)
- `JWT_SECRET`: 세션 토큰 서명 키
- Vercel 배포 시 대시보드에서 동일 변수 동기화 필수.
