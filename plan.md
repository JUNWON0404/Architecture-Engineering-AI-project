# 프로젝트 개발 계획 (plan.md)

이 파일은 프로젝트의 구조, 주요 폴더/파일 역할, 개발 시 참고해야 할 규칙 및 TODO, 개선점 등을 기록하는 문서입니다.

---

## 1. 프로젝트 구조 개요

- **client/**: 프론트엔드 리소스 (React, Vite 기반)
  - `index.html`: 진입점
  - `public/`: 정적 파일
  - `src/`: 소스코드
    - `_core/`: 공통 훅, 유틸, 내부 모듈
    - `components/`: UI 컴포넌트
    - `contexts/`: 리액트 컨텍스트
    - `hooks/`: 커스텀 훅
    - `lib/`: 라이브러리/유틸
    - `pages/`: 라우트별 페이지

- **server/**: 백엔드 코드 (Node.js 기반)
  - `_core/`: 공통 모듈
  - 각종 서비스/라우터/DB 연동 파일

- **drizzle/**: DB 마이그레이션 및 스키마
- **shared/**: 프론트/백엔드 공용 타입, 상수 등
- **scripts/**: 초기화, 배포 등 스크립트
- **patches/**: 패키지 패치 파일

---

## 2. 주요 개발 규칙

### 2.1 기본 구조 규칙
- **공통 타입/상수**는 `shared/`에 정의
- **컴포넌트/훅/유틸**은 역할별로 폴더 구분
- **DB 관련 작업**은 `drizzle/`에서 관리
- **테스트 파일**은 `.test.ts(x)`로 작성
- **패키지 관리**는 pnpm 사용

### 2.2 주석 작성 규칙 (비개발자도 이해하기)
```typescript
// ✅ 좋은 예: 무엇을 하고 왜 하는지 명확히
// 사용자 로그인 상태를 확인하고, 로그인하지 않은 경우 대시보드로 리디렉션
if (!isLoggedIn) {
  redirectTo('/dashboard');
}

// ❌ 피해야 할 예: 너무 기술적이거나 불명확한 주석
// isLoggedIn 체크
// TODO나 주요 로직은 상세히 설명
```

### 2.3 클린 아키텍처 원칙
- **계층 분리**: 프론트엔드(UI) → 비즈니스 로직 → DB 계층 명확히 구분
- **의존성 역전**: 위쪽 계층이 아래쪽 계층에만 의존 (역방향X)
- **단일 책임**: 각 함수/컴포넌트는 하나의 역할만 수행
- **재사용성**: 공통 로직은 `shared/`, `lib/`, `_core/`로 추출
- **테스트 용이성**: 비즈니스 로직과 UI 로직을 분리

### 2.4 네이밍 컨벤션
- **컴포넌트**: PascalCase (예: `UserProfile.tsx`)
- **훅**: camelCase + 'use' 접두사 (예: `useAuth.ts`)
- **유틸/함수**: camelCase (예: `formatDate.ts`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_FILE_SIZE`)
- **타입/인터페이스**: PascalCase (예: `UserProfile`)

### 2.5 파일 크기 및 복잡도 관리
- **컴포넌트**: 300줄 이상이면 분리 고려
- **함수**: 50줄 이상이면 작은 함수로 분해
- **함수 매개변수**: 3개 이상이면 객체로 통합
- **중첩 깊이**: 4단계 이상 피하기

---

## 3. 함수 & 컴포넌트 작성 가이드

### 3.1 함수 작성
```typescript
/**
 * 사용자 이메일이 유효한지 확인하는 함수
 * @param email - 검증할 이메일 주소
 * @returns true면 유효함, false면 유효하지 않음
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### 3.2 컴포넌트 작성
```typescript
/**
 * 사용자 프로필을 표시하는 컴포넌트
 * - 사용자 이름과 프로필 사진 표시
 * - 클릭 시 프로필 페이지로 이동
 */
interface UserCardProps {
  userId: string;
  userName: string;
  avatar?: string;
}

