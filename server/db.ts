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
        connect_timeout: 10, // 30초에서 10초로 단축 (빠른 실패 후 재시도 유도)
        max: isProduction ? 10 : 5, // 동시 쿼리 처리를 위해 풀 크기 확장
        idle_timeout: 20,
        max_lifetime: 60 * 5, // 서버리스 환경을 고려해 5분으로 조정
        ssl: isProduction ? { rejectUnauthorized: false } : false, // Vercel/Supabase 연결 안정성 강화
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
  const now = Date.now();
  await runQuery(async (db) => {
    // openId 기준 upsert: 재로그인 시 openId 충돌이 먼저 발생해도 안전하게 처리
    // email 충돌(기존 이메일 회원이 OAuth 로그인) 시에도 openId를 업데이트
    const values = {
      ...user,
      createdAt: user.createdAt ?? now,
      updatedAt: user.updatedAt ?? now,
      lastSignedIn: user.lastSignedIn ?? now,
    };

    // Step 1: openId 기준 upsert (재로그인 처리)
    await db.insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          loginMethod: user.loginMethod,
          name: user.name,
          lastSignedIn: user.lastSignedIn ?? now,
          updatedAt: now,
        },
      });
  }).catch(async (err) => {
    // DrizzleQueryError가 postgres 에러를 err.cause로 감싸므로 양쪽 모두 확인
    const pgCode = err?.code ?? err?.cause?.code;
    // email unique 충돌(23505): 기존 이메일 회원이 Google OAuth로 처음 연결하는 경우
    // 해당 이메일 레코드의 openId를 Google openId로 업데이트해서 계정을 연결한다
    if (pgCode === "23505" && user.email) {
      await runQuery(async (db) => {
        await db.update(users)
          .set({
            openId: user.openId!,
            loginMethod: user.loginMethod,
            name: user.name,
            lastSignedIn: user.lastSignedIn ?? now,
            updatedAt: now,
          })
          .where(eq(users.email, user.email!));
      });
    } else {
      throw err;
    }
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
    const [updated] = await db.update(coverLetters)
      .set(data)
      .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)))
      .returning();
    return updated;
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

export async function getCoverLettersByCompany(userId: number, companyName: string) {
  return runQuery(async (db) =>
    db.select({
      id: coverLetters.id,
      title: coverLetters.title,
      position: coverLetters.position,
      status: coverLetters.status,
      updatedAt: coverLetters.updatedAt,
    })
    .from(coverLetters)
    .where(and(eq(coverLetters.userId, userId), eq(coverLetters.company, companyName), eq(coverLetters.isMaster, 0)))
    .orderBy(desc(coverLetters.updatedAt))
  );
}

export async function searchCompanies(query: string) {
  return runQuery(async (db) =>
    db.select({
      id: companies.id,
      name: companies.name,
      sector: companies.sector,
      rank: companies.rank,
      brand: companies.brand,
      description: companies.description,
      keywords: companies.keywords,
      thumbnail: companies.thumbnail,
    })
    .from(companies)
    .where(like(companies.name, `%${query}%`))
    .orderBy(asc(companies.rank))
    .limit(10)
  );
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
  return runQuery(async (db) => {
    let finalCompanyId = (data.companyId === undefined || data.companyId === null) ? null : data.companyId;

    // 1. 스마트 매칭: companyId가 없는 경우 제목에서 기업명 추출 시도
    if (finalCompanyId === null) {
      const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
      for (const company of allCompanies) {
        // 기업명에서 (주) 등 제거 후 매칭 확인
        const cleanName = company.name.replace(/\(.*\)/g, "").replace(/주식회사/g, "").trim();
        if (data.title.includes(cleanName)) {
          finalCompanyId = company.id;
          console.log(`[NewsScrap] Auto-matched news to company: ${company.name} (ID: ${company.id})`);
          break;
        }
      }
    }

    // 2. 중복 체크 및 업데이트 (기존에 null이었는데 기업명이 확인된 경우 업데이트)
    const existing = await db.select().from(newsScraps)
      .where(and(eq(newsScraps.userId, userId), eq(newsScraps.link, data.link)))
      .limit(1);
    
    if (existing.length > 0) {
      // 기존에 기업 정보가 없었는데 이번에 확인되었다면 업데이트
      if (existing[0].companyId === null && finalCompanyId !== null) {
        const [updated] = await db.update(newsScraps)
          .set({ companyId: finalCompanyId })
          .where(eq(newsScraps.id, existing[0].id))
          .returning();
        return updated;
      }
      return existing[0];
    }

    // 3. 신규 삽입
    const scrapData = { 
      userId, 
      title: data.title || "제목 없음", 
      link: data.link, 
      source: data.source || "출처 미상", 
      pubDate: data.pubDate || "", 
      companyId: finalCompanyId, 
      createdAt: now 
    };

    const [inserted] = await db.insert(newsScraps).values(scrapData).returning();
    return inserted;
  });
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
