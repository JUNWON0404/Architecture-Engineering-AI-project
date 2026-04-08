-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "openId" text UNIQUE,
  "email" text UNIQUE,
  "password" text,
  "name" text,
  "loginMethod" text,
  "role" text DEFAULT 'user' NOT NULL,
  "bio" text,
  "targetJob" text,
  "targetCompany" text,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  "lastSignedIn" bigint NOT NULL
);

-- 2. 기업 정보 테이블 (건설사/설계사 등)
CREATE TABLE IF NOT EXISTS "companies" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "sector" text NOT NULL, -- 건설, 건축설계, 토목, 플랜트 등
  "established" integer, -- 설립년도
  "employees" text, -- 직원수 (예: "1,000명 이상")
  "revenue" text, -- 매출액 (예: "5,000억원")
  "location" text, -- 본사 위치
  "website" text,
  "description" text, -- 회사 소개
  "thumbnail" text, -- 로고 이미지 URL
  "rank" integer, -- 시공능력평가 순위 등
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 3. 채용 공고 테이블
CREATE TABLE IF NOT EXISTS "job_postings" (
  "id" serial PRIMARY KEY,
  "companyId" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "title" text NOT NULL, -- 공고 제목
  "position" text NOT NULL, -- 직무 (예: 토목시공, 건축설계)
  "description" text, -- 상세 요강
  "requiredMajors" text, -- 관련 전공 (JSON string)
  "salary" text, -- 급여 정보
  "location" text, -- 근무지
  "postedAt" bigint NOT NULL,
  "deadline" bigint, -- 마감일
  "isActive" integer DEFAULT 1, -- 공고 활성화 여부
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 4. 기업 주요 실적 (건축/토목 특화)
CREATE TABLE IF NOT EXISTS "company_projects" (
  "id" serial PRIMARY KEY,
  "companyId" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "projectName" text NOT NULL, -- 프로젝트명 (예: 롯데월드타워)
  "category" text, -- 분류 (예: 초고층, 교량, 터널)
  "year" integer, -- 완공 또는 수주 연도
  "description" text,
  "imageUrl" text,
  "createdAt" bigint NOT NULL
);

-- 5. 기업 관련 뉴스/이슈
CREATE TABLE IF NOT EXISTS "company_news" (
  "id" serial PRIMARY KEY,
  "companyId" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "url" text, -- 뉴스 링크
  "source" text, -- 언론사
  "publishedAt" bigint, -- 보도 일자
  "createdAt" bigint NOT NULL
);

-- 6. 자기소개서 테이블
CREATE TABLE IF NOT EXISTS "cover_letters" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "title" text NOT NULL,
  "company" text,
  "position" text,
  "content" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 7. 면접 질문 테이블
CREATE TABLE IF NOT EXISTS "interview_questions" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "question" text NOT NULL,
  "answer" text,
  "category" text,
  "company" text,
  "position" text,
  "difficulty" text DEFAULT 'medium',
  "isPublic" integer DEFAULT 0,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 8. 이력서 테이블
CREATE TABLE IF NOT EXISTS "resumes" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "isDefault" integer DEFAULT 0,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 9. 취업 일정 테이블
CREATE TABLE IF NOT EXISTS "schedules" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "title" text NOT NULL,
  "company" text,
  "type" text DEFAULT 'other' NOT NULL,
  "scheduledAt" bigint NOT NULL,
  "description" text,
  "isCompleted" integer DEFAULT 0,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 10. 기업 즐겨찾기(북마크)
CREATE TABLE IF NOT EXISTS "company_bookmarks" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "companyName" text NOT NULL,
  "industry" text,
  "position" text,
  "jobUrl" text,
  "deadline" bigint,
  "notes" text,
  "status" text DEFAULT 'interested' NOT NULL,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);

-- 11. 체크리스트
CREATE TABLE IF NOT EXISTS "checklist_items" (
  "id" serial PRIMARY KEY,
  "userId" integer NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "isCompleted" integer DEFAULT 0,
  "order" integer DEFAULT 0,
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);
