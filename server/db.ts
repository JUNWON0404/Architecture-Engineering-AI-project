/// <reference types="bcryptjs" />
import "dotenv/config";
import { and, desc, eq, sql, like, asc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  InsertUser,
  checklistItems,
  companies,
  companyBookmarks,
  coverLetters,
  interviewQuestions,
  jobPostings,
  newsScraps,
  companyNotes,
  resumes,
  schedules,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: any = null;

/**
 * 데이터베이스 연결 객체(Drizzle)를 반환합니다.
 * 연결 오류 발생 시 싱글턴을 초기화해 재연결을 허용합니다.
 */
export async function getDb() {
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
        connect_timeout: 30,
        max: 1,
        idle_timeout: 30,
        max_lifetime: 60 * 10, // 10분 후 강제 재연결 (서버리스 stale 방지)
        ssl: isProduction ? "require" : false,
        onnotice: () => {},
      });
      _db = drizzle(_client);
      console.log("[Database] Connection established.");
    } catch (error: any) {
      _client = null;
      _db = null;
      console.error("[Database] Connection failed!", error);
      throw error;
    }
  }
  return _db;
}

export function resetDbConnection() {
  _client = null;
  _db = null;
}

/**
 * DB 쿼리 실행용 공통 헬퍼.
 * 연결 오류 발생 시 싱글턴을 초기화하고 한 번 재시도합니다.
 */
async function runQuery<T>(
  dbQuery: (db: NonNullable<ReturnType<typeof drizzle>>) => Promise<T>
): Promise<T> {
  const db = await getDb();
  try {
    return await dbQuery(db as any);
  } catch (error: any) {
    const isConnErr = error?.code === "CONNECTION_CLOSED" || error?.code === "CONNECTION_ENDED" || error?.message?.includes("connection");
    if (isConnErr) {
      console.warn("[Database] Connection error, resetting and retrying once...");
      resetDbConnection();
      const freshDb = await getDb();
      return await dbQuery(freshDb as any);
    }
    throw error;
  }
}

// ── User Management ──────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) return;
  const openId = user.openId as string;
  const now = Date.now();
  await runQuery(async (db) => {
    // 1. 재로그인(openId 일치): lastSignedIn만 갱신 후 종료
    const byOpenId = await db.update(users)
      .set({ lastSignedIn: user.lastSignedIn ?? now, updatedAt: now })
      .where(eq(users.openId, openId))
      .returning({ id: users.id });
    if (byOpenId.length > 0) return;

    // 2. 신규 or 이메일 계정과 연결: ON CONFLICT (email) DO UPDATE로 원자적 처리
    //    - 신규 사용자: INSERT 성공
    //    - 기존 이메일 계정: email 충돌 → openId를 연결하고 lastSignedIn 갱신
    await (db as any).insert(users)
      .values({ ...user, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          openId: user.openId,
          loginMethod: user.loginMethod ?? null,
          lastSignedIn: user.lastSignedIn ?? now,
          updatedAt: now,
        },
      });
  });
}

export async function getUserByOpenId(openId: string) {
  return runQuery(async (db) => {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0];
  });
}

export async function getUserByEmail(email: string) {
  return runQuery(async (db) => {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  });
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function createUserWithEmail(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password);
  const now = Date.now();
  return runQuery(async (db) => {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      // openId가 null인 깨진 레코드면 수정 후 반환
      if (!existing[0].openId) {
        await db.update(users)
          .set({ openId: `email:${email}`, password: hashedPassword, name: name || existing[0].name, updatedAt: now })
          .where(eq(users.email, email));
        const fixed = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return fixed[0];
      }
      throw new Error("이미 사용 중인 이메일입니다.");
    }
    await db.insert(users).values({
      openId: `email:${email}`,
      email,
      password: hashedPassword,
      name: name || null,
      loginMethod: "email",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user[0];
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.password) throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  if (!(await verifyPassword(password, user.password))) throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  return user;
}

// ── Cover Letters ──────────────────────────────────────────────
export async function getCoverLetters(userId: number) {
  return runQuery(async (db) => db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)));
}

export async function getCoverLettersBrief(userId: number) {
  return runQuery(async (db) => db.select({ id: coverLetters.id, title: coverLetters.title, company: coverLetters.company, position: coverLetters.position, status: coverLetters.status, isMaster: coverLetters.isMaster, updatedAt: coverLetters.updatedAt }).from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)));
}

export async function getMasterCoverLetter(userId: number) {
  return runQuery(async (db) => {
    const master = await db.select().from(coverLetters).where(and(eq(coverLetters.userId, userId), eq(coverLetters.isMaster, 1))).limit(1);
    if (master.length > 0) return master[0];
    const latest = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)).limit(1);
    return latest[0] || null;
  });
}

export async function setMasterCoverLetter(userId: number, id: number) {
  return runQuery(async (db) => {
    await db.update(coverLetters).set({ isMaster: 0 }).where(eq(coverLetters.userId, userId));
    await db.update(coverLetters).set({ isMaster: 1 }).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
    const result = await db.select().from(coverLetters).where(eq(coverLetters.id, id)).limit(1);
    return result[0];
  });
}

