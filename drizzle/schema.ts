import {
  pgTable,
  serial,
  text,
  integer,
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
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
  lastSignedIn: integer("lastSignedIn").notNull(),
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
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
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
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
});

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = typeof interviewQuestions.$inferInsert;

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  isDefault: integer("isDefault").default(0),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  type: text("type").default("other").notNull(),
  scheduledAt: integer("scheduledAt").notNull(),
  description: text("description"),
  isCompleted: integer("isCompleted").default(0),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
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
  deadline: integer("deadline"),
  notes: text("notes"),
  status: text("status").default("interested").notNull(),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
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
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sector: text("sector").notNull(), // 건설, 건축, 플랜트 등
  established: integer("established"), // 설립년도
  employees: text("employees"), // 직원수 범위 예: "500-1000"
  revenue: text("revenue"), // 매출 예: "100억원"
  location: text("location"), // 본사 위치
  website: text("website"),
  description: text("description"), // 회사 소개
  thumbnail: text("thumbnail"), // 로고 이미지 URL
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
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
  postedAt: integer("postedAt").notNull(),
  deadline: integer("deadline"), // 마감일
  isActive: integer("isActive").default(1),
  createdAt: integer("createdAt").notNull(),
  updatedAt: integer("updatedAt").notNull(),
});

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;
