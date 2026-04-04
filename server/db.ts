import { and, desc, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcrypt";
import path from "path";
import {
  InsertUser,
  checklistItems,
  companies,
  companyBookmarks,
  coverLetters,
  interviewQuestions,
  jobPostings,
  resumes,
  schedules,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // SQLite 파일 경로: file:./db.sqlite 또는 file:C:/path/to/db.sqlite
      const dbPath = process.env.DATABASE_URL.replace("file:", "");
      console.log("[Database] Connecting to:", dbPath);
      const sqlite = new Database(dbPath);
      _db = drizzle(sqlite);
      
      // 마이그레이션 실행
      console.log("[Database] Running migrations...");
      const migrationsFolder = path.join(process.cwd(), "drizzle", "migrations");
      console.log("[Database] Migrations folder:", migrationsFolder);
      migrate(_db, { migrationsFolder });
      console.log("[Database] Migrations completed successfully");
    } catch (error) {
      console.error("[Database] Connection error:", error instanceof Error ? error.message : error);
      console.error("[Database] Full error:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  // SQLite: dates are stored as timestamps (milliseconds)
  if (!values.lastSignedIn) values.lastSignedIn = Date.now();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = Date.now();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 이메일로 사용자 조회
 * @param email - 조회할 이메일 주소
 * @returns 사용자 정보 또는 undefined
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 비밀번호를 해시합니다
 * bcrypt 라이브러리 사용으로 안전하게 저장
 * @param plainPassword - 평문 비밀번호
 * @returns 해시된 비밀번호
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10; // 해싱 강도 (높을수록 느리지만 안전)
  return bcrypt.hash(plainPassword, saltRounds);
}

/**
 * 비밀번호를 검증합니다
 * @param plainPassword - 사용자가 입력한 평문 비밀번호
 * @param hashedPassword - DB에 저장된 해시된 비밀번호
 * @returns 비밀번호가 일치하면 true, 아니면 false
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * 이메일과 비밀번호로 새 사용자를 생성합니다 (회원가입)
 * @param email - 로그인에 사용할 이메일
 * @param password - 로그인에 사용할 비밀번호
 * @param name - 사용자 이름
 * @returns 생성된 사용자 정보
 */
export async function createUserWithEmail(email: string, password: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // 이미 존재하는 이메일인지 확인
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("이미 가입된 이메일입니다");
  }

  // 비밀번호 해시
  const hashedPassword = await hashPassword(password);

  // 사용자 생성 (timestamps are stored as milliseconds for SQLite)
  await db.insert(users).values({
    email,
    password: hashedPassword,
    name: name || null,
    loginMethod: "email", // 로그인 방식: 이메일/비밀번호
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastSignedIn: Date.now(),
  });

  // 생성된 사용자 정보 반환
  return getUserByEmail(email);
}

/**
 * 이메일과 비밀번호로 사용자 로그인
 * @param email - 사용자 이메일
 * @param password - 사용자 비밀번호
 * @returns 로그인 성공 시 사용자 정보, 실패 시 throw
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  
  // 사용자가 없거나 비밀번호가 없으면 실패
  if (!user || !user.password) {
    throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  }

  // 비밀번호 검증
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  }

  // 마지막 로그인 시간 업데이트
  const db = await getDb();
  if (db) {
    await db
      .update(users)
      .set({ lastSignedIn: Date.now(), updatedAt: Date.now() })
      .where(eq(users.id, user.id));
  }

  return user;
}

// ── Cover Letters ──────────────────────────────────────────────
export async function getCoverLetters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt));
}

export async function getCoverLetterById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
  return result[0];
}

export async function createCoverLetter(data: typeof coverLetters.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(coverLetters).values(data);
  const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, data.userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
  return result[0];
}

export async function updateCoverLetter(id: number, userId: number, data: Partial<typeof coverLetters.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(coverLetters).set(data).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
  const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
  return result[0];
}

export async function deleteCoverLetter(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
}

// ── Interview Questions ────────────────────────────────────────
export async function getInterviewQuestions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(desc(interviewQuestions.updatedAt));
}

export async function getInterviewQuestionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
  return result[0];
}

export async function createInterviewQuestion(data: typeof interviewQuestions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(interviewQuestions).values(data);
  const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, data.userId)).orderBy(desc(interviewQuestions.createdAt)).limit(1);
  return result[0];
}

export async function updateInterviewQuestion(id: number, userId: number, data: Partial<typeof interviewQuestions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(interviewQuestions).set(data).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
  const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
  return result[0];
}

export async function deleteInterviewQuestion(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
}

// ── Resumes ────────────────────────────────────────────────────
export async function getResumes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt));
}

export async function getResumeById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
  return result[0];
}

export async function createResume(data: typeof resumes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(resumes).values(data);
  const result = await db.select().from(resumes).where(eq(resumes.userId, data.userId)).orderBy(desc(resumes.createdAt)).limit(1);
  return result[0];
}

export async function updateResume(id: number, userId: number, data: Partial<typeof resumes.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
  return result[0];
}

export async function deleteResume(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
}

// ── Schedules ──────────────────────────────────────────────────
export async function getSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules).where(eq(schedules.userId, userId)).orderBy(schedules.scheduledAt);
}

export async function createSchedule(data: typeof schedules.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(schedules).values(data);
  const result = await db.select().from(schedules).where(eq(schedules.userId, data.userId)).orderBy(desc(schedules.createdAt)).limit(1);
  return result[0];
}

export async function updateSchedule(id: number, userId: number, data: Partial<typeof schedules.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(schedules).set(data).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
  const result = await db.select().from(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId))).limit(1);
  return result[0];
}

export async function deleteSchedule(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
}

// ── Company Bookmarks ──────────────────────────────────────────
export async function getCompanyBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, userId)).orderBy(desc(companyBookmarks.updatedAt));
}

export async function createCompanyBookmark(data: typeof companyBookmarks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(companyBookmarks).values(data);
  const result = await db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, data.userId)).orderBy(desc(companyBookmarks.createdAt)).limit(1);
  return result[0];
}

export async function updateCompanyBookmark(id: number, userId: number, data: Partial<typeof companyBookmarks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(companyBookmarks).set(data).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
  const result = await db.select().from(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId))).limit(1);
  return result[0];
}

export async function deleteCompanyBookmark(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
}

// ── Checklist ──────────────────────────────────────────────────
export async function getChecklistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(eq(checklistItems.userId, userId)).orderBy(checklistItems.order, desc(checklistItems.createdAt));
}

export async function createChecklistItem(data: typeof checklistItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(checklistItems).values(data);
  const result = await db.select().from(checklistItems).where(eq(checklistItems.userId, data.userId)).orderBy(desc(checklistItems.createdAt)).limit(1);
  return result[0];
}

export async function updateChecklistItem(id: number, userId: number, data: Partial<typeof checklistItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(checklistItems).set(data).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
  const result = await db.select().from(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId))).limit(1);
  return result[0];
}

export async function deleteChecklistItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
}

// ── User Profile ───────────────────────────────────────────────
export async function updateUserProfile(userId: number, data: { bio?: string; targetJob?: string; targetCompany?: string; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set(data).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

// ── Companies ──────────────────────────────────────────────────
export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  
  const companiesList = await db.select().from(companies).orderBy(desc(companies.updatedAt));
  
  // 각 회사별 채용공고 개수 추가
  const result = await Promise.all(companiesList.map(async (company) => {
    const jobs = await db.select().from(jobPostings).where(eq(jobPostings.companyId, company.id));
    return {
      ...company,
      jobPostingsCount: jobs.filter(j => j.isActive === 1).length,
    };
  }));
  
  return result;
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0] || null;
}

export async function getJobPostingsByCompanyId(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobPostings).where(eq(jobPostings.companyId, companyId)).orderBy(desc(jobPostings.postedAt));
}

export async function createCompany(data: typeof companies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(companies).values(data);
  const result = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(1);
  return result[0];
}

export async function createJobPosting(data: typeof jobPostings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(jobPostings).values(data);
  const result = await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt)).limit(1);
  return result[0];
}