function UserCard({ userId, userName, avatar }: UserCardProps) {
  return (
    // JSX...
  );
}
```

---

## 4. 테스트 및 품질 관리

### 4.1 테스트 작성 규칙

#### MVP 단계 (현재) - 현실적인 타협안
개발 속도와 테스트의 균형을 맞추기 위해 다음과 같이 진행:
- **핵심 비즈니스 로직만 단위 테스트** (예: 인증, 데이터 파싱, 유틸 함수)
- **UI 테스트는 후순위** (기획/UI가 정해진 후 추가)
- **통합 테스트는 필수 기능 중심** (회원가입→로그인→대시보드 등 주요 플로우)
- **이유**: MVP 단계에서 UI/기획이 빠르게 변하면 테스트 유지보수 비용이 개발 속도를 저하

#### 성숙 단계 이후 - 체계적 테스트
- **단위 테스트**: 모든 함수/컴포넌트 작성
- **통합 테스트**: 기능 간 연동 확인
- **E2E 테스트**: 사용자 시나리오 기반 테스트

### 4.2 코드 리뷰 체크리스트
- [ ] 주석이 명확하고 충분한가?
- [ ] 함수/컴포넌트가 하나의 책임만 가지는가?
- [ ] 공통 로직이 재사용 가능한가?
- [ ] 보안 문제는 없는가? (XSS, SQL Injection 등)
- [ ] 성능이 저하되지 않는가? (불필요한 렌더링 등)
- [ ] 테스트 코드가 있는가? (핵심 로직은 필수)

---

## 5. 성능 & 보안 체크리스트

### 5.1 성능 최적화
- [ ] 불필요한 리렌더링 방지 (React.memo, useMemo 활용)
- [ ] 큰 리스트는 가상화 사용 (windowing)
- [ ] 번들 크기 최적화 (tree-shaking, code-splitting)
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 데이터베이스 쿼리 최적화 (인덱싱, N+1 문제 방지)

### 5.2 보안 원칙
- [ ] 사용자 입력값은 항상 검증 & 살균 처리
- [ ] 민감한 정보(키, 토큰)는 환경변수로 관리
- [ ] HTTPS 사용 (본 운영환경)
- [ ] CORS 정책 적절히 설정
- [ ] 의존성 패키지 정기적으로 업데이트

---

## 6. 개발 프로세스

### 6.1 기능 개발 순서
1. **설계 단계**: 기능 동작 방식 계획
2. **타입 정의**: `shared/types.ts`에 필요한 타입 정의
3. **상수 정의**: `shared/const.ts`에 필요한 상수 정의
4. **로직 작성**: 비즈니스 로직부터 작성
5. **UI 작성**: 컴포넌트 작성
6. **테스트 작성**: 테스트 코드 작성
7. **리뷰**: 코드 리뷰 체크리스트 확인

### 6.2 DB 변경 사항 관리
1. `drizzle/schema.ts`에서 스키마 변경
2. `npx drizzle-kit generate` 실행하여 마이그레이션 생성
3. 마이그레이션 파일 검토
4. `npx drizzle-kit migrate` 실행하여 적용

---

## 7. 문서화 규칙

- **README**: 프로젝트 개요, 설치, 실행 방법
- **설정 파일**: `vite.config.ts`, `tsconfig.json` 등 주석 추가
- **복잡한 로직**: 상단에 설명 주석 작성
- **API 엔드포인트**: 입력값, 출력값, 에러 케이스 문서화
- **변경사항**: 버전/업데이트 내역 기록

---

## 8. TODO 및 개선점 기록

### MVP 단계 우선순위
- [ ] 신규 기능 추가 시 관련 폴더/파일 구조 반영
- [ ] 공통 유틸 함수는 `shared/` 또는 `client/src/lib/`에 작성
- [ ] DB 마이그레이션은 `drizzle/`에 추가
- [ ] 핵심 비즈니스 로직에만 단위 테스트 작성
- [ ] 유휴 코드(사용되지 않는 함수/컴포넌트) 정기적으로 제거

### 성능 & 확장성 개선 (Post-MVP)
- [ ] **데이터베이스 마이그레이션**: Google Sheets DB의 한계 인식
  - **현 상황**: 비용 절감을 위해 Google Sheets 사용 (무료)
  - **한계**: 필터링/정렬, JOIN 등 복잡한 쿼리, 동시성 처리, 트랜잭션 성능 부족
  - **권장 계획**: MVP 사용자 검증 후 `Supabase(PostgreSQL)` 또는 `PlanetScale`로 마이그레이션
  - **이점**: 관계형 DB의 인덱싱, 스케일링, 트랜잭션 처리 지원
- [ ] 의존성 패키지 정기적으로 업데이트 (보안 패치)
- [ ] 로깅 시스템 구축 (에러, 경고 추적)
- [ ] 성능 모니터링 도구 도입 (Sentry, LogRocket 등)

---

## 9. 구현 히스토리
## 9. 유용한 명령어

### 2026-04-04: 이메일/비밀번호 로그인 기능 구현
**배경**: 현재 OAuth만 있고 일반 로그인이 없어서 개발/테스트 어려움
```bash
# 프로젝트 설정 및 실행
pnpm install          # 의존성 설치
pnpm dev             # 개발 서버 실행