export async function cloneCoverLetter(masterId: number, userId: number, companyName: string) {
  const now = Date.now();
  return runQuery(async (db) => {
    const master = await db.select().from(coverLetters).where(and(eq(coverLetters.id, masterId), eq(coverLetters.userId, userId))).limit(1);
    if (master.length === 0) throw new Error("마스터 자소서를 찾을 수 없습니다.");
    const { id: _, createdAt: __, updatedAt: ___, isMaster: ____, ...masterData } = master[0];
    const newData = { ...masterData, title: `${companyName} 맞춤형 자소서`, company: companyName, isMaster: 0, parentId: masterId, status: "draft", createdAt: now, updatedAt: now };
    await db.insert(coverLetters).values(newData as any);
    const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
    return result[0];
  });
}

export async function getCoverLetterById(id: number, userId: number) {
  return runQuery(async (db) => {
    const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
    return result[0];
  });
}

export async function createCoverLetter(data: typeof coverLetters.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(coverLetters).values(data);
    const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, data.userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateCoverLetter(id: number, userId: number, data: Partial<typeof coverLetters.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(coverLetters).set(data).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
    const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteCoverLetter(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))); });
}

// ── Resumes ────────────────────────────────────────────────────
export async function getResumes(userId: number) {
  return runQuery(async (db) => db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt)));
}

export async function getResumeById(id: number, userId: number) {
  return runQuery(async (db) => {
    const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
    return result[0];
  });
}

export async function createResume(data: typeof resumes.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(resumes).values(data);
    const result = await db.select().from(resumes).where(eq(resumes.userId, data.userId)).orderBy(desc(resumes.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateResume(id: number, userId: number, data: Partial<typeof resumes.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
    const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteResume(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))); });
}

// ── Interview Questions ────────────────────────────────────────
export async function getInterviewQuestions(userId: number) {
  return runQuery(async (db) => db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(desc(interviewQuestions.updatedAt)));
}

export async function getInterviewQuestionById(id: number, userId: number) {
  return runQuery(async (db) => {
    const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
    return result[0];
  });
}

export async function createInterviewQuestion(data: typeof interviewQuestions.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(interviewQuestions).values(data);
    const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, data.userId)).orderBy(desc(interviewQuestions.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateInterviewQuestion(id: number, userId: number, data: Partial<typeof interviewQuestions.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(interviewQuestions).set(data).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
    const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteInterviewQuestion(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))); });
}

// ── Schedules ──────────────────────────────────────────────────
export async function getSchedules(userId: number) {
  return runQuery(async (db) => db.select().from(schedules).where(eq(schedules.userId, userId)).orderBy(desc(schedules.scheduledAt)));
}

export async function createSchedule(data: typeof schedules.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(schedules).values(data);
    const result = await db.select().from(schedules).where(eq(schedules.userId, data.userId)).orderBy(desc(schedules.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateSchedule(id: number, userId: number, data: Partial<typeof schedules.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(schedules).set(data).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
    const result = await db.select().from(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteSchedule(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId))); });
}

// ── Company Bookmarks ──────────────────────────────────────────
export async function getCompanyBookmarks(userId: number) {
  return runQuery(async (db) => db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, userId)).orderBy(desc(companyBookmarks.updatedAt)));
}

export async function createCompanyBookmark(data: typeof companyBookmarks.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(companyBookmarks).values(data);
    const result = await db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, data.userId)).orderBy(desc(companyBookmarks.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateCompanyBookmark(id: number, userId: number, data: Partial<typeof companyBookmarks.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(companyBookmarks).set(data).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
    const result = await db.select().from(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteCompanyBookmark(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId))); });
}

// ── Checklist ──────────────────────────────────────────────────
export async function getChecklistItems(userId: number) {
  return runQuery(async (db) => db.select().from(checklistItems).where(eq(checklistItems.userId, userId)).orderBy(checklistItems.order));
}

export async function createChecklistItem(data: typeof checklistItems.$inferInsert) {
  return runQuery(async (db) => {
    await db.insert(checklistItems).values(data);
    const result = await db.select().from(checklistItems).where(eq(checklistItems.userId, data.userId)).orderBy(desc(checklistItems.createdAt)).limit(1);
    return result[0];
  });
}

export async function updateChecklistItem(id: number, userId: number, data: Partial<typeof checklistItems.$inferInsert>) {
  return runQuery(async (db) => {
    await db.update(checklistItems).set(data).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
    const result = await db.select().from(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId))).limit(1);
    return result[0];
  });
}

export async function deleteChecklistItem(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId))); });
}

