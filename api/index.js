// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import "dotenv/config";
import { and, desc, eq, sql, like, asc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";

// drizzle/schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  bigint
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
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
  lastSignedIn: bigint("lastSignedIn", { mode: "number" }).notNull()
});
var coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  position: text("position"),
  content: text("content"),
  status: text("status").default("draft").notNull(),
  // 마스터 자소서 관리 필드
  isMaster: integer("isMaster").default(0).notNull(),
  // 0: 일반, 1: 마스터
  parentId: integer("parentId"),
  // 마스터로부터 생성된 경우 마스터 ID 기록
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
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var interviewQuestions = pgTable("interview_questions", {
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
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  isDefault: integer("isDefault").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  company: text("company"),
  type: text("type").default("other").notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  description: text("description"),
  isCompleted: integer("isCompleted").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var companyBookmarks = pgTable("company_bookmarks", {
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
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  isCompleted: integer("isCompleted").default(0),
  order: integer("order").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sector: text("sector").notNull(),
  // 건설, 건축, 플랜트 등
  rank: integer("rank"),
  // 시공능력평가 순위
  brand: text("brand"),
  // 대표 브랜드 (래미안, 힐스테이트 등)
  hiringSeason: text("hiringSeason"),
  // 주요 채용 시기
  salaryGuide: text("salaryGuide"),
  // 초봉 가이드
  established: integer("established"),
  // 설립년도
  employees: text("employees"),
  // 직원수
  revenue: text("revenue"),
  // 매출
  location: text("location"),
  // 본사 위치
  website: text("website"),
  description: text("description"),
  // 회사 소개
  keywords: text("keywords"),
  // 기업 핵심 키워드 (인재상 등)
  thumbnail: text("thumbnail"),
  // 로고 이미지 URL
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  title: text("title").notNull(),
  // 채용 직무명
  position: text("position").notNull(),
  // 직급
  description: text("description"),
  // 채용 상세 설명
  requiredMajors: text("requiredMajors"),
  // JSON string: ["토목공학", "건축학"]
  salary: text("salary"),
  // 연봉
  location: text("location"),
  // 근무지
  postedAt: bigint("postedAt", { mode: "number" }).notNull(),
  deadline: bigint("deadline", { mode: "number" }),
  // 마감일
  isActive: integer("isActive").default(1),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});
var newsScraps = pgTable("news_scraps", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  companyId: integer("companyId"),
  // null이면 대시보드 핫뉴스 스크랩
  title: text("title").notNull(),
  link: text("link").notNull(),
  source: text("source"),
  pubDate: text("pubDate"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull()
});
var companyNotes = pgTable("company_notes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  companyId: integer("companyId").notNull(),
  content: text("content").notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull()
});

// server/db.ts
var _db = null;
var _client = null;
async function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env");
  }
  if (!_db) {
    try {
      if (!_client) {
        _client = postgres(process.env.DATABASE_URL, {
          prepare: false,
          connect_timeout: 10,
          max: 1,
          // 서버리스 환경 최적화
          idle_timeout: 20
        });
      }
      _db = drizzle(_client);
    } catch (error) {
      console.error("[Database] Connection failed!", error);
      throw error;
    }
  }
  return _db;
}
async function runQuery(dbQuery) {
  const db = await getDb();
  return await dbQuery(db);
}
async function upsertUser(user) {
  if (!user.openId) return;
  const openId = user.openId;
  await runQuery(async (db) => {
    const existingUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    if (existingUser.length > 0) {
      await db.update(users).set({ ...user, updatedAt: Date.now() }).where(eq(users.openId, openId));
    } else {
      await db.insert(users).values({ ...user, createdAt: Date.now(), updatedAt: Date.now() });
    }
  });
}
async function getUserByOpenId(openId) {
  return runQuery(async (db) => {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  });
}
async function getUserByEmail(email) {
  return runQuery(async (db) => {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  });
}
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
async function createUserWithEmail(email, password, name) {
  const hashedPassword = await hashPassword(password);
  const now = Date.now();
  const userData = { email, password: hashedPassword, name: name || null, loginMethod: "email", createdAt: now, updatedAt: now, lastSignedIn: now };
  return runQuery(async (db) => {
    await db.insert(users).values(userData);
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user[0];
  });
}
async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.password) throw new Error("\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC815\uD655\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4");
  if (!await verifyPassword(password, user.password)) throw new Error("\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC815\uD655\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4");
  return user;
}
async function getCoverLetters(userId) {
  return runQuery(async (db) => db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)));
}
async function getCoverLettersBrief(userId) {
  return runQuery(async (db) => db.select({ id: coverLetters.id, title: coverLetters.title, company: coverLetters.company, position: coverLetters.position, status: coverLetters.status, isMaster: coverLetters.isMaster, updatedAt: coverLetters.updatedAt }).from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)));
}
async function getMasterCoverLetter(userId) {
  return runQuery(async (db) => {
    const master = await db.select().from(coverLetters).where(and(eq(coverLetters.userId, userId), eq(coverLetters.isMaster, 1))).limit(1);
    if (master.length > 0) return master[0];
    const latest = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)).limit(1);
    return latest[0] || null;
  });
}
async function setMasterCoverLetter(userId, id) {
  return runQuery(async (db) => {
    await db.update(coverLetters).set({ isMaster: 0 }).where(eq(coverLetters.userId, userId));
    await db.update(coverLetters).set({ isMaster: 1 }).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
    const result = await db.select().from(coverLetters).where(eq(coverLetters.id, id)).limit(1);
    return result[0];
  });
}
async function cloneCoverLetter(masterId, userId, companyName) {
  const now = Date.now();
  return runQuery(async (db) => {
    const master = await db.select().from(coverLetters).where(and(eq(coverLetters.id, masterId), eq(coverLetters.userId, userId))).limit(1);
    if (master.length === 0) throw new Error("\uB9C8\uC2A4\uD130 \uC790\uC18C\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const { id: _, createdAt: __, updatedAt: ___, isMaster: ____, ...masterData } = master[0];
    const newData = { ...masterData, title: `${companyName} \uB9DE\uCDA4\uD615 \uC790\uC18C\uC11C`, company: companyName, isMaster: 0, parentId: masterId, status: "draft", createdAt: now, updatedAt: now };
    await db.insert(coverLetters).values(newData);
    const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
    return result[0];
  });
}
async function getCoverLetterById(id, userId) {
  return runQuery(async (db) => {
    const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
    return result[0];
  });
}
async function createCoverLetter(data) {
  return runQuery(async (db) => {
    await db.insert(coverLetters).values(data);
    const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, data.userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
    return result[0];
  });
}
async function updateCoverLetter(id, userId, data) {
  return runQuery(async (db) => {
    await db.update(coverLetters).set(data).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
    const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
    return result[0];
  });
}
async function deleteCoverLetter(id, userId) {
  return runQuery(async (db) => {
    await db.delete(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
  });
}
async function getResumes(userId) {
  return runQuery(async (db) => db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt)));
}
async function getResumeById(id, userId) {
  return runQuery(async (db) => {
    const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
    return result[0];
  });
}
async function createResume(data) {
  return runQuery(async (db) => {
    await db.insert(resumes).values(data);
    const result = await db.select().from(resumes).where(eq(resumes.userId, data.userId)).orderBy(desc(resumes.createdAt)).limit(1);
    return result[0];
  });
}
async function updateResume(id, userId, data) {
  return runQuery(async (db) => {
    await db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
    const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
    return result[0];
  });
}
async function deleteResume(id, userId) {
  return runQuery(async (db) => {
    await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  });
}
async function getInterviewQuestions(userId) {
  return runQuery(async (db) => db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(desc(interviewQuestions.updatedAt)));
}
async function createInterviewQuestion(data) {
  return runQuery(async (db) => {
    await db.insert(interviewQuestions).values(data);
    const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, data.userId)).orderBy(desc(interviewQuestions.createdAt)).limit(1);
    return result[0];
  });
}
async function updateInterviewQuestion(id, userId, data) {
  return runQuery(async (db) => {
    await db.update(interviewQuestions).set(data).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
    const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
    return result[0];
  });
}
async function deleteInterviewQuestion(id, userId) {
  return runQuery(async (db) => {
    await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
  });
}
async function getSchedules(userId) {
  return runQuery(async (db) => db.select().from(schedules).where(eq(schedules.userId, userId)).orderBy(desc(schedules.scheduledAt)));
}
async function createSchedule(data) {
  return runQuery(async (db) => {
    await db.insert(schedules).values(data);
    const result = await db.select().from(schedules).where(eq(schedules.userId, data.userId)).orderBy(desc(schedules.createdAt)).limit(1);
    return result[0];
  });
}
async function updateSchedule(id, userId, data) {
  return runQuery(async (db) => {
    await db.update(schedules).set(data).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
    const result = await db.select().from(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId))).limit(1);
    return result[0];
  });
}
async function deleteSchedule(id, userId) {
  return runQuery(async (db) => {
    await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
  });
}
async function getCompanyBookmarks(userId) {
  return runQuery(async (db) => db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, userId)).orderBy(desc(companyBookmarks.updatedAt)));
}
async function createCompanyBookmark(data) {
  return runQuery(async (db) => {
    await db.insert(companyBookmarks).values(data);
    const result = await db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, data.userId)).orderBy(desc(companyBookmarks.createdAt)).limit(1);
    return result[0];
  });
}
async function deleteCompanyBookmark(id, userId) {
  return runQuery(async (db) => {
    await db.delete(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
  });
}
async function getChecklistItems(userId) {
  return runQuery(async (db) => db.select().from(checklistItems).where(eq(checklistItems.userId, userId)).orderBy(checklistItems.order));
}
async function createChecklistItem(data) {
  return runQuery(async (db) => {
    await db.insert(checklistItems).values(data);
    const result = await db.select().from(checklistItems).where(eq(checklistItems.userId, data.userId)).orderBy(desc(checklistItems.createdAt)).limit(1);
    return result[0];
  });
}
async function updateChecklistItem(id, userId, data) {
  return runQuery(async (db) => {
    await db.update(checklistItems).set(data).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
    const result = await db.select().from(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId))).limit(1);
    return result[0];
  });
}
async function deleteChecklistItem(id, userId) {
  return runQuery(async (db) => {
    await db.delete(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
  });
}
async function getAllCompanies(options) {
  return runQuery(async (db) => {
    let query = db.select({ id: companies.id, name: companies.name, sector: companies.sector, rank: companies.rank, brand: companies.brand, hiringSeason: companies.hiringSeason, salaryGuide: companies.salaryGuide, keywords: companies.keywords, description: companies.description, revenue: companies.revenue, location: companies.location, employees: companies.employees, established: companies.established, website: companies.website, thumbnail: companies.thumbnail, createdAt: companies.createdAt, updatedAt: companies.updatedAt, jobPostingsCount: sql`count(${jobPostings.id})`.mapWith(Number) }).from(companies).leftJoin(jobPostings, and(eq(jobPostings.companyId, companies.id), eq(jobPostings.isActive, 1))).groupBy(companies.id);
    if (options?.location && options.location !== "all") {
      query = query.where(like(companies.location, `%${options.location}%`));
    }
    switch (options?.sortBy) {
      case "rank":
        query = query.orderBy(asc(companies.rank));
        break;
      case "name":
        query = query.orderBy(asc(companies.name));
        break;
      case "recent":
      default:
        query = query.orderBy(desc(companies.updatedAt));
        break;
    }
    return await query;
  });
}
async function getCompanyById(id) {
  return runQuery(async (db) => {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0] || null;
  });
}
async function getJobPostingsByCompanyId(companyId) {
  return runQuery(async (db) => db.select().from(jobPostings).where(eq(jobPostings.companyId, companyId)).orderBy(desc(jobPostings.postedAt)));
}
async function updateUserProfile(userId, data) {
  return runQuery(async (db) => {
    await db.update(users).set(data).where(eq(users.id, userId));
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0];
  });
}
async function insertNewsScrap(userId, data) {
  const now = Date.now();
  const scrapData = { userId, title: data.title, link: data.link, source: data.source, pubDate: data.pubDate, companyId: data.companyId ?? null, createdAt: now };
  return runQuery(async (db) => {
    const result = await db.insert(newsScraps).values(scrapData).returning();
    return result[0];
  });
}
async function getNewsScraps(userId, companyId) {
  return runQuery(async (db) => {
    const conditions = [eq(newsScraps.userId, userId)];
    if (companyId !== void 0) {
      conditions.push(companyId === null ? isNull(newsScraps.companyId) : eq(newsScraps.companyId, companyId));
    }
    return db.select().from(newsScraps).where(and(...conditions)).orderBy(desc(newsScraps.createdAt));
  });
}
async function deleteNewsScrap(id, userId) {
  return runQuery(async (db) => {
    await db.delete(newsScraps).where(and(eq(newsScraps.id, id), eq(newsScraps.userId, userId)));
  });
}
async function getCompanyNote(userId, companyId) {
  return runQuery(async (db) => {
    const result = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1);
    return result[0] || null;
  });
}
async function upsertCompanyNote(userId, companyId, content) {
  const now = Date.now();
  return runQuery(async (db) => {
    const existing = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(companyNotes).set({ content, updatedAt: now }).where(eq(companyNotes.id, existing[0].id)).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(companyNotes).values({ userId, companyId, content, updatedAt: now }).returning();
      return inserted;
    }
  });
}
async function getDashboardSummary(userId) {
  return runQuery(async (db) => {
    const now = Date.now();
    const [cvCount, resumeCount, bookmarkCount, upcomingSchedules, checklistData] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(coverLetters).where(eq(coverLetters.userId, userId)),
      db.select({ count: sql`count(*)` }).from(resumes).where(eq(resumes.userId, userId)),
      db.select({ count: sql`count(*)` }).from(companyBookmarks).where(eq(companyBookmarks.userId, userId)),
      db.select().from(schedules).where(and(eq(schedules.userId, userId), sql`${schedules.scheduledAt} > ${now}`, eq(schedules.isCompleted, 0))).orderBy(asc(schedules.scheduledAt)).limit(3),
      db.select().from(checklistItems).where(eq(checklistItems.userId, userId))
    ]);
    const total = checklistData.length;
    const completed = checklistData.filter((i) => i.isCompleted).length;
    return {
      counts: { coverLetters: Number(cvCount[0].count), resumes: Number(resumeCount[0].count), bookmarks: Number(bookmarkCount[0].count) },
      lastUpdatedMaster: checklistData.length > 0 ? Math.max(...checklistData.map((i) => i.updatedAt)) : Date.now(),
      upcomingSchedules,
      checklist: { progress: total > 0 ? Math.round(completed / total * 100) : 0, items: checklistData.filter((i) => !i.isCompleted).slice(0, 3) }
    };
  });
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const isDev = process.env.NODE_ENV === "development";
  return {
    httpOnly: true,
    path: "/",
    sameSite: isDev ? "lax" : "none",
    secure: isDev ? false : isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = Date.now();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        const now2 = Date.now();
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
          createdAt: now2,
          updatedAt: now2
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        if (process.env.NODE_ENV === "development") {
          console.warn("[Auth] Development mode: Skipping OAuth sync failure");
          const tempUser = {
            id: parseInt(sessionUserId) || 1,
            openId: sessionUserId,
            name: "Dev User",
            email: `dev-${sessionUserId}@localhost`,
            loginMethod: "development",
            role: "admin",
            bio: null,
            targetJob: null,
            targetCompany: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastSignedIn: Date.now(),
            password: null
          };
          return tempUser;
        }
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    const now = Date.now();
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
      createdAt: user.createdAt || now,
      updatedAt: now
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      const now = Date.now();
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import Parser from "rss-parser";
var rssParser = new Parser();
var appRouter = router({
  system: systemRouter,
  dashboard: router({
    getSummary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id))
  }),
  news: router({
    list: publicProcedure.input(z2.object({ companyName: z2.string() })).query(async ({ input }) => {
      try {
        let url;
        const isGlobal = input.companyName === "\uAC74\uC124";
        if (isGlobal) url = "http://www.conslove.co.kr/rss/clickTop.xml";
        else url = "http://www.conslove.co.kr/rss/allArticle.xml";
        const feed = await rssParser.parseURL(url);
        let items = feed.items;
        if (!isGlobal) {
          const cleanName = input.companyName.replace(/\(.*\)/, "").trim();
          items = items.filter((item) => item.title?.includes(cleanName) || item.contentSnippet?.includes(cleanName));
        }
        return items.slice(0, 5).map((item) => ({
          title: item.title?.split(" - ")[0] || "\uC81C\uBAA9 \uC5C6\uC74C",
          link: item.link || "#",
          pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
          source: isGlobal ? "\uD55C\uAD6D\uAC74\uC124\uC2E0\uBB38 \uC778\uAE30" : "\uD55C\uAD6D\uAC74\uC124\uC2E0\uBB38"
        }));
      } catch (error) {
        console.error("[News] RSS Fetch Error:", error);
        return [];
      }
    })
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user && process.env.NODE_ENV === "development") {
        return {
          id: 1,
          openId: "dev-user-id",
          email: "dev@example.com",
          name: "\uAC1C\uBC1C \uC0AC\uC6A9\uC790",
          role: "user",
          bio: "\uC548\uB155\uD558\uC138\uC694, \uAC1C\uBC1C \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4.",
          targetJob: "\uD480\uC2A4\uD0DD \uAC1C\uBC1C\uC790",
          targetCompany: "\uAD6C\uAE00",
          loginMethod: "email",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastSignedIn: Date.now()
        };
      }
      return ctx.user;
    }),
    signUp: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string().min(8), name: z2.string().optional() })).mutation(async ({ input, ctx }) => {
      const user = await createUserWithEmail(input.email, input.password, input.name);
      const sessionToken = await sdk.createSessionToken(user.id.toString(), { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, user };
    }),
    signIn: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string() })).mutation(async ({ input, ctx }) => {
      const user = await authenticateUser(input.email, input.password);
      const sessionToken = await sdk.createSessionToken(user.id.toString(), { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    })
  }),
  coverLetter: router({
    getMaster: protectedProcedure.query(async ({ ctx }) => {
      const master = await getMasterCoverLetter(ctx.user.id);
      if (master) return master;
      return createCoverLetter({ userId: ctx.user.id, title: "\uB098\uC758 \uB9C8\uC2A4\uD130 \uC790\uC18C\uC11C", status: "draft", isMaster: 1, createdAt: Date.now(), updatedAt: Date.now() });
    }),
    listBrief: protectedProcedure.query(({ ctx }) => getCoverLettersBrief(ctx.user.id)),
    list: protectedProcedure.query(({ ctx }) => getCoverLetters(ctx.user.id)),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(({ ctx, input }) => getCoverLetterById(input.id, ctx.user.id)),
    setMaster: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => setMasterCoverLetter(ctx.user.id, input.id)),
    clone: protectedProcedure.input(z2.object({ masterId: z2.number(), companyName: z2.string() })).mutation(({ ctx, input }) => cloneCoverLetter(input.masterId, ctx.user.id, input.companyName)),
    create: protectedProcedure.input(z2.object({ title: z2.string(), company: z2.string().optional(), position: z2.string().optional(), content: z2.string().optional(), status: z2.enum(["draft", "completed", "submitted"]).optional() })).mutation(({ ctx, input }) => createCoverLetter({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z2.object({ id: z2.number(), title: z2.string().optional(), content: z2.string().optional(), status: z2.enum(["draft", "completed", "submitted"]).optional() })).mutation(({ ctx, input }) => updateCoverLetter(input.id, ctx.user.id, { ...input, updatedAt: Date.now() })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteCoverLetter(input.id, ctx.user.id))
  }),
  interview: router({
    list: protectedProcedure.query(({ ctx }) => getInterviewQuestions(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ question: z2.string(), answer: z2.string().optional() })).mutation(({ ctx, input }) => createInterviewQuestion({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z2.object({ id: z2.number(), question: z2.string().optional(), answer: z2.string().optional() })).mutation(({ ctx, input }) => updateInterviewQuestion(input.id, ctx.user.id, input)),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteInterviewQuestion(input.id, ctx.user.id))
  }),
  resume: router({
    list: protectedProcedure.query(({ ctx }) => getResumes(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ title: z2.string(), content: z2.string().optional() })).mutation(({ ctx, input }) => createResume({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(({ ctx, input }) => getResumeById(input.id, ctx.user.id)),
    update: protectedProcedure.input(z2.object({ id: z2.number(), title: z2.string().optional(), content: z2.string().optional(), isDefault: z2.boolean().optional() })).mutation(({ ctx, input }) => updateResume(input.id, ctx.user.id, { ...input, isDefault: input.isDefault !== void 0 ? input.isDefault ? 1 : 0 : void 0 })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteResume(input.id, ctx.user.id))
  }),
  schedule: router({
    list: protectedProcedure.query(({ ctx }) => getSchedules(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ title: z2.string(), scheduledAt: z2.number(), type: z2.enum(["application", "document", "interview", "test", "other"]) })).mutation(({ ctx, input }) => createSchedule({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z2.object({ id: z2.number(), title: z2.string().optional(), scheduledAt: z2.number().optional(), isCompleted: z2.boolean().optional() })).mutation(({ ctx, input }) => updateSchedule(input.id, ctx.user.id, { ...input, isCompleted: input.isCompleted ? 1 : 0 })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteSchedule(input.id, ctx.user.id))
  }),
  bookmark: router({
    list: protectedProcedure.query(({ ctx }) => getCompanyBookmarks(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ companyName: z2.string() })).mutation(({ ctx, input }) => createCompanyBookmark({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteCompanyBookmark(input.id, ctx.user.id))
  }),
  checklist: router({
    list: protectedProcedure.query(({ ctx }) => getChecklistItems(ctx.user.id)),
    create: protectedProcedure.input(z2.object({ title: z2.string(), description: z2.string().optional(), category: z2.string().optional() })).mutation(({ ctx, input }) => createChecklistItem({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z2.object({ id: z2.number(), isCompleted: z2.boolean().optional() })).mutation(({ ctx, input }) => updateChecklistItem(input.id, ctx.user.id, { ...input, isCompleted: input.isCompleted ? 1 : 0 })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteChecklistItem(input.id, ctx.user.id))
  }),
  company: router({
    list: publicProcedure.input(z2.object({ location: z2.string().nullable().optional(), sortBy: z2.enum(["rank", "name", "recent"]).optional() }).optional()).query(({ input }) => getAllCompanies(input ? { ...input, location: input.location ?? void 0 } : void 0)),
    get: publicProcedure.input(z2.object({ id: z2.number() })).query(({ input }) => getCompanyById(input.id)),
    jobPostings: publicProcedure.input(z2.object({ companyId: z2.number() })).query(({ input }) => getJobPostingsByCompanyId(input.companyId))
  }),
  profile: router({
    update: protectedProcedure.input(z2.object({ name: z2.string().optional(), bio: z2.string().optional() })).mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input))
  }),
  newsScrap: router({
    list: protectedProcedure.input(z2.object({ companyId: z2.number().nullish() }).optional()).query(({ ctx, input }) => getNewsScraps(ctx.user.id, input?.companyId)),
    create: protectedProcedure.input(z2.object({ title: z2.string(), link: z2.string(), source: z2.string(), pubDate: z2.string(), companyId: z2.number().nullish() })).mutation(({ ctx, input }) => insertNewsScrap(ctx.user.id, input)),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteNewsScrap(input.id, ctx.user.id))
  }),
  incruit: router({
    list: publicProcedure.input(z2.object({ type: z2.enum(["occupation", "open", "industry"]) })).query(async ({ input }) => {
      try {
        let url;
        if (input.type === "occupation") url = "https://www.incruit.com/rss/job.asp?occ1=107";
        else if (input.type === "open") url = "https://www.incruit.com/rss/job.asp?jobtycd=1&today=y";
        else url = "https://www.incruit.com/rss/job.asp?Ind1=21";
        const feed = await rssParser.parseURL(url);
        return feed.items.slice(0, 10).map((item) => {
          const match = item.title?.match(/\[(.*?)\] (.*)/);
          return {
            company: match ? match[1] : "\uC778\uD06C\uB8E8\uD2B8 \uCC44\uC6A9",
            title: match ? match[2] : item.title || "\uCC44\uC6A9 \uACF5\uACE0",
            link: item.link || "#",
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : ""
          };
        });
      } catch (error) {
        console.error("[Incruit] RSS Fetch Error:", error);
        return [];
      }
    })
  }),
  companyNote: router({
    get: protectedProcedure.input(z2.object({ companyId: z2.number() })).query(({ ctx, input }) => getCompanyNote(ctx.user.id, input.companyId)),
    upsert: protectedProcedure.input(z2.object({ companyId: z2.number(), content: z2.string() })).mutation(({ ctx, input }) => upsertCompanyNote(ctx.user.id, input.companyId, input.content))
  })
});

// server/_core/context.ts
var DEV_USER = {
  id: 1,
  openId: "dev-user-id",
  email: "dev@example.com",
  password: "",
  name: "\uAC1C\uBC1C \uC0AC\uC6A9\uC790",
  loginMethod: "email",
  role: "user",
  bio: "",
  targetJob: "",
  targetCompany: "",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastSignedIn: Date.now()
};
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "development") {
    console.warn("[Auth] Using DEV_USER fallback for local development");
    user = DEV_USER;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
async function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  const apiRouter = express.Router();
  registerOAuthRoutes(apiRouter);
  apiRouter.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app.use("/api", apiRouter);
  app.get("/api/health", (req, res) => res.send("OK"));
  return app;
}
var appPromise = createExpressApp();
async function handler(req, res) {
  getDb().catch((err) => console.error("[Database] Init error:", err));
  const app = await appPromise;
  return app(req, res);
}
export {
  createExpressApp,
  handler as default
};
