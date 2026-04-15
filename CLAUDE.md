# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

건설/건축 분야 취업 준비 플랫폼 (JobReady). 마스터 자소서를 중심으로 이력서, 면접 질문, 기업 정보, 취업 일정을 통합 관리한다.

## 필수 규칙

- **모든 응답은 한국어**로 작성한다.
- **이모지 금지**: 응답 및 커밋 메시지에 이모지를 사용하지 않는다.
- **코드 내 불필요한 주석 금지**: 로직이 자명하지 않은 경우에만 작성한다.
- **파일 삭제 금지**: 사용자 확인 없이 파일을 삭제하지 않는다.
- **원격 Push 금지**: 사용자 승인 없이 `git push`를 실행하지 않는다.
- **작업 시작 전** `plan.md`, `PROGRESS.md`를 읽어 현재 맥락을 파악한다.

## 주요 커맨드

```bash
pnpm dev          # 개발 서버 (Express + Vite HMR 통합, localhost:3000)
pnpm build        # 프론트엔드 Vite 빌드 → dist/
pnpm check        # tsc --noEmit (타입 오류 확인, 변경 후 필수)
pnpm test         # vitest run (단위 테스트)
pnpm test -- --reporter=verbose  # 단일 테스트 파일 실행 예시
pnpm db:push      # drizzle-kit generate && migrate (스키마 변경 시)
pnpm format       # prettier 포맷
```

## 아키텍처

### 데이터 흐름

```
client/src/lib/trpc.ts  →  /api/trpc  →  server/routers.ts  →  server/db.ts  →  Supabase PostgreSQL
```

- 프론트엔드는 `trpc` 클라이언트(React Query 기반)로만 API를 호출한다.
- `server/routers.ts`의 `AppRouter` 타입이 tRPC 엔드투엔드 타입 안전성을 제공한다. 새 라우터를 추가할 때 이 파일에서 `export type AppRouter`가 자동으로 반영된다.

### 서버 진입점 (환경별)

| 환경 | 소스 | 실행 파일 |
|---|---|---|
| 로컬 개발 | `server/dev.ts` | `tsx watch`로 직접 실행 |
| Vercel 배포 | `server/vercel.ts` | esbuild → `api/index.js` |

- `vercel.json`의 `rewrites` 규칙을 임의로 변경하지 않는다.
- Vercel은 Linux 환경이므로 import 경로의 **파일명 대소문자를 실제 파일과 100% 일치**시켜야 한다.

### DB 타입 규칙

- **모든 타임스탬프**: `bigint({ mode: "number" })` — 삽입/수정 시 항상 `Date.now()` 사용
- **Boolean 필드**: `integer`로 저장 (0/1). 예: `isMaster`, `isCompleted`, `isDefault`
- 스키마 소스: `drizzle/schema.ts` / 마이그레이션: `drizzle/migrations/`

### 마스터 자소서 시스템

`coverLetters` 테이블에서 `isMaster=1`인 레코드가 마스터 자소서다. 기업별 자소서는 `cloneCoverLetter()`로 생성되며 `parentId`에 마스터 ID를 기록한다. 브레인스토밍 데이터(`major`, `gpa`, `certifications`, `experience` 등)는 마스터 자소서에 집중 저장된다.

### 인증

- JWT 기반 세션 토큰을 쿠키(`COOKIE_NAME`)에 저장
- `server/_core/context.ts`의 `createContext()`에서 요청마다 검증
- **로컬 개발**: 인증 실패 시 `DEV_USER` 폴백이 자동 적용되어 인증 없이 작업 가능

### 경로 별칭

| 별칭 | 실제 경로 |
|---|---|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

### 프로시저 종류

- `publicProcedure`: 인증 불필요
- `protectedProcedure`: 로그인 사용자 필요 (`ctx.user` 보장)
- `adminProcedure`: `role === 'admin'` 필요

## 환경 변수

`.env.example`을 복사해 `.env`를 생성한다. 필수 항목:

- `DATABASE_URL`: Supabase Connection Pooler URL (포트 6543)
- `JWT_SECRET`: 세션 토큰 서명 키

Vercel 배포 시 대시보드에서 동일한 환경 변수 동기화 필수.
