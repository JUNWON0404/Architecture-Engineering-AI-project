import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").unique(),
  email: text("email").unique(),
  password: text("password"),
  name: text("name"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  bio: text("bio"),
  targetJob: text("targetJob"),
  targetCompany: text("targetCompany"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  lastSignedIn: bigint("lastSignedIn", { mode: "number" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  position: text("position"),
  content: text("content"),
  status: text("status").default("draft").notNull(),
  // 마스터 자소서 관리 필드
  isMaster: integer("isMaster").default(0).notNull(), // 0: 일반, 1: 마스터
  parentId: integer("parentId"), // 마스터로부터 생성된 경우 마스터 ID 기록
  // 브레인스토밍 데이터
  major: text("major"),
  gpa: text("gpa"),
  certifications: text("certifications"),
  experience: text("experience"),
  activities: text("activities"),
  majorCourses: text("majorCourses"),
  keywords: text("keywords"),
  keyStory: text("keyStory"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = typeof coverLetters.$inferInsert;

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  category: text("category"),
  company: text("company"),
  position: text("position"),
  difficulty: text("difficulty").default("medium"),
  isPublic: integer("isPublic").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  isDefault: integer("isDefault").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  type: text("type").default("other").notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  description: text("description"),
  isCompleted: integer("isCompleted").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

export const companyBookmarks = pgTable("company_bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  companyName: text("companyName").notNull(),
  industry: text("industry"),
  position: text("position"),
  jobUrl: text("jobUrl"),
  deadline: bigint("deadline", { mode: "number" }),
  notes: text("notes"),
  status: text("status").default("interested").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type CompanyBookmark = typeof companyBookmarks.$inferSelect;
export type InsertCompanyBookmark = typeof companyBookmarks.$inferInsert;

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  isCompleted: integer("isCompleted").default(0),
  order: integer("order").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sector: text("sector").notNull(), // 건설, 건축, 플랜트 등
  rank: integer("rank"), // 시공능력평가 순위
  brand: text("brand"), // 대표 브랜드 (래미안, 힐스테이트 등)
  hiringSeason: text("hiringSeason"), // 주요 채용 시기
  salaryGuide: text("salaryGuide"), // 초봉 가이드
  established: integer("established"), // 설립년도
  employees: text("employees"), // 직원수
  revenue: text("revenue"), // 매출
  location: text("location"), // 본사 위치
  website: text("website"),
  description: text("description"), // 회사 소개
  thumbnail: text("thumbnail"), // 로고 이미지 URL
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  title: text("title").notNull(), // 채용 직무명
  position: text("position").notNull(), // 직급
  description: text("description"), // 채용 상세 설명
  requiredMajors: text("requiredMajors"), // JSON string: ["토목공학", "건축학"]
  salary: text("salary"), // 연봉
  location: text("location"), // 근무지
  postedAt: bigint("postedAt", { mode: "number" }).notNull(),
  deadline: bigint("deadline", { mode: "number" }), // 마감일
  isActive: integer("isActive").default(1),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;
