# 프로젝트 개발 계획 (plan.md)

이 파일은 프로젝트의 구조, 주요 폴더/파일 역할, 개발 현황 및 로드맵을 기록하는 문서입니다.

---

## 1. 프로젝트 개요 및 도메인
- **도메인**: 건설 산업 특화 채용 플랫폼 (건설사 인재상 맞춤형 서비스)
- **핵심 아키텍처**:
  - **단일 마스터 자소서 (Single Master Draft)**: 사용자의 모든 데이터(브레인스토밍, 에피소드 등)는 오직 하나의 핵심 데이터에 집대성됨. 이를 기업별로 파생시키는 구조.
  - **tRPC + Drizzle ORM**: 타입 안전성이 보장된 풀스택 통신 및 PostgreSQL (Supabase) DB 조작.

---

## 2. 프로젝트 구조 및 기술 스택
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend**: Node.js (Express) + tRPC (Type-safe API)
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Deployment**: Vercel (Serverless Functions + Static Hosting)
  - `api/index.ts`: Vercel 전용 서버 브릿지
  - `dist/`: Vite 빌드 결과물 (정적 파일)

---

## 3. 핵심 기능 및 배포 전략
- **통합 필터링**: 별도의 북마크 페이지 없이 대시보드 스탯 카드를 통해 기업 리스트를 필터링.
- **하이브리드 빌드**: `pnpm build` 시 Vite(프론트)와 esbuild(서버)가 동시에 실행되어 `dist`와 `api` 폴더를 각각 생성.
- **환경 정합성**: 로컬 `.env`와 Vercel 환경 변수의 동기화를 최우선으로 관리.

---

## 4. TODO 및 진행 상황

### 🚀 완료된 주요 기능
- [x] 단일 마스터 자소서 시스템 및 통합 에디터 UI 구축
- [x] Vercel 배포 환경 최적화 (api/index.ts 구조 및 rewrites 설정)
- [x] Supabase 실거래 DB 연동 및 타임스탬프 타입 안정화 (bigint)
- [x] 자소서 MS Word 내보내기 및 건설 뉴스 RSS 연동

### ⏳ 향후 과제 (NEXT)
- [ ] **맞춤형 자소서 클로닝**: 마스터 문서를 바탕으로 특정 기업용 복사본 생성 및 튜닝
- [ ] **키워드 매칭 분석**: 기업 인재상 키워드와 자소서 유사도 시각화
- [ ] **AI 엔진 연동**: Gemini 기반 초안 생성 및 첨삭 기능 활성화
- [ ] **데이터 크롤링**: 건설사 실시간 채용 공고 자동 수집 파이프라인

---

> **최근 업데이트:** 2026-04-15
> **작성자:** Gemini CLI (베테랑 개발자)
