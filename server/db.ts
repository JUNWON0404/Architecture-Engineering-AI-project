import "dotenv/config";
import { and, desc, eq, sql, like, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcrypt";
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
let _connectionFailed = false;

/**
 * 데이터베이스 연결 객체(Drizzle)를 반환합니다.
 */
export async function getDb() {
  if (_connectionFailed) return null;
  if (!process.env.DATABASE_URL) {
    console.warn("[Database] ⚠️ DATABASE_URL is missing in .env");
    _connectionFailed = true;
    return null;
  }

  if (!_db) {
    try {
      console.log("[Database] ⏳ Connecting to Database...");
      const client = postgres(process.env.DATABASE_URL, { 
        prepare: false,
        connect_timeout: 10,
      });
      _db = drizzle(client);
      
      // 실제 연결 확인
      await client`SELECT 1`;
      console.log("[Database] ✅ SUCCESS: Database connected!");
    } catch (error: any) {
      console.error("[Database] ❌ FAILURE: Connection failed!");
      _connectionFailed = true; 
      _db = null;
    }
  }
  return _db;
}

// ── File-based Mock Store ─────────────────────────────────────
const MOCK_DB_PATH = path.join(process.cwd(), "mock_db.json");

function getMockStore() {
  const initialStore = {
    coverLetters: [],
    resumes: [],
    interviewQuestions: [],
    schedules: [],
    bookmarks: [],
    checklist: [],
    users: [],
    newsScraps: [],
    companyNotes: [],
  };
  if (!fs.existsSync(MOCK_DB_PATH)) return initialStore;
  try {
    return JSON.parse(fs.readFileSync(MOCK_DB_PATH, "utf-8"));
  } catch (error) {
    return initialStore;
  }
}

function saveMockStore(store: any) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(store, null, 2));
}

/**
 * DB 쿼리 실행 및 실패 시 Mock Store로의 전환을 담당하는 공통 헬퍼 함수
 */
async function runQuery<T>(
  dbQuery: (db: NonNullable<ReturnType<typeof drizzle>>) => Promise<T>,
  mockFallback: (store: any) => T
): Promise<T> {
  try {
    const db = await getDb();
    if (db) {
      return await dbQuery(db as any);
    }
  } catch (error) {
    console.error("[Database] ⚠️ Query execution failed, falling back to Mock:", error);
  }
  return mockFallback(getMockStore());
}

// ── User Management ──────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) return;
  const openId = user.openId as string;
  
  await runQuery(
    async (db) => {
      const existingUser = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (existingUser.length > 0) {
        await db.update(users).set({ ...user, updatedAt: Date.now() }).where(eq(users.openId, openId));
      } else {
        await db.insert(users).values({ ...user, createdAt: Date.now(), updatedAt: Date.now() });
      }
    },
    (store) => {
      const index = store.users.findIndex((u: any) => u.openId === openId);
      if (index !== -1) {
        store.users[index] = { ...store.users[index], ...user, updatedAt: Date.now() };
      } else {
        store.users.push({ ...user, id: Math.floor(Math.random() * 10000), createdAt: Date.now(), updatedAt: Date.now() });
      }
      saveMockStore(store);
    }
  );
}

export async function getUserByOpenId(openId: string) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      return result[0];
    },
    (store) => store.users.find((u: any) => u.openId === openId)
  );
}

export async function getUserByEmail(email: string) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    },
    (store) => store.users.find((u: any) => u.email === email)
  );
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function createUserWithEmail(email: string, password: string, name?: string) {
  const existingUser = await getUserByEmail(email);
  if (existingUser) throw new Error("이미 가입된 이메일입니다");
  const hashedPassword = await hashPassword(password);
  const now = Date.now();
  const userData = { email, password: hashedPassword, name: name || null, loginMethod: "email", createdAt: now, updatedAt: now, lastSignedIn: now };

  return runQuery(
    async (db) => {
      await db.insert(users).values(userData as any);
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return user[0];
    },
    (store) => {
      const newUser = { 
        ...userData, 
        id: Math.floor(Math.random() * 10000),
        openId: null,
        role: "user",
        bio: null,
        targetJob: null,
        targetCompany: null,
      };
      store.users.push(newUser);
      saveMockStore(store);
      return newUser;
    }
  );
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.password) throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  if (!(await verifyPassword(password, user.password))) throw new Error("이메일 또는 비밀번호가 정확하지 않습니다");
  return user;
}

