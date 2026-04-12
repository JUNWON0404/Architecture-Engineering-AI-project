# Project Design Document

## 🏗️ Architecture Overview
- **Frontend**: React 19 (TypeScript), Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js (Express), tRPC (Type-safe API)
- **Database**: PostgreSQL (Supabase) with Drizzle ORM (Mock Store fallback)
- **State Management**: TanStack Query (via tRPC)

## 🎨 Design Principles
1. **Glassmorphism & Modern Aesthetics**: 반투명 배경, 부드러운 그림자, 일관된 곡률(rounded-xl/2xl/3xl) 사용.
2. **Interactive Feedback**: 모든 클릭과 호버 시 Framer Motion을 이용한 부드러운 애니메이션 제공.
3. **Skeleton First**: 데이터 로딩 중에는 실제 UI 구조와 유사한 스켈레톤 UI를 반드시 노출.

## 🗄️ Database Schema (Key Entities)
- `users`: 사용자 인증 및 프로필
- `companies`: 기업 정보 및 채용 공고 개수
- `jobPostings`: 상세 채용 정보
- `coverLetters / resumes`: 사용자 서류 관리
- `schedules`: 인터뷰 및 주요 일정
