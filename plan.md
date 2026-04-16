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

### 완료된 주요 기능 (2026-04-16 추가)
- [x] 마스터 자소서 3단계 재편 (경험정리 → 스토리기술 → 초안완성), 기업별 2단계 (기업설정 → 2차맞춤수정)
- [x] `refineForCompany` LLM 뮤테이션 추가 (마스터 초안 + 기업 정보로 2차 수정)
- [x] DOCX / PDF 내보내기 기능 (`client/src/lib/exportCoverLetter.ts`)
- [x] 마스터 완성 후 기업별 자소서 유도 팝업 (기업 선택 → cloneCoverLetter → 에디터 이동)
- [x] 경험 추가 시 샘플 데이터가 실제 값으로 삽입되던 버그 수정 (placeholder로만 표시)

### ⏳ 자소서 Lovable 개선 잔여 항목

#### 3. 저장 확신 제공 — "마지막 저장: N분 전" 상시 표시
**파일:** `client/src/pages/CoverLetterEditor.tsx`
- `updateMutation.onSuccess`에서 `lastSavedAt` 상태를 `Date.now()`로 갱신
- 헤더 영역에 "마지막 저장: 방금 전 / N분 전" 텍스트 상시 노출
- 1분 간격 `setInterval`로 상대 시각 업데이트
- 저장 중: 스피너, 완료: 시각으로 전환

#### 4. STAR 작성 중 가이드 질문 상시 노출
**파일:** `client/src/pages/CoverLetterEditor.tsx`
- 마스터 Step 2 STAR 입력 화면에서 현재 경험 타입의 가이드 질문 3개가 사라지는 문제
- STAR 입력창 상단 또는 우측에 `EXPERIENCE_GUIDES[exp.type].questions` 접이식 패널로 상시 노출
- 경험 선택 시 해당 타입 질문으로 자동 갱신

#### 5. 경험 없이 초안 생성 시 품질 경고
**파일:** `client/src/pages/CoverLetterEditor.tsx`
- `handleGenerateMasterDraft` 호출 시 경험이 없거나 STAR 필드가 모두 비어있으면 경고 다이얼로그 표시
- "경험 데이터가 없으면 초안 품질이 낮아집니다. 그래도 생성하시겠습니까?"
- Step 1, 2로 유도하는 버튼을 경고 안에 함께 제공

#### 6. 기업별 자소서와 마스터 관계 시각화
**파일:** `client/src/pages/CoverLetters.tsx`, `client/src/pages/Dashboard.tsx`
- 기업별 자소서 카드에 "마스터 기반" 뱃지 표시 (`parentId !== null` 조건)
- 마스터 `updatedAt` > 기업별 자소서 `updatedAt` 이면 "마스터가 업데이트됨" 경고 표시
- `getCoverLettersBrief` 응답에 `parentId`, `updatedAt` 포함 여부 확인 (현재 포함됨)

---

> **최근 업데이트:** 2026-04-16
> **작성자:** Claude Sonnet 4.6
