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
    console.error("[Database] DATABASE_URL is missing!");
    throw new Error("DATABASE_URL is missing in .env");
  }
  if (!_db) {
    console.log("[Database] Initializing new connection...");
    try {
      const isProduction = process.env.NODE_ENV === "production";
      _client = postgres(process.env.DATABASE_URL, {
        prepare: false,
        connect_timeout: 10,
        // 30초에서 10초로 단축 (빠른 실패 후 재시도 유도)
        max: isProduction ? 10 : 5,
        // 동시 쿼리 처리를 위해 풀 크기 확장
        idle_timeout: 20,
        max_lifetime: 60 * 5,
        // 서버리스 환경을 고려해 5분으로 조정
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        // Vercel/Supabase 연결 안정성 강화
        onnotice: () => {
        }
      });
      _db = drizzle(_client);
      console.log("[Database] Connection established.");
    } catch (error) {
      _client = null;
      _db = null;
      console.error("[Database] Connection failed!", error);
      throw error;
    }
  }
  return _db;
}
function resetDbConnection() {
  _client = null;
  _db = null;
}
async function runQuery(dbQuery) {
  const db = await getDb();
  try {
    return await dbQuery(db);
  } catch (error) {
    const isConnErr = error?.code === "CONNECTION_CLOSED" || error?.code === "CONNECTION_ENDED" || error?.message?.includes("connection");
    if (isConnErr) {
      console.warn("[Database] Connection error, resetting and retrying once...");
      resetDbConnection();
      const freshDb = await getDb();
      return await dbQuery(freshDb);
    }
    throw error;
  }
}
async function upsertUser(user) {
  if (!user.openId) return;
  const now = Date.now();
  await runQuery(async (db) => {
    const updateFields = {
      loginMethod: user.loginMethod,
      name: user.name,
      lastSignedIn: user.lastSignedIn ?? now,
      updatedAt: now
    };
    const byOpenId = await db.select({ id: users.id }).from(users).where(eq(users.openId, user.openId)).limit(1);
    if (byOpenId.length > 0) {
      await db.update(users).set(updateFields).where(eq(users.id, byOpenId[0].id));
      return;
    }
    if (user.email) {
      const byEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email)).limit(1);
      if (byEmail.length > 0) {
        console.log("[DB] upsertUser: linking existing email account to openId:", user.openId);
        await db.update(users).set({ openId: user.openId, ...updateFields }).where(eq(users.id, byEmail[0].id));
        return;
      }
    }
    await db.insert(users).values({
      ...user,
      createdAt: user.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now
    });
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
  return runQuery(async (db) => {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      if (!existing[0].openId) {
        await db.update(users).set({ openId: `email:${email}`, password: hashedPassword, name: name || existing[0].name, updatedAt: now }).where(eq(users.email, email));
        const fixed = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return fixed[0];
      }
      throw new Error("\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.");
    }
    await db.insert(users).values({
      openId: `email:${email}`,
      email,
      password: hashedPassword,
      name: name || null,
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    });
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
    const [updated] = await db.update(coverLetters).set(data).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).returning();
    return updated;
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
async function getCoverLettersByCompany(userId, companyName) {
  return runQuery(
    async (db) => db.select({
      id: coverLetters.id,
      title: coverLetters.title,
      position: coverLetters.position,
      status: coverLetters.status,
      updatedAt: coverLetters.updatedAt
    }).from(coverLetters).where(and(eq(coverLetters.userId, userId), eq(coverLetters.company, companyName), eq(coverLetters.isMaster, 0))).orderBy(desc(coverLetters.updatedAt))
  );
}
async function searchCompanies(query) {
  return runQuery(
    async (db) => db.select({
      id: companies.id,
      name: companies.name,
      sector: companies.sector,
      rank: companies.rank,
      brand: companies.brand,
      description: companies.description,
      keywords: companies.keywords,
      thumbnail: companies.thumbnail
    }).from(companies).where(like(companies.name, `%${query}%`)).orderBy(asc(companies.rank)).limit(10)
  );
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
  return runQuery(async (db) => {
    let finalCompanyId = data.companyId === void 0 || data.companyId === null ? null : data.companyId;
    if (finalCompanyId === null) {
      const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
      for (const company of allCompanies) {
        const cleanName = company.name.replace(/\(.*\)/g, "").replace(/주식회사/g, "").trim();
        if (data.title.includes(cleanName)) {
          finalCompanyId = company.id;
          console.log(`[NewsScrap] Auto-matched news to company: ${company.name} (ID: ${company.id})`);
          break;
        }
      }
    }
    const existing = await db.select().from(newsScraps).where(and(eq(newsScraps.userId, userId), eq(newsScraps.link, data.link))).limit(1);
    if (existing.length > 0) {
      if (existing[0].companyId === null && finalCompanyId !== null) {
        const [updated] = await db.update(newsScraps).set({ companyId: finalCompanyId }).where(eq(newsScraps.id, existing[0].id)).returning();
        return updated;
      }
      return existing[0];
    }
    const scrapData = {
      userId,
      title: data.title || "\uC81C\uBAA9 \uC5C6\uC74C",
      link: data.link,
      source: data.source || "\uCD9C\uCC98 \uBBF8\uC0C1",
      pubDate: data.pubDate || "",
      companyId: finalCompanyId,
      createdAt: now
    };
    const [inserted] = await db.insert(newsScraps).values(scrapData).returning();
    return inserted;
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
function getSessionCookieOptions(req) {
  const isDev = process.env.NODE_ENV === "development";
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isDev ? false : true
    // 배포 환경에서는 항상 true (HTTPS)
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
  get appId() {
    return process.env.VITE_APP_ID ?? "";
  },
  get cookieSecret() {
    return process.env.JWT_SECRET ?? "";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get oAuthServerUrl() {
    return process.env.OAUTH_SERVER_URL ?? "";
  },
  get ownerOpenId() {
    return process.env.OWNER_OPEN_ID ?? "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get forgeApiUrl() {
    return process.env.BUILT_IN_FORGE_API_URL ?? "";
  },
  get forgeApiKey() {
    return process.env.BUILT_IN_FORGE_API_KEY ?? "";
  },
  get groqApiKey() {
    return process.env.GROQ_API_KEY ?? "";
  },
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY ?? "";
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID ?? "";
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET ?? "";
  }
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
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
        appId: ENV.appId || "jobready",
        name: options.name || "user"
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
      console.log("[Auth] JWT payload keys:", Object.keys(payload), "| openId type:", typeof openId, "| openId value:", String(openId).slice(0, 30));
      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId: appId || "jobready",
        name: name || ""
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
    console.log("[Auth] Looking up user by openId:", sessionUserId);
    let user = await getUserByOpenId(sessionUserId);
    console.log("[Auth] getUserByOpenId result:", user ? `found (id=${user.id})` : "null");
    if (!user && ENV.oAuthServerUrl) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        const now = Date.now();
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
          createdAt: now,
          updatedAt: now
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
function getGoogleRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const rawProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(rawProto) ? rawProto[0] : rawProto?.split(",")[0]?.trim()) ?? req.protocol;
  const rawHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost) ?? req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}
function registerOAuthRoutes(app) {
  app.get("/auth/google", (req, res) => {
    console.log("[OAuth] GOOGLE_CLIENT_ID set:", !!ENV.googleClientId, "| NODE_ENV:", process.env.NODE_ENV);
    if (!ENV.googleClientId) {
      console.error("[OAuth] Missing GOOGLE_CLIENT_ID. Available env keys:", Object.keys(process.env).filter((k) => k.startsWith("GOOGLE")));
      res.status(500).send("GOOGLE_CLIENT_ID\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const redirectUri = getGoogleRedirectUri(req);
    console.log("[OAuth] redirect_uri:", redirectUri);
    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account"
    });
    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });
  app.get("/auth/google/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");
    if (error || !code) {
      console.error("[Google OAuth] Callback error:", error);
      res.redirect(302, "/login?error=google_auth_failed");
      return;
    }
    try {
      const redirectUri = getGoogleRedirectUri(req);
      console.log("[Google OAuth] Step 1: token exchange, redirect_uri:", redirectUri);
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        }).toString()
      });
      if (!tokenRes.ok) {
        const text2 = await tokenRes.text();
        throw new Error(`Step 1 failed - Token exchange: ${text2}`);
      }
      console.log("[Google OAuth] Step 1: OK");
      const tokenData = await tokenRes.json();
      console.log("[Google OAuth] Step 2: fetch user info");
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { authorization: `Bearer ${tokenData.access_token}` }
      });
      if (!userInfoRes.ok) {
        throw new Error(`Step 2 failed - User info: ${userInfoRes.status}`);
      }
      const userInfo = await userInfoRes.json();
      console.log("[Google OAuth] Step 2: OK, email:", userInfo.email);
      const now = Date.now();
      const googleOpenId = `google:${userInfo.sub}`;
      console.log("[Google OAuth] Step 3: upsertUser, openId:", googleOpenId);
      await upsertUser({
        openId: googleOpenId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now
      });
      console.log("[Google OAuth] Step 3: OK");
      if (!ENV.cookieSecret) {
        throw new Error("JWT_SECRET \uD658\uACBD \uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. Vercel \uB300\uC2DC\uBCF4\uB4DC\uC5D0\uC11C \uD655\uC778\uD558\uC138\uC694.");
      }
      const sessionToken = await sdk.createSessionToken(googleOpenId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      console.log("[Google OAuth] Step 3.5: sessionToken created, length:", sessionToken.length);
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.clearCookie(COOKIE_NAME, { path: "/", secure: true, sameSite: "lax" });
      const cookieOpts = { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS };
      console.log("[Google OAuth] Step 4: setting cookie, opts:", JSON.stringify(cookieOpts));
      res.cookie(COOKIE_NAME, sessionToken, cookieOpts);
      console.log("[Google OAuth] Step 4: Set-Cookie header:", res.getHeader("set-cookie"));
      res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logging in...</title></head><body><script>window.location.replace('/dashboard');</script></body></html>`);
    } catch (err) {
      console.error("[Google OAuth] Callback failed:", String(err));
      res.redirect(302, "/login?error=google_auth_failed");
    }
  });
  app.get("/oauth/callback", async (req, res) => {
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

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveProvider = () => {
  if (ENV.geminiApiKey) return "gemini";
  if (ENV.groqApiKey && ENV.groqApiKey.startsWith("gsk_")) return "groq";
  return "forge";
};
var resolveApiUrl = (provider) => {
  if (provider === "gemini") return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  if (provider === "groq") return "https://api.groq.com/openai/v1/chat/completions";
  return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
};
var resolveModel = (provider) => {
  if (provider === "gemini") return "gemini-2.0-flash";
  if (provider === "groq") return "llama-3.3-70b-versatile";
  return "gemini-2.0-flash";
};
var resolveApiKey = (provider) => {
  if (provider === "gemini") return ENV.geminiApiKey;
  if (provider === "groq") return ENV.groqApiKey;
  return ENV.forgeApiKey;
};
var assertApiKey = () => {
  if (!ENV.geminiApiKey && !ENV.groqApiKey && !ENV.forgeApiKey) {
    throw new Error("API Key (GEMINI, GROQ, or FORGE) is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const provider = resolveProvider();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: resolveModel(provider),
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  if (provider === "forge") {
    payload.max_tokens = 32768;
    payload.thinking = { budget_tokens: 128 };
  } else if (provider === "groq") {
    payload.max_tokens = 4096;
  } else if (provider === "gemini") {
    payload.max_tokens = 4096;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(provider), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey(provider)}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
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
var rssParser = new Parser({
  timeout: 5e3,
  headers: { "User-Agent": "Mozilla/5.0" }
});
var appRouter = router({
  system: systemRouter,
  dashboard: router({
    getSummary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id))
  }),
  news: router({
    list: publicProcedure.input(z2.object({ companyName: z2.string() })).query(async ({ input }) => {
      try {
        let url;
        const isGlobal = input.companyName === "\uAC74\uC124" || input.companyName === "\uD56B\uB274\uC2A4";
        if (isGlobal) url = "http://www.conslove.co.kr/rss/clickTop.xml";
        else url = "http://www.conslove.co.kr/rss/allArticle.xml";
        const feed = await rssParser.parseURL(url);
        let items = feed.items;
        if (!isGlobal) {
          const cleanName = input.companyName.replace(/\(.*\)/g, "").replace(/주식회사/g, "").trim();
          items = items.filter(
            (item) => item.title && item.title.includes(cleanName) || item.contentSnippet && item.contentSnippet.includes(cleanName)
          );
        }
        return items.slice(0, 5).map((item) => ({
          title: item.title?.split(" - ")[0] || "\uC81C\uBAA9 \uC5C6\uC74C",
          link: item.link || "#",
          pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
          source: isGlobal ? "\uD55C\uAD6D\uAC74\uC124\uC2E0\uBB38 \uC778\uAE30" : "\uD55C\uAD6D\uAC74\uC124\uC2E0\uBB38"
        }));
      } catch (error) {
        console.error("[News] RSS Fetch Error:", String(error));
        return [];
      }
    })
  }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.user;
    }),
    signUp: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string().min(8), name: z2.string().optional() })).mutation(async ({ input, ctx }) => {
      const user = await createUserWithEmail(input.email, input.password, input.name);
      const openId = user.openId || `email:${input.email}`;
      const sessionToken = await sdk.createSessionToken(openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", expires: /* @__PURE__ */ new Date(0) });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...opts, maxAge: ONE_YEAR_MS });
      return { success: true, user };
    }),
    signIn: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string() })).mutation(async ({ input, ctx }) => {
      const user = await authenticateUser(input.email, input.password);
      const correctOpenId = `email:${input.email}`;
      if (!user.openId) {
        await upsertUser({ openId: correctOpenId, email: input.email, name: user.name, loginMethod: "email", createdAt: user.createdAt || Date.now(), updatedAt: Date.now(), lastSignedIn: Date.now() });
      }
      const openId = user.openId || correctOpenId;
      console.log("[signIn] creating token with openId:", openId);
      const sessionToken = await sdk.createSessionToken(openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", expires: /* @__PURE__ */ new Date(0) });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...opts, maxAge: ONE_YEAR_MS });
      return { success: true, user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const opts = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, "", { ...opts, expires: /* @__PURE__ */ new Date(0) });
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
    update: protectedProcedure.input(z2.object({ id: z2.number(), title: z2.string().optional(), company: z2.string().optional(), position: z2.string().optional(), content: z2.string().optional(), status: z2.enum(["draft", "completed", "submitted"]).optional(), major: z2.string().optional(), gpa: z2.string().optional(), certifications: z2.string().optional(), experience: z2.string().optional(), activities: z2.string().optional(), majorCourses: z2.string().optional(), keywords: z2.string().optional(), keyStory: z2.string().optional() })).mutation(({ ctx, input }) => updateCoverLetter(input.id, ctx.user.id, { ...input, updatedAt: Date.now() })),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteCoverLetter(input.id, ctx.user.id)),
    generateDraft: protectedProcedure.input(z2.object({
      major: z2.string().optional().default(""),
      gpa: z2.string().optional().default(""),
      certifications: z2.string().optional().default(""),
      experience: z2.string().optional().default("[]"),
      majorCourses: z2.string().optional().default(""),
      keyStory: z2.string().optional().default(""),
      company: z2.string().optional().default("\uAC74\uC124\uC0AC"),
      position: z2.string().optional().default("\uC2DC\uACF5/\uC124\uACC4"),
      companyDescription: z2.string().optional().default(""),
      companyKeywords: z2.string().optional().default("")
    })).mutation(async ({ input }) => {
      const companyContext = input.companyDescription || input.companyKeywords ? `
[\uC9C0\uC6D0 \uAE30\uC5C5 \uCC38\uACE0 \uC815\uBCF4 - \uC9C1\uC811 \uC778\uC6A9 \uAE08\uC9C0, \uBC30\uACBD \uC774\uD574\uC6A9\uC73C\uB85C\uB9CC \uD65C\uC6A9]
- \uAE30\uC5C5 \uD2B9\uC131: ${input.companyDescription}
- \uC778\uC7AC\uC0C1/\uD575\uC2EC \uAC00\uCE58: ${input.companyKeywords}` : "";
      const prompt = `
[\uC9C0\uC6D0\uC790 \uB370\uC774\uD130]
- \uC9C0\uC6D0 \uAE30\uC5C5/\uC9C1\uBB34: ${input.company} / ${input.position}
- \uC804\uACF5/\uD559\uC810: ${input.major} (${input.gpa})
- \uC790\uACA9/\uC5ED\uB7C9: ${input.certifications} / ${input.majorCourses}
- \uD575\uC2EC \uACBD\uD5D8 (STAR):
${input.keyStory}
${companyContext}

[\uC791\uC131 \uC9C0\uCE68]
\uC544\uB798 \uB450 \uBC84\uC804\uC758 \uC790\uAE30\uC18C\uAC1C\uC11C \uCD08\uC548\uC744 \uAC01 500\uC790 \uB0B4\uC678\uB85C \uC791\uC131\uD558\uB77C.${companyContext ? `
\uAE30\uC5C5 \uC815\uBCF4\uB294 \uC9C0\uC6D0\uC790\uC758 \uACBD\uD5D8\uACFC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC5F0\uACB0\uB418\uB294 \uB9E5\uB77D \uC124\uC815\uC5D0\uB9CC \uD65C\uC6A9\uD558\uB77C. \uAE30\uC5C5 \uC18C\uAC1C \uBB38\uAD6C\uB098 \uC2AC\uB85C\uAC74\uC744 \uADF8\uB300\uB85C \uC62E\uACA8 \uC4F0\uC9C0 \uB9D0\uACE0, \uC9C0\uC6D0\uC790\uC758 \uC2E4\uC81C \uD589\uB3D9\uACFC \uACB0\uACFC\uB97C \uD1B5\uD574 \uD574\uB2F9 \uAE30\uC5C5\uC774 \uC6D0\uD558\uB294 \uC778\uC7AC\uC0C1\uC744 \uAC04\uC811\uC801\uC73C\uB85C \uC99D\uBA85\uD558\uB77C.` : ""}

\uBC84\uC804 \uAC00 - \uD604\uC7A5 \uC18C\uD1B5\uD615: TBM, \uC548\uC804 \uAD00\uB9AC, \uACF5\uC815 \uC870\uC728, \uB3CC\uBC1C \uBCC0\uC218 \uB300\uCC98\uB97C \uC911\uC2EC\uC73C\uB85C \uD604\uC7A5\uC5D0\uC11C \uC9C1\uC811 \uB6F0\uB294 \uC2E4\uD589\uB825\uC744 \uBD80\uAC01\uD55C\uB2E4.
\uAD6C\uC870: \uC18C\uC81C\uBAA9 \u2192 \uD604\uC7A5 \uBB38\uC81C \uC0C1\uD669 \u2192 \uC9C0\uC6D0\uC790\uC758 \uAD6C\uCCB4\uC801 \uB300\uC751 \u2192 \uC785\uC0AC \uD6C4 \uAE30\uC5EC

\uBC84\uC804 \uB098 - \uAE30\uC220 \uBD84\uC11D\uD615: CPM, BIM, Con-Tech \uB4F1 \uB370\uC774\uD130\xB7\uAE30\uC220 \uAE30\uBC18\uC73C\uB85C \uB9AC\uC2A4\uD06C\uB97C \uC0AC\uC804 \uCC28\uB2E8\uD558\uACE0 \uACF5\uC815\uC744 \uCD5C\uC801\uD654\uD558\uB294 \uC5ED\uB7C9\uC744 \uBD80\uAC01\uD55C\uB2E4.
\uAD6C\uC870: \uC18C\uC81C\uBAA9 \u2192 \uAE30\uC220\uC801 \uBB38\uC81C \uC815\uC758 \u2192 \uC9C0\uC6D0\uC790\uC758 \uBD84\uC11D\xB7\uC801\uC6A9 \uACFC\uC815 \u2192 \uC815\uB7C9 \uC131\uACFC \uBC0F \uC785\uC0AC \uD3EC\uBD80

[\uCD9C\uB825 \uD615\uC2DD]
\uBC84\uC804 \uAC00
[\uC18C\uC81C\uBAA9]
(\uBCF8\uBB38)
---OPTION_BOUNDARY---
\uBC84\uC804 \uB098
[\uC18C\uC81C\uBAA9]
(\uBCF8\uBB38)`;
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\uB2F9\uC2E0\uC740 \uB300\uD55C\uBBFC\uAD6D 1\uAD70 \uAC74\uC124\uC0AC(\uD604\uB300\uAC74\uC124, \uC0BC\uC131\uBB3C\uC0B0, GS\uAC74\uC124 \uB4F1)\uC5D0\uC11C 15\uB144\uAC04 \uCC44\uC6A9\uC744 \uCD1D\uAD04\uD55C \uCEE4\uB9AC\uC5B4 \uCF54\uCE58\uB2E4.

[\uC5B8\uC5B4 \uADDC\uCE59 - \uC808\uB300 \uC900\uC218]
- \uCD9C\uB825\uC740 \uBC18\uB4DC\uC2DC 100% \uC21C\uD55C\uAD6D\uC5B4\uB85C \uC791\uC131\uD55C\uB2E4. \uD55C\uC790, \uC77C\uBCF8\uC5B4, \uC77C\uBC18 \uC601\uC5B4 \uB2E8\uC5B4 \uD63C\uC6A9 \uAE08\uC9C0.
- \uAC74\uC124\xB7\uC5D4\uC9C0\uB2C8\uC5B4\uB9C1 \uC804\uBB38 \uC57D\uC5B4(TBM, CPM, BIM, Con-Tech)\uB9CC \uC608\uC678\uC801\uC73C\uB85C \uC601\uBB38 \uD5C8\uC6A9.

[\uC791\uC131 \uC6D0\uCE59]
- "\uC5F4\uC815", "\uCD5C\uC120", "\uB178\uB825", "\uC131\uC2E4" \uAC19\uC740 \uC9C4\uBD80\uD55C \uCD94\uC0C1\uC5B4 \uC0AC\uC6A9 \uAE08\uC9C0.
- \uC9C0\uC6D0\uC790\uC758 \uC2E4\uC81C \uD589\uB3D9\uACFC \uC218\uCE58\uB85C \uC5ED\uB7C9\uC744 \uC99D\uBA85\uD55C\uB2E4.
- \uAD6C\uBD84\uC120(---OPTION_BOUNDARY---)\uC744 \uC815\uD655\uD788 \uC0BD\uC785\uD558\uC5EC \uD30C\uC2F1 \uC624\uB958\uB97C \uBC29\uC9C0\uD55C\uB2E4.

[\uACE0\uD488\uC9C8 \uCD9C\uB825 \uC608\uC2DC - \uC774 \uC218\uC900\uACFC \uBB38\uCCB4\uB97C \uC720\uC9C0\uD560 \uAC83]
\uBC84\uC804 \uAC00
[\uD604\uC7A5\uC758 \uBCC0\uC218\uB97C \uACF5\uC815\uC73C\uB85C \uBB36\uB2E4]
\uC544\uD30C\uD2B8 \uC2E0\uCD95 \uD604\uC7A5\uC5D0\uC11C \uCCA0\uADFC \uBC30\uADFC \uAC04\uACA9 \uC624\uCC28\uB97C \uB3C4\uBA74\uACFC \uB300\uC870\uD574 \uC9C1\uC811 \uAC80\uC218\uD558\uBA70, \uD558\uB8E8 \uD3C9\uADE0 3\uAC74\uC758 \uC2DC\uACF5 \uC624\uB958\uB97C \uC0AC\uC804\uC5D0 \uCC28\uB2E8\uD588\uC2B5\uB2C8\uB2E4. TBM \uC2DC\uAC04\uC5D0 \uB2F9\uC77C \uACF5\uC815 \uB9AC\uC2A4\uD06C\uB97C \uD611\uB825\uC0AC\uC640 \uACF5\uC720\uD558\uACE0, \uC790\uC7AC \uBC18\uC785 \uC9C0\uC5F0 \uC0C1\uD669\uC5D0\uC11C\uB294 \uACF5\uC885 \uC21C\uC11C\uB97C \uC870\uC815\uD574 \uACF5\uAE30 \uC9C0\uC5F0 \uC5C6\uC774 \uB9C8\uAC10\uD588\uC2B5\uB2C8\uB2E4. \uD604\uC7A5\uC5D0\uC11C \uC313\uC740 \uC774 \uC870\uC728 \uACBD\uD5D8\uC744 \uBC14\uD0D5\uC73C\uB85C, \uC785\uC0AC \uD6C4\uC5D0\uB294 \uD611\uB825\uC0AC\uC640\uC758 \uC2E0\uB8B0\uB97C \uAE30\uBC18\uC73C\uB85C \uACF5\uC815 \uC815\uC0C1\uD654\uB97C \uC8FC\uB3C4\uD558\uB294 \uD604\uC7A5 \uAD00\uB9AC\uC790\uAC00 \uB418\uACA0\uC2B5\uB2C8\uB2E4.
---OPTION_BOUNDARY---
\uBC84\uC804 \uB098
[\uB370\uC774\uD130\uB85C \uB9AC\uC2A4\uD06C\uB97C \uC124\uACC4 \uB2E8\uACC4\uC5D0\uC11C \uCC28\uB2E8\uD558\uB2E4]
BIM \uAE30\uBC18 \uC124\uACC4 \uD504\uB85C\uC81D\uD2B8\uC5D0\uC11C Revit \uD1B5\uD569 \uBAA8\uB378\uB9C1\uC744 \uC8FC\uB3C4\uD558\uBA70 \uC5D0\uB108\uC9C0 \uC2DC\uBBAC\uB808\uC774\uC158\uC744 \uD1B5\uD574 \uC5F4\uC190\uC2E4\uC744 \uAE30\uC874 \uB300\uBE44 15% \uC808\uAC10\uD558\uB294 \uB300\uC548\uC744 \uB3C4\uCD9C\uD588\uC2B5\uB2C8\uB2E4. \uAC04\uC12D \uCCB4\uD06C\uB97C \uD1B5\uD574 \uC2DC\uACF5 \uB2E8\uACC4\uC758 \uC7AC\uC791\uC5C5 \uC694\uC778\uC744 \uC0AC\uC804\uC5D0 \uC81C\uAC70\uD558\uACE0, CPM \uC77C\uC815 \uBD84\uC11D\uC73C\uB85C \uC8FC\uACF5\uC815 \uC791\uC5C5\uC5D0 \uC790\uC6D0\uC744 \uC9D1\uC911 \uBC30\uBD84\uD588\uC2B5\uB2C8\uB2E4. \uC785\uC0AC \uD6C4\uC5D0\uB294 \uC2A4\uB9C8\uD2B8 \uAC74\uC124 \uAE30\uC220\uC744 \uD65C\uC6A9\uD574 \uACF5\uC815 \uCD5C\uC801\uD654\uC640 \uC6D0\uAC00 \uC808\uAC10\uC744 \uB3D9\uC2DC\uC5D0 \uC2E4\uD604\uD558\uB294 \uC5D4\uC9C0\uB2C8\uC5B4\uB85C \uAE30\uC5EC\uD558\uACA0\uC2B5\uB2C8\uB2E4.`
          },
          { role: "user", content: prompt }
        ]
      });
      const sanitize = (text2) => text2.replace(/[\u3040-\u309F]+/g, "").replace(/[\u30A0-\u30FF]+/g, "").replace(/[\u4E00-\u9FFF]+/g, "").replace(/[ \t]{2,}/g, " ").replace(/\n[ \t]+/g, "\n").trim();
      const fullText = sanitize(result.choices[0].message.content || "");
      const parts = fullText.split("---OPTION_BOUNDARY---");
      return {
        draft: parts[0]?.trim() || "\uCD08\uC548 \uC0DD\uC131 \uC2E4\uD328",
        draft2: (parts[1] || parts[0])?.trim() || ""
      };
    }),
    refineForCompany: protectedProcedure.input(z2.object({
      masterContent: z2.string(),
      company: z2.string().optional().default("\uAC74\uC124\uC0AC"),
      position: z2.string().optional().default("\uC2DC\uACF5/\uC124\uACC4"),
      companyDescription: z2.string().optional().default(""),
      companyKeywords: z2.string().optional().default("")
    })).mutation(async ({ input }) => {
      const companyContext = input.companyDescription || input.companyKeywords ? `
[\uC9C0\uC6D0 \uAE30\uC5C5 \uCC38\uACE0 \uC815\uBCF4 - \uC9C1\uC811 \uC778\uC6A9 \uAE08\uC9C0, \uBC30\uACBD \uC774\uD574\uC6A9\uC73C\uB85C\uB9CC \uD65C\uC6A9]
- \uAE30\uC5C5 \uD2B9\uC131: ${input.companyDescription}
- \uC778\uC7AC\uC0C1/\uD575\uC2EC \uAC00\uCE58: ${input.companyKeywords}` : "";
      const prompt = `[\uB9C8\uC2A4\uD130 \uC790\uC18C\uC11C \uCD08\uC548]
${input.masterContent}

[\uC9C0\uC6D0 \uAE30\uC5C5/\uC9C1\uBB34]
- \uAE30\uC5C5: ${input.company}
- \uC9C1\uBB34: ${input.position}
${companyContext}

[\uC791\uC131 \uC9C0\uCE68]
\uC704 \uB9C8\uC2A4\uD130 \uCD08\uC548\uC744 \uAE30\uBC18\uC73C\uB85C, ${input.company} ${input.position} \uC9C1\uBB34\uC5D0 \uCD5C\uC801\uD654\uB41C \uB9DE\uCDA4\uD615 \uC790\uAE30\uC18C\uAC1C\uC11C\uB97C \uC791\uC131\uD558\uB77C.
- \uC9C0\uC6D0\uC790\uC758 \uC2E4\uC81C \uACBD\uD5D8\uACFC \uD589\uB3D9\uC740 \uADF8\uB300\uB85C \uC720\uC9C0\uD558\uB418, \uC774 \uAE30\uC5C5/\uC9C1\uBB34\uC5D0\uC11C \uB354 \uAC15\uC870\uB418\uC5B4\uC57C \uD560 \uC5ED\uB7C9\uC744 \uBD80\uAC01\uD558\uB77C.
- \uAE30\uC5C5 \uC18C\uAC1C \uBB38\uAD6C\uB098 \uC2AC\uB85C\uAC74\uC744 \uADF8\uB300\uB85C \uC62E\uACA8 \uC4F0\uC9C0 \uB9D0\uACE0, \uC9C0\uC6D0\uC790\uC758 \uD589\uB3D9\uC73C\uB85C \uAC04\uC811 \uC99D\uBA85\uD558\uB77C.
- 500\uC790 \uB0B4\uC678\uB85C \uC644\uC131\uD558\uB77C.

[\uCD9C\uB825 \uD615\uC2DD]
[\uC18C\uC81C\uBAA9]
(\uBCF8\uBB38)`;
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\uB2F9\uC2E0\uC740 \uB300\uD55C\uBBFC\uAD6D 1\uAD70 \uAC74\uC124\uC0AC(\uD604\uB300\uAC74\uC124, \uC0BC\uC131\uBB3C\uC0B0, GS\uAC74\uC124 \uB4F1)\uC5D0\uC11C 15\uB144\uAC04 \uCC44\uC6A9\uC744 \uCD1D\uAD04\uD55C \uCEE4\uB9AC\uC5B4 \uCF54\uCE58\uB2E4.

[\uC5B8\uC5B4 \uADDC\uCE59 - \uC808\uB300 \uC900\uC218]
- \uCD9C\uB825\uC740 \uBC18\uB4DC\uC2DC 100% \uC21C\uD55C\uAD6D\uC5B4\uB85C \uC791\uC131\uD55C\uB2E4. \uD55C\uC790, \uC77C\uBCF8\uC5B4, \uC77C\uBC18 \uC601\uC5B4 \uB2E8\uC5B4 \uD63C\uC6A9 \uAE08\uC9C0.
- \uAC74\uC124\xB7\uC5D4\uC9C0\uB2C8\uC5B4\uB9C1 \uC804\uBB38 \uC57D\uC5B4(TBM, CPM, BIM, Con-Tech)\uB9CC \uC608\uC678\uC801\uC73C\uB85C \uC601\uBB38 \uD5C8\uC6A9.

[\uC791\uC131 \uC6D0\uCE59]
- "\uC5F4\uC815", "\uCD5C\uC120", "\uB178\uB825", "\uC131\uC2E4" \uAC19\uC740 \uC9C4\uBD80\uD55C \uCD94\uC0C1\uC5B4 \uC0AC\uC6A9 \uAE08\uC9C0.
- \uC9C0\uC6D0\uC790\uC758 \uC2E4\uC81C \uD589\uB3D9\uACFC \uC218\uCE58\uB85C \uC5ED\uB7C9\uC744 \uC99D\uBA85\uD55C\uB2E4.`
          },
          { role: "user", content: prompt }
        ]
      });
      const sanitize = (text2) => text2.replace(/[\u3040-\u309F]+/g, "").replace(/[\u30A0-\u30FF]+/g, "").replace(/[\u4E00-\u9FFF]+/g, "").replace(/[ \t]{2,}/g, " ").replace(/\n[ \t]+/g, "\n").trim();
      const refined = sanitize(result.choices[0].message.content || "");
      return { refined: refined || "\uCD08\uC548 \uC218\uC815 \uC2E4\uD328" };
    })
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
    search: publicProcedure.input(z2.object({ query: z2.string() })).query(({ input }) => searchCompanies(input.query)),
    coverLetters: protectedProcedure.input(z2.object({ companyName: z2.string() })).query(({ ctx, input }) => getCoverLettersByCompany(ctx.user.id, input.companyName)),
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
    console.warn("[Auth] authenticateRequest failed:", String(error));
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
  app.use("/", apiRouter);
  app.get("/health", (req, res) => res.send("OK"));
  app.get("/api/health", (req, res) => res.send("OK"));
  return app;
}

// server/vercel.ts
var cachedApp = null;
async function vercel_default(req, res) {
  if (!cachedApp) {
    console.log("[Vercel] Initializing Express app...");
    cachedApp = await createExpressApp();
  }
  return cachedApp(req, res);
}
export {
  vercel_default as default
};
