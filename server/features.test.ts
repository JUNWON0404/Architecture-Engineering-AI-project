import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context with authenticated user
function createMockContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    bio: null,
    targetJob: null,
    targetCompany: null,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("JobReady Features", () => {
  describe("Cover Letter Management", () => {
    it("should create a cover letter", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.coverLetter.create({
        title: "삼성전자 자기소개서",
        company: "삼성전자",
        position: "소프트웨어 개발",
        content: "저는 소프트웨어 개발에 열정이 있습니다.",
        status: "draft",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("삼성전자 자기소개서");
      expect(result.company).toBe("삼성전자");
      expect(result.status).toBe("draft");
    });

    it("should list cover letters", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.coverLetter.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update a cover letter", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const created = await caller.coverLetter.create({
        title: "원본 제목",
        company: "회사명",
        position: "직무",
        content: "내용",
        status: "draft",
      });

      const updated = await caller.coverLetter.update({
        id: created.id,
        title: "수정된 제목",
        company: "회사명",
        position: "직무",
        content: "수정된 내용",
        status: "completed",
      });

      expect(updated.title).toBe("수정된 제목");
      expect(updated.status).toBe("completed");
    });
  });

  describe("Interview Question Management", () => {
    it("should create an interview question", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.interview.create({
        question: "당신의 강점은 무엇입니까?",
        answer: "저는 문제 해결 능력이 뛰어납니다.",
        category: "인성",
        company: "카카오",
        position: "백엔드 개발",
        difficulty: "medium",
      });

      expect(result).toBeDefined();
      expect(result.question).toBe("당신의 강점은 무엇입니까?");
      expect(result.difficulty).toBe("medium");
    });

    it("should list interview questions", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.interview.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Resume Management", () => {
    it("should create a resume", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.resume.create({
        title: "2026년 상반기 이력서",
        content: "기본 정보: ...",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("2026년 상반기 이력서");
      expect(result.content).toBe("기본 정보: ...");
    });

    it("should set default resume", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const resume1 = await caller.resume.create({
        title: "이력서 1",
        content: "내용 1",
      });

      const resume2 = await caller.resume.create({
        title: "이력서 2",
        content: "내용 2",
      });

      const updated = await caller.resume.update({
        id: resume2.id,
        title: "이력서 2",
        content: "내용 2",
        isDefault: true,
      });

      expect(updated?.id).toBe(resume2.id);
      expect(updated?.title).toBe("이력서 2");
    });
  });

  describe("Schedule Management", () => {
    it("should create a schedule", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const result = await caller.schedule.create({
        title: "삼성전자 면접",
        company: "삼성전자",
        type: "interview",
        scheduledAt: futureDate,
        description: "1차 기술 면접",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("삼성전자 면접");
      expect(result.type).toBe("interview");
      expect(result.isCompleted).toBe(false);
    });

    it("should toggle schedule completion", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const futureDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const created = await caller.schedule.create({
        title: "테스트 일정",
        type: "other",
        scheduledAt: futureDate,
      });

      const updated = await caller.schedule.update({
        id: created.id,
        isCompleted: true,
      });

      expect(updated.isCompleted).toBe(true);
    });
  });

  describe("Bookmark Management", () => {
    it("should create a bookmark", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bookmark.create({
        companyName: "카카오",
        industry: "IT",
        position: "백엔드 개발",
        jobUrl: "https://example.com/job",
        status: "interested",
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe("카카오");
      expect(result.status).toBe("interested");
    });

    it("should update bookmark status", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const created = await caller.bookmark.create({
        companyName: "네이버",
        status: "interested",
      });

      const updated = await caller.bookmark.update({
        id: created.id,
        companyName: "네이버",
        status: "applied",
      });

      expect(updated.status).toBe("applied");
    });
  });

  describe("Checklist Management", () => {
    it("should create a checklist item", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.checklist.create({
        title: "자기소개서 작성하기",
        category: "서류 작성",
        description: "3개 회사 자기소개서 작성",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("자기소개서 작성하기");
      expect(result.isCompleted).toBe(false);
    });

    it("should toggle checklist item completion", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const created = await caller.checklist.create({
        title: "면접 준비하기",
        category: "면접 준비",
      });

      const updated = await caller.checklist.update({
        id: created.id,
        isCompleted: true,
      });

      expect(updated.isCompleted).toBe(true);
    });
  });

  describe("Profile Management", () => {
    it("should update user profile", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.update({
        name: "김준호",
        bio: "소프트웨어 개발자를 꿈꾸고 있습니다.",
        targetJob: "백엔드 개발자",
        targetCompany: "카카오, 네이버",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("김준호");
      expect(result.targetJob).toBe("백엔드 개발자");
    });
  });
});