// ── Cover Letters ──────────────────────────────────────────────
export async function getCoverLetters(userId: number) {
  return runQuery(
    async (db) => db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)),
    (store) => store.coverLetters.filter((i: any) => i.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
  );
}

export async function getCoverLettersBrief(userId: number) {
  return runQuery(
    async (db) => db.select({
      id: coverLetters.id,
      title: coverLetters.title,
      company: coverLetters.company,
      position: coverLetters.position,
      status: coverLetters.status,
      isMaster: coverLetters.isMaster,
      updatedAt: coverLetters.updatedAt,
    }).from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)),
    (store) => store.coverLetters
      .filter((i: any) => i.userId === userId)
      .map(({ content, experience, keyStory, ...rest }: any) => rest)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
  );
}

export async function getMasterCoverLetter(userId: number) {
  return runQuery(
    async (db) => {
      // 1. explicit master 찾기
      const master = await db.select().from(coverLetters).where(and(eq(coverLetters.userId, userId), eq(coverLetters.isMaster, 1))).limit(1);
      if (master.length > 0) return master[0];
      
      // 2. 없으면 가장 최근 것 반환
      const latest = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.updatedAt)).limit(1);
      return latest[0] || null;
    },
    (store) => {
      const masters = store.coverLetters.filter((i: any) => i.userId === userId && i.isMaster === 1);
      if (masters.length > 0) return masters[0];
      return store.coverLetters.filter((i: any) => i.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0] || null;
    }
  );
}

export async function setMasterCoverLetter(userId: number, id: number) {
  return runQuery(
    async (db) => {
      // 기존 마스터들 해제
      await db.update(coverLetters).set({ isMaster: 0 }).where(eq(coverLetters.userId, userId));
      // 새 마스터 설정
      await db.update(coverLetters).set({ isMaster: 1 }).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
      const result = await db.select().from(coverLetters).where(eq(coverLetters.id, id)).limit(1);
      return result[0];
    },
    (store) => {
      store.coverLetters.forEach((i: any) => { if (i.userId === userId) i.isMaster = 0; });
      const target = store.coverLetters.find((i: any) => i.id === id && i.userId === userId);
      if (target) {
        target.isMaster = 1;
        saveMockStore(store);
        return target;
      }
    }
  );
}

export async function cloneCoverLetter(masterId: number, userId: number, companyName: string) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      const master = await db.select().from(coverLetters).where(and(eq(coverLetters.id, masterId), eq(coverLetters.userId, userId))).limit(1);
      if (master.length === 0) throw new Error("마스터 자소서를 찾을 수 없습니다.");
      
      const { id: _, createdAt: __, updatedAt: ___, isMaster: ____, ...masterData } = master[0];
      
      const newData = {
        ...masterData,
        title: `${companyName} 맞춤형 자소서`,
        company: companyName,
        isMaster: 0,
        parentId: masterId,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      
      await db.insert(coverLetters).values(newData as any);
      const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const master = store.coverLetters.find((i: any) => i.id === masterId && i.userId === userId);
      if (!master) throw new Error("마스터 자소서를 찾을 수 없습니다.");
      
      const { id: _, createdAt: __, updatedAt: ___, isMaster: ____, ...masterData } = master;
      const newItem = {
        ...masterData,
        id: Math.floor(Math.random() * 10000),
        title: `${companyName} 맞춤형 자소서`,
        company: companyName,
        isMaster: 0,
        parentId: masterId,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      store.coverLetters.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function getCoverLetterById(id: number, userId: number) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
      return result[0];
    },
    (store) => store.coverLetters.find((i: any) => i.id === id && i.userId === userId)
  );
}