// ── Companies & Job Postings ───────────────────────────────────
export async function getAllCompanies(options?: { location?: string; sortBy?: "rank" | "name" | "recent" }) {
  return runQuery(async (db) => {
    let query = db.select({ id: companies.id, name: companies.name, sector: companies.sector, rank: companies.rank, brand: companies.brand, hiringSeason: companies.hiringSeason, salaryGuide: companies.salaryGuide, keywords: companies.keywords, description: companies.description, revenue: companies.revenue, location: companies.location, employees: companies.employees, established: companies.established, website: companies.website, thumbnail: companies.thumbnail, createdAt: companies.createdAt, updatedAt: companies.updatedAt, jobPostingsCount: sql<number>`count(${jobPostings.id})`.mapWith(Number) }).from(companies).leftJoin(jobPostings, and(eq(jobPostings.companyId, companies.id), eq(jobPostings.isActive, 1))).groupBy(companies.id);
    if (options?.location && options.location !== "all") { query = query.where(like(companies.location, `%${options.location}%`)) as any; }
    switch (options?.sortBy) {
      case "rank": query = query.orderBy(asc(companies.rank)) as any; break;
      case "name": query = query.orderBy(asc(companies.name)) as any; break;
      case "recent": default: query = query.orderBy(desc(companies.updatedAt)) as any; break;
    }
    return await query;
  });
}

export async function getCompanyById(id: number) {
  return runQuery(async (db) => { const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1); return result[0] || null; });
}

export async function getJobPostingsByCompanyId(companyId: number) {
  return runQuery(async (db) => db.select().from(jobPostings).where(eq(jobPostings.companyId, companyId)).orderBy(desc(jobPostings.postedAt)));
}

export async function createCompany(data: typeof companies.$inferInsert) {
  return runQuery(async (db) => { await db.insert(companies).values(data); const result = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(1); return result[0]; });
}

export async function createJobPosting(data: typeof jobPostings.$inferInsert) {
  return runQuery(async (db) => { await db.insert(jobPostings).values(data); const result = await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt)).limit(1); return result[0]; });
}

export async function updateUserProfile(userId: number, data: any) {
  return runQuery(async (db) => { await db.update(users).set(data).where(eq(users.id, userId)); const result = await db.select().from(users).where(eq(users.id, userId)).limit(1); return result[0]; });
}

// ── News Scraps ──────────────────────────────────────────────
export async function insertNewsScrap(userId: number, data: { title: string; link: string; source: string; pubDate: string; companyId?: number | null }) {
  const now = Date.now();
  const scrapData = { userId, title: data.title, link: data.link, source: data.source, pubDate: data.pubDate, companyId: data.companyId ?? null, createdAt: now };
  return runQuery(async (db) => { const result = await db.insert(newsScraps).values(scrapData).returning(); return result[0]; });
}

export async function getNewsScraps(userId: number, companyId?: number | null) {
  return runQuery(async (db) => {
    const conditions = [eq(newsScraps.userId, userId)];
    if (companyId !== undefined) { conditions.push(companyId === null ? isNull(newsScraps.companyId) : eq(newsScraps.companyId, companyId)); }
    return db.select().from(newsScraps).where(and(...conditions)).orderBy(desc(newsScraps.createdAt));
  });
}

export async function deleteNewsScrap(id: number, userId: number) {
  return runQuery(async (db) => { await db.delete(newsScraps).where(and(eq(newsScraps.id, id), eq(newsScraps.userId, userId))); });
}

// ── Company Notes ──────────────────────────────────────────────
export async function getCompanyNote(userId: number, companyId: number) {
  return runQuery(async (db) => { const result = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1); return result[0] || null; });
}

export async function upsertCompanyNote(userId: number, companyId: number, content: string) {
  const now = Date.now();
  return runQuery(async (db) => {
    const existing = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1);
    if (existing.length > 0) { const [updated] = await db.update(companyNotes).set({ content, updatedAt: now }).where(eq(companyNotes.id, existing[0].id)).returning(); return updated; }
    else { const [inserted] = await db.insert(companyNotes).values({ userId, companyId, content, updatedAt: now }).returning(); return inserted; }
  });
}

// ── Dashboard Summary ──────────────────────────────────────────
export async function getDashboardSummary(userId: number) {
  return runQuery(async (db) => {
    const now = Date.now();
    const [cvCount, resumeCount, bookmarkCount, upcomingSchedules, checklistData] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(coverLetters).where(eq(coverLetters.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(resumes).where(eq(resumes.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(companyBookmarks).where(eq(companyBookmarks.userId, userId)),
      db.select().from(schedules).where(and(eq(schedules.userId, userId), sql`${schedules.scheduledAt} > ${now}`, eq(schedules.isCompleted, 0))).orderBy(asc(schedules.scheduledAt)).limit(3),
      db.select().from(checklistItems).where(eq(checklistItems.userId, userId))
    ]);
    const total = checklistData.length;
    const completed = checklistData.filter(i => i.isCompleted).length;
    return {
      counts: { coverLetters: Number(cvCount[0].count), resumes: Number(resumeCount[0].count), bookmarks: Number(bookmarkCount[0].count) },
      lastUpdatedMaster: checklistData.length > 0 ? Math.max(...checklistData.map(i => i.updatedAt)) : Date.now(),
      upcomingSchedules,
      checklist: { progress: total > 0 ? Math.round((completed / total) * 100) : 0, items: checklistData.filter(i => !i.isCompleted).slice(0, 3) }
    };
  });
}