**구현 내용**:
1. **DB 스키마 변경** (`drizzle/schema.ts`)
   - `openId` → nullable로 변경 (OAuth 미사용 유저 지원)
   - `email` → unique로 변경 (로그인 ID)
   - `password` 필드 추가 (bcrypt로 해시된 비밀번호 저장)
   - 마이그레이션 파일: `drizzle/migrations/0002_email_auth_migration.sql`
# 타입 검사 및 린팅
pnpm type-check      # TypeScript 타입 검사
pnpm lint            # ESLint 실행

2. **백엔드 구현** (`server/db.ts`, `server/routers.ts`)
   - `createUserWithEmail()` - 회원가입 함수
   - `authenticateUser()` - 로그인 검증 함수
   - `hashPassword()` / `verifyPassword()` - 비밀번호 해싱
   - API: `auth.signUp`, `auth.signIn` (TRPC 라우터)
   - 의존성: bcrypt 추가
# 테스트
pnpm test            # 테스트 실행
pnpm test:watch      # 감시 모드 테스트

3. **프론트엔드 구현**
   - [Login.tsx](client/src/pages/Login.tsx) - 로그인 페이지
   - [SignUp.tsx](client/src/pages/SignUp.tsx) - 회원가입 페이지
   - 라우팅: `/login`, `/signup` 추가
   - `AppLayout` → `redirectOnUnauthenticated: true` 설정
# DB 관련
pnpm db:generate     # Drizzle 마이그레이션 생성
pnpm db:migrate      # 마이그레이션 적용
pnpm db:studio       # Drizzle Studio 실행

4. **사용 흐름**
   ```
   회원가입 → 로그인 → 세션 쿠키 저장 → 대시보드 접근 가능
   ```
# 빌드
pnpm build           # 프로덕션 빌드
```

### 2026-04-04: Google Sheets 환경 설정 완료
**배경**: 무료 DB가 필요해서 Google Sheets 사용 결정

**설정 내용**:
1. **서비스 계정 설정**
   - JSON 파일: `service-account.json` (Google Cloud 서비스 계정)
   - Google Cloud 서비스 계정 인증 설정 완료

2. **환경 변수 설정** (`.env`)
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=service-account.json
   GOOGLE_SHEETS_SPREADSHEET_ID=11qsSpEYFHjJ3_alMLLL6Ey0TBMgPWWknfqpsdFmN2bw
   ```

3. **활성화**
   - `sheetsDb.ts` 모듈이 자동으로 Google Sheets 연동
   - 기존 드리즐 DB 마이그레이션은 필요 없음 (Google Sheets 사용)

---

## 10. GitHub 설정 & 다중 디바이스 개발

### 10.1 초기 설정 (처음 한 번만)
```bash
# 원격 저장소 초기화 (GitHub 웹에서 저장소 생성 후)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

### 10.2 각 디바이스에서 작업 시작
```bash
# 1단계: 저장소 클론
git clone https://github.com/username/repo.git
cd YOUR_REPO

# 2단계: 의존성 설치
pnpm install

# 3단계: 환경 변수 설정 (.env 파일 직접 생성, Git 추적 안 함)
echo "DATABASE_URL=file:./db.sqlite" > .env

# 4단계: 로컬 DB(db.sqlite) 생성
npx drizzle-kit migrate  

# 5단계: 개발 서버 실행
pnpm dev
```

### 10.3 .gitignore 설정
```
# 로컬 환경 & DB
.env
.env.local
db.sqlite
db.sqlite-journal

# 빌드 결과
dist/
build/
.turbo/

# 의존성
node_modules/
pnpm-lock.yaml (팀 협업 시 추적, 혼자면 무시해도 됨)

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 로그
*.log
npm-debug.log*
```

### 10.4 다중 디바이스 워크플로우
### 12.4 다중 디바이스 워크플로우
**목표**: 여러 기기에서 같은 저장소로 작업할 때 db.sqlite + .env 파일 로컬 유지

1. **각 디바이스 독립적 DB**: 로컬 `db.sqlite` 유지 (공유 X)
2. **공유 코드**: 모든 변경사항 `git push`
3. **새 변경 동기화**: 작업 시작 전 `git pull`
4. **주의**: DB 스키마 변경 후 `npx drizzle-kit migrate` 필수

**예시 흐름**:
```bash
# 디바이스 A에서 작업
git pull
# 새 기능 개발...
git add .
git commit -m "Add new feature"
git push