export async function createCoverLetter(data: typeof coverLetters.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(coverLetters).values(data);
      const result = await db.select().from(coverLetters).where(eq(coverLetters.userId, data.userId)).orderBy(desc(coverLetters.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { ...data, id: Math.floor(Math.random() * 10000), createdAt: now, updatedAt: now };
      store.coverLetters.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateCoverLetter(id: number, userId: number, data: Partial<typeof coverLetters.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(coverLetters).set(data).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
      const result = await db.select().from(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.coverLetters.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.coverLetters[index] = { ...store.coverLetters[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.coverLetters[index];
      }
    }
  );
}

export async function deleteCoverLetter(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(coverLetters).where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
    },
    (store) => {
      const index = store.coverLetters.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.coverLetters.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Resumes ────────────────────────────────────────────────────
export async function getResumes(userId: number) {
  return runQuery(
    async (db) => db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt)),
    (store) => store.resumes.filter((i: any) => i.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
  );
}

export async function getResumeById(id: number, userId: number) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
      return result[0];
    },
    (store) => store.resumes.find((i: any) => i.id === id && i.userId === userId)
  );
}

export async function createResume(data: typeof resumes.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(resumes).values(data);
      const result = await db.select().from(resumes).where(eq(resumes.userId, data.userId)).orderBy(desc(resumes.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { ...data, id: Math.floor(Math.random() * 10000), createdAt: now, updatedAt: now };
      store.resumes.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateResume(id: number, userId: number, data: Partial<typeof resumes.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(resumes).set(data).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
      const result = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.resumes.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.resumes[index] = { ...store.resumes[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.resumes[index];
      }
    }
  );
}

export async function deleteResume(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
    },
    (store) => {
      const index = store.resumes.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.resumes.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Interview Questions ────────────────────────────────────────
export async function getInterviewQuestions(userId: number) {
  return runQuery(
    async (db) => db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, userId)).orderBy(desc(interviewQuestions.updatedAt)),
    (store) => store.interviewQuestions.filter((i: any) => i.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
  );
}

export async function getInterviewQuestionById(id: number, userId: number) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
      return result[0];
    },
    (store) => store.interviewQuestions.find((i: any) => i.id === id && i.userId === userId)
  );
}

export async function createInterviewQuestion(data: typeof interviewQuestions.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(interviewQuestions).values(data);
      const result = await db.select().from(interviewQuestions).where(eq(interviewQuestions.userId, data.userId)).orderBy(desc(interviewQuestions.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { ...data, id: Math.floor(Math.random() * 10000), createdAt: now, updatedAt: now };
      store.interviewQuestions.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateInterviewQuestion(id: number, userId: number, data: Partial<typeof interviewQuestions.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(interviewQuestions).set(data).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
      const result = await db.select().from(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.interviewQuestions.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.interviewQuestions[index] = { ...store.interviewQuestions[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.interviewQuestions[index];
      }
    }
  );
}

export async function deleteInterviewQuestion(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, id), eq(interviewQuestions.userId, userId)));
    },
    (store) => {
      const index = store.interviewQuestions.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.interviewQuestions.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Schedules ──────────────────────────────────────────────────
export async function getSchedules(userId: number) {
  return runQuery(
    async (db) => db.select().from(schedules).where(eq(schedules.userId, userId)).orderBy(desc(schedules.scheduledAt)),
    (store) => store.schedules.filter((i: any) => i.userId === userId).map((i: any) => ({ ...i, isCompleted: Number(i.isCompleted) })).sort((a: any, b: any) => a.scheduledAt - b.scheduledAt)
  );
}

export async function createSchedule(data: typeof schedules.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(schedules).values(data);
      const result = await db.select().from(schedules).where(eq(schedules.userId, data.userId)).orderBy(desc(schedules.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { 
        id: Math.floor(Math.random() * 10000),
        userId: data.userId,
        title: data.title,
        company: data.company ?? null,
        type: data.type || "other",
        scheduledAt: data.scheduledAt,
        description: data.description ?? null,
        isCompleted: data.isCompleted ?? 0,
        createdAt: now, 
        updatedAt: now 
      };
      store.schedules.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateSchedule(id: number, userId: number, data: Partial<typeof schedules.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(schedules).set(data).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
      const result = await db.select().from(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.schedules.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.schedules[index] = { ...store.schedules[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.schedules[index];
      }
    }
  );
}

export async function deleteSchedule(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, userId)));
    },
    (store) => {
      const index = store.schedules.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.schedules.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Company Bookmarks ──────────────────────────────────────────
export async function getCompanyBookmarks(userId: number) {
  return runQuery(
    async (db) => db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, userId)).orderBy(desc(companyBookmarks.updatedAt)),
    (store) => store.bookmarks.filter((i: any) => i.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt)
  );
}

