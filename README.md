# JobReady (Architecture-Engineering-AI-project)

건축 및 엔지니어링 분야 취업 준비를 위한 지능형 이력서 제작 및 관심 기업 정보 관리 플랫폼입니다.

## 🚀 주요 기능

- **이력서 & 자기소개서 편집기**: 전문적인 템플릿 기반의 실시간 문서 편집 및 관리
- **기업 북마크 & 정보 수집**: 관심 있는 기업들을 등록하고 정보를 체계적으로 수집
- **면접 질문 & 체크리스트**: 맞춤형 면접 예상 질문 관리 및 취업 준비 단계별 체크리스트 제공
- **대시보드**: 개인화된 대시보드를 통한 직무 준비 상태 모니터링
- **멀티 포트 지원**: 로컬 환경에서 다양한 테스트를 위한 멀티 서버 실행 지원 (Port 3000, 3001 등)

## 🛠 기술 스택

- **Frontend**: React, TypeScript, TailwindCSS, Lucide-React
- **Backend**: Node.js, Express, tRPC
- **Database**: Drizzle ORM, PostgreSQL (Supabase)
- **Tooling**: Vite, pnpm, tsx

## 🏁 시작하기

### 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```bash
cp .env.example .env
```

### 의존성 설치
```bash
pnpm install
```

### 개발 서버 실행
```bash
pnpm dev
# 또는 특정 포트 지정
# cross-env PORT=3001 pnpm dev
```

### 데이터베이스 마이그레이션
```bash
pnpm db:push
```

## 📂 프로젝트 구조

```text
.
├── client/
│   ├── public/         # 정적 자산
│   └── src/
│       ├── components/ # 공통 UI 및 주요 컴포넌트
│       ├── contexts/   # React Context (Theme 등)
│       ├── hooks/      # 커스텀 훅
│       ├── lib/        # 유틸리티 및 tRPC 클라이언트
│       ├── pages/      # 라우트별 페이지 컴포넌트
│       └── _core/      # 프론트엔드 핵심 로직 (useAuth 등)
├── drizzle/            # DB 스키마 및 마이그레이션
├── scripts/            # DB 데이터 시딩 및 관리 스크립트
├── server/             # 백엔드 서버 (Express + tRPC)
│   ├── _core/          # 시스템 핵심 모듈 (auth, llm, sdk, map 등)
│   ├── db.ts           # DB 연결 및 스토리지 접근
│   ├── routers.ts      # API 엔드포인트 (tRPC AppRouter)
│   ├── dev.ts          # 로컬 개발 서버 진입점
│   └── vercel.ts       # Vercel 배포 서버 진입점
└── shared/             # 프론트/백엔드 공유 영역
    ├── types.ts        # 공통 타입
    ├── const.ts        # 공통 상수
    └── _core/          # 공통 코어 로직 (에러 클래스 등)
```

---
© 2026 JUNWON0404. All rights reserved.