# 디바이스 B에서 작업
git pull  # 디바이스 A의 변경사항 받기
# 필요 시 마이그레이션 실행
npx drizzle-kit migrate
# 계속 작업...
```

---

## 11. SQLite 데이터베이스 조회 방법
## 13. SQLite 데이터베이스 조회 방법

### 11.1 SQLite 설치 & 사용 (Windows PowerShell)
### SQLite 설치 & 사용 (Windows PowerShell)
```bash
# 1단계: sqlite3 설치 (Chocolatey 이용)
choco install sqlite

# 2단계: DB 파일 열기
sqlite3 ".\db.sqlite"

# 3단계: 유용한 명령어
.tables              # 모든 테이블 조회
.schema users        # users 테이블 스키마 확인
SELECT * FROM users; # 모든 사용자 조회
.exit                # 종료
```

### 11.2 VSCode 확장 프로그램 (권장)
### VSCode 확장 프로그램 (권장)
**SQLite** 확장 설치 (SQLite Editor by yy0931)
- VSCode 확장 마켓플레이스에서 "SQLite" 검색 후 설치
- `db.sqlite` 파일 우클릭 → "Open with SQLite"
- UI 버튼으로 데이터 조회 & 수정 가능

### 11.3 웹 기반 도구 (설치 없음)
### 웹 기반 도구 (설치 없음)
- [SQLUI](https://sqlui.vercel.app/) - 로컬 SQLite 파일 드래그앤드롭으로 조회
- [Sqlitestudio](https://sqlitestudio.pl/) - 다운로드 또는 포터블 버전 사용

2. **백엔드 구현** (`server/db.ts`, `server/routers.ts`)
   - `createUserWithEmail()` - 회원가입 함수
   - `authenticateUser()` - 로그인 검증 함수
   - `hashPassword()` / `verifyPassword()` - 비밀번호 해싱
   - API: `auth.signUp`, `auth.signIn` (TRPC 라우터)
   - 의존성: bcrypt 추가

3. **프론트엔드 구현**
   - [Login.tsx](client/src/pages/Login.tsx) - 로그인 페이지
   - [SignUp.tsx](client/src/pages/SignUp.tsx) - 회원가입 페이지
   - 라우팅: `/login`, `/signup` 추가
   - `AppLayout` → `redirectOnUnauthenticated: true` 설정

4. **사용 흐름**
   ```
   회원가입 → 로그인 → 세션 쿠키 저장 → 대시보드 접근 가능
   ```

### 2026-04-04: Google Sheets 환경 설정 완료
**배경**: 무료 DB가 필요해서 Google Sheets 사용 결정

**설정 내용**:
1. **서비스 계정 설정**
   - JSON 파일: `service-account.json` (Google Cloud 서비스 계정)
   - Google Cloud 서비스 계정 인증 설정 완료

2. **환경 변수 설정** (`.env`)
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=service-account.json
   GOOGLE_SHEETS_SPREADSHEET_ID=11qsSpEYFHjJ3_alMLLL6Ey0TBMgPWWknfqpsdFmN2bw
   ```

3. **활성화**
   - `sheetsDb.ts` 모듈이 자동으로 Google Sheets 연동
   - 기존 드리즐 DB 마이그레이션은 필요 없음 (Google Sheets 사용)

---

## 12. 참고 사항

- 파일/폴더 추가 시 본 문서에 구조 및 역할을 반드시 기록
- 개발 중 발견한 이슈, 개선점, 규칙 변경 등도 본 문서에 업데이트
- 매월 1회 기술 부채 정책 검토 (outdated 의존성, 리팩토링 필요 코드 등)
- **MVP 단계에서는 빠른 개발 속도와 테스트 유지보수 비용의 균형을 맞출 것**

---

## 13. 유용한 명령어
## 10. 유용한 명령어

```bash
# 프로젝트 설정 및 실행
pnpm install          # 의존성 설치
pnpm dev             # 개발 서버 실행

# 타입 검사 및 린팅
pnpm type-check      # TypeScript 타입 검사
pnpm lint            # ESLint 실행

# 테스트
pnpm test            # 테스트 실행
pnpm test:watch      # 감시 모드 테스트

# DB 관련
pnpm db:generate     # Drizzle 마이그레이션 생성
pnpm db:migrate      # 마이그레이션 적용
pnpm db:studio       # Drizzle Studio 실행

# 빌드
pnpm build           # 프로덕션 빌드
```

---

> **최초 생성:** 2026-04-04
> **마지막 수정:** 2026-04-05
> **최초 생성:** 2026-04-04
> **마지막 수정:** 2026-04-04
> **작성자:** GitHub Copilot
> 
> ℹ️ 이 파일은 프로젝트 개발 과정에서 참고할 수 있는 가이드입니다.
> 정기적으로 업데이트하여 최신 상태를 유지해주세요.