export async function createCompanyBookmark(data: typeof companyBookmarks.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(companyBookmarks).values(data);
      const result = await db.select().from(companyBookmarks).where(eq(companyBookmarks.userId, data.userId)).orderBy(desc(companyBookmarks.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { ...data, id: Math.floor(Math.random() * 10000), createdAt: now, updatedAt: now };
      store.bookmarks.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateCompanyBookmark(id: number, userId: number, data: Partial<typeof companyBookmarks.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(companyBookmarks).set(data).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
      const result = await db.select().from(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.bookmarks.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.bookmarks[index] = { ...store.bookmarks[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.bookmarks[index];
      }
    }
  );
}

export async function deleteCompanyBookmark(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(companyBookmarks).where(and(eq(companyBookmarks.id, id), eq(companyBookmarks.userId, userId)));
    },
    (store) => {
      const index = store.bookmarks.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.bookmarks.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Checklist ──────────────────────────────────────────────────
export async function getChecklistItems(userId: number) {
  return runQuery(
    async (db) => db.select().from(checklistItems).where(eq(checklistItems.userId, userId)).orderBy(checklistItems.order),
    (store) => store.checklist.filter((i: any) => i.userId === userId).map((i: any) => ({ ...i, isCompleted: Number(i.isCompleted) })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  );
}

export async function createChecklistItem(data: typeof checklistItems.$inferInsert) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      await db.insert(checklistItems).values(data);
      const result = await db.select().from(checklistItems).where(eq(checklistItems.userId, data.userId)).orderBy(desc(checklistItems.createdAt)).limit(1);
      return result[0];
    },
    (store) => {
      const newItem = { 
        id: Math.floor(Math.random() * 10000),
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        isCompleted: data.isCompleted ?? 0,
        order: data.order ?? 0,
        createdAt: now, 
        updatedAt: now 
      };
      store.checklist.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function updateChecklistItem(id: number, userId: number, data: Partial<typeof checklistItems.$inferInsert>) {
  return runQuery(
    async (db) => {
      await db.update(checklistItems).set(data).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
      const result = await db.select().from(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId))).limit(1);
      return result[0];
    },
    (store) => {
      const index = store.checklist.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.checklist[index] = { ...store.checklist[index], ...data, updatedAt: Date.now() };
        saveMockStore(store);
        return store.checklist[index];
      }
    }
  );
}

export async function deleteChecklistItem(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
    },
    (store) => {
      const index = store.checklist.findIndex((i: any) => i.id === id && i.userId === userId);
      if (index !== -1) {
        store.checklist.splice(index, 1);
        saveMockStore(store);
      }
    }
  );
}

// ── Companies & Job Postings ───────────────────────────────────
export async function getAllCompanies(options?: { location?: string; sortBy?: "rank" | "name" | "recent" }) {
  return runQuery(
    async (db) => {
      let query = db
        .select({
          id: companies.id,
          name: companies.name,
          sector: companies.sector,
          rank: companies.rank,
          brand: companies.brand,
          hiringSeason: companies.hiringSeason,
          salaryGuide: companies.salaryGuide,
          keywords: companies.keywords,
          description: companies.description,
          revenue: companies.revenue,
          location: companies.location,
          employees: companies.employees,
          established: companies.established,
          website: companies.website,
          thumbnail: companies.thumbnail,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
          jobPostingsCount: sql<number>`count(${jobPostings.id})`.mapWith(Number),
        })
        .from(companies)
        .leftJoin(jobPostings, and(eq(jobPostings.companyId, companies.id), eq(jobPostings.isActive, 1)))
        .groupBy(companies.id);

      if (options?.location && options.location !== "all") {
        query = query.where(like(companies.location, `%${options.location}%`)) as any;
      }

      switch (options?.sortBy) {
        case "rank":
          query = query.orderBy(asc(companies.rank)) as any;
          break;
        case "name":
          query = query.orderBy(asc(companies.name)) as any;
          break;
        case "recent":
        default:
          query = query.orderBy(desc(companies.updatedAt)) as any;
          break;
      }

      return await query;
    },
    () => {
      // Mock Fallback
      const now = Date.now();
      return [
        { id: 1, name: "현대건설", sector: "건설/토목", rank: 1, brand: "힐스테이트", hiringSeason: "상반기/하반기", salaryGuide: "5,000만원대", location: "서울특별시 종로구", description: "국내 건설 산업을 선도하는 글로벌 건설사", employees: "약 6,000명", established: 1947, website: "https://www.hdec.kr", thumbnail: null, createdAt: now, updatedAt: now, jobPostingsCount: 1, keywords: null, revenue: null },
        { id: 2, name: "삼성물산", sector: "건설/건축", rank: 2, brand: "래미안", hiringSeason: "상시", salaryGuide: "5,500만원대", location: "서울특별시 강동구", description: "차별화된 기술력과 품질을 자랑하는 글로벌 건설사", employees: "약 5,000명", established: 1938, website: "https://www.secc.co.kr", thumbnail: null, createdAt: now, updatedAt: now, jobPostingsCount: 1, keywords: null, revenue: null },
        { id: 3, name: "대우건설", sector: "건설/토목", rank: 3, brand: "푸르지오", hiringSeason: "상반기", salaryGuide: "4,800만원대", location: "서울특별시 중구", description: "인류와 자연이 함께하는 건강한 미래를 만드는 대우건설", employees: "약 5,500명", established: 1973, website: "https://www.daewooenc.com", thumbnail: null, createdAt: now, updatedAt: now, jobPostingsCount: 0, keywords: null, revenue: null },
      ];
    }
  );
}

export async function getCompanyById(id: number) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      return result[0] || null;
    },
    () => null
  );
}

export async function getJobPostingsByCompanyId(companyId: number) {
  return runQuery(
    async (db) => db.select().from(jobPostings).where(eq(jobPostings.companyId, companyId)).orderBy(desc(jobPostings.postedAt)),
    () => []
  );
}

export async function createCompany(data: typeof companies.$inferInsert) {
  return runQuery(
    async (db) => {
      await db.insert(companies).values(data);
      const result = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(1);
      return result[0];
    },
    () => (data as any)
  );
}

export async function createJobPosting(data: typeof jobPostings.$inferInsert) {
  return runQuery(
    async (db) => {
      await db.insert(jobPostings).values(data);
      const result = await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt)).limit(1);
      return result[0];
    },
    () => (data as any)
  );
}

export async function updateUserProfile(userId: number, data: any) {
  return runQuery(
    async (db) => {
      await db.update(users).set(data).where(eq(users.id, userId));
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return result[0];
    },
    () => (data as any)
  );
}

// ── News Scraps ──────────────────────────────────────────────
export async function insertNewsScrap(userId: number, data: { title: string; link: string; source: string; pubDate: string; companyId?: number | null }) {
  const now = Date.now();
  const scrapData = {
    userId,
    title: data.title,
    link: data.link,
    source: data.source,
    pubDate: data.pubDate,
    companyId: data.companyId ?? null,
    createdAt: now,
  };

  return runQuery(
    async (db) => {
      const result = await db.insert(newsScraps).values(scrapData).returning();
      return result[0];
    },
    (store) => {
      if (!store.newsScraps) store.newsScraps = [];
      const newItem = { id: Math.floor(Math.random() * 10000), ...scrapData };
      store.newsScraps.push(newItem);
      saveMockStore(store);
      return newItem;
    }
  );
}

export async function getNewsScraps(userId: number, companyId?: number | null) {
  return runQuery(
    async (db) => {
      let q = db.select().from(newsScraps).where(eq(newsScraps.userId, userId));
      if (companyId !== undefined) {
        q = q.where(companyId === null ? sql`${newsScraps.companyId} IS NULL` : eq(newsScraps.companyId, companyId)) as any;
      }
      return q.orderBy(desc(newsScraps.createdAt));
    },
    (store) => {
      let filtered = (store.newsScraps || []).filter((s: any) => s.userId === userId);
      if (companyId !== undefined) {
        filtered = filtered.filter((s: any) => s.companyId === (companyId || undefined));
      }
      return filtered.sort((a: any, b: any) => b.createdAt - a.createdAt);
    }
  );
}

export async function deleteNewsScrap(id: number, userId: number) {
  return runQuery(
    async (db) => {
      await db.delete(newsScraps).where(and(eq(newsScraps.id, id), eq(newsScraps.userId, userId)));
    },
    (store) => {
      store.newsScraps = (store.newsScraps || []).filter((s: any) => !(s.id === id && s.userId === userId));
      saveMockStore(store);
    }
  );
}

// ── Company Notes ──────────────────────────────────────────────
export async function getCompanyNote(userId: number, companyId: number) {
  return runQuery(
    async (db) => {
      const result = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1);
      return result[0] || null;
    },
    (store) => (store.companyNotes || []).find((n: any) => n.userId === userId && n.companyId === companyId) || null
  );
}

export async function upsertCompanyNote(userId: number, companyId: number, content: string) {
  const now = Date.now();
  return runQuery(
    async (db) => {
      const existing = await db.select().from(companyNotes).where(and(eq(companyNotes.userId, userId), eq(companyNotes.companyId, companyId))).limit(1);
      if (existing.length > 0) {
        const [updated] = await db.update(companyNotes).set({ content, updatedAt: now }).where(eq(companyNotes.id, existing[0].id)).returning();
        return updated;
      } else {
        const [inserted] = await db.insert(companyNotes).values({ userId, companyId, content, updatedAt: now }).returning();
        return inserted;
      }
    },
    (store) => {
      if (!store.companyNotes) store.companyNotes = [];
      const index = store.companyNotes.findIndex((n: any) => n.userId === userId && n.companyId === companyId);
      if (index !== -1) {
        store.companyNotes[index] = { ...store.companyNotes[index], content, updatedAt: now };
        saveMockStore(store);
        return store.companyNotes[index];
      } else {
        const newItem = { id: Math.floor(Math.random() * 10000), userId, companyId, content, updatedAt: now };
        store.companyNotes.push(newItem);
        saveMockStore(store);
        return newItem;
      }
    }
  );
}

// ── Dashboard Summary ──────────────────────────────────────────
export async function getDashboardSummary(userId: number) {
  return runQuery(
    async (db) => {
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
    },
    (store) => {
      const now = Date.now();
      const userCVs = store.coverLetters.filter((i: any) => i.userId === userId);
      const userResumes = store.resumes.filter((i: any) => i.userId === userId);
      const userBookmarks = store.bookmarks.filter((i: any) => i.userId === userId);
      const userSchedules = store.schedules.filter((i: any) => i.userId === userId && i.scheduledAt > now && !i.isCompleted);
      const userChecklist = store.checklist.filter((i: any) => i.userId === userId);
      const completed = userChecklist.filter((i: any) => i.isCompleted).length;
      return {
        counts: { coverLetters: userCVs.length, resumes: userResumes.length, bookmarks: userBookmarks.length },
        lastUpdatedMaster: userCVs.length > 0 ? Math.max(...userCVs.map((i: any) => i.updatedAt)) : Date.now(),
        upcomingSchedules: userSchedules.slice(0, 3),
        checklist: { progress: userChecklist.length > 0 ? Math.round((completed / userChecklist.length) * 100) : 0, items: userChecklist.filter((i: any) => !i.isCompleted).slice(0, 3) }
      };
    }
  );
}
