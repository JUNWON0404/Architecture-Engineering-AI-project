import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  authenticateUser,
  createChecklistItem,
  createCompany,
  createCompanyBookmark,
  createCoverLetter,
  createInterviewQuestion,
  createJobPosting,
  createResume,
  createSchedule,
  createUserWithEmail,
  deleteChecklistItem,
  deleteCompanyBookmark,
  deleteCoverLetter,
  deleteInterviewQuestion,
  deleteResume,
  deleteSchedule,
  getChecklistItems,
  getCompanyBookmarks,
  getCompanyById,
  getCoverLetterById,
  getCoverLetters,
  getInterviewQuestionById,
  getInterviewQuestions,
  getResumeById,
  getResumes,
  getSchedules,
  getAllCompanies,
  getJobPostingsByCompanyId,
  updateChecklistItem,
  updateCompanyBookmark,
  updateCoverLetter,
  updateInterviewQuestion,
  updateResume,
  updateSchedule,
  updateUserProfile,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // 현재 로그인한 사용자 정보 조회
    me: publicProcedure.query(({ ctx }) => {
      // 로컬 개발 환경에서 사용자가 없는 경우(DB 연결 실패 등), 임시 사용자 반환
      if (!ctx.user && process.env.NODE_ENV === "development") {
        console.log("[Auth] Providing DEV_USER for 'me' query");
        return {
          id: 1,
          openId: "dev-user-id",
          email: "dev@example.com",
          name: "개발 사용자",
          role: "user",
        };
      }
      return ctx.user;
    }),
    
    /**
     * 회원가입 API
     */
    signUp: publicProcedure
      .input(z.object({
        email: z.string().email("유효한 이메일을 입력해주세요"),
        password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
        name: z.string().min(1, "이름을 입력해주세요").optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await createUserWithEmail(input.email, input.password, input.name);
          if (!user) throw new Error("사용자 생성 실패");
          const sessionToken = await sdk.createSessionToken(user.id.toString(), {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const { password, ...userWithoutPassword } = user;
          return { success: true, user: userWithoutPassword };
        } catch (error) {
          const message = error instanceof Error ? error.message : "회원가입 실패";
          throw new Error(message);
        }
      }),

    /**
     * 로그인 API
     */
    signIn: publicProcedure
      .input(z.object({
        email: z.string().email("유효한 이메일을 입력해주세요"),
        password: z.string().min(1, "비밀번호를 입력해주세요"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await authenticateUser(input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user.id.toString(), {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const { password, ...userWithoutPassword } = user;
          return { success: true, user: userWithoutPassword };
        } catch (error) {
          const message = error instanceof Error ? error.message : "로그인 실패";
          throw new Error(message);
        }
      }),

    // 로그아웃
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Cover Letters ──────────────────────────────────────────────
  coverLetter: router({
    list: protectedProcedure.query(({ ctx }) => getCoverLetters(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getCoverLetterById(input.id, ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        company: z.string().optional(),
        position: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "completed", "submitted"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log("[Router] createCoverLetter input:", input);
        const now = Date.now();
        const result = await createCoverLetter({ 
          ...input, 
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          status: input.status || "draft",
          company: input.company || null,
          position: input.position || null,
          content: input.content || null,
        });
        console.log("[Router] createCoverLetter success:", result?.id);
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "completed", "submitted"]).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCoverLetter(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteCoverLetter(input.id, ctx.user.id)),
  }),

  // ── Interview Questions ────────────────────────────────────────
  interview: router({
    list: protectedProcedure.query(({ ctx }) => getInterviewQuestions(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getInterviewQuestionById(input.id, ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        question: z.string().min(1),
        answer: z.string().optional(),
        category: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) =>
        createInterviewQuestion({ ...input, userId: ctx.user.id })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        question: z.string().min(1).optional(),
        answer: z.string().optional(),
        category: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateInterviewQuestion(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteInterviewQuestion(input.id, ctx.user.id)),
  }),

  // ── Resumes ────────────────────────────────────────────────────
  resume: router({
    list: protectedProcedure.query(({ ctx }) => getResumes(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getResumeById(input.id, ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log("[Router] createResume input:", input);
        const now = Date.now();
        const result = await createResume({ 
          ...input, 
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          content: input.content || null,
          isDefault: input.isDefault ? 1 : 0,
        });
        console.log("[Router] createResume success:", result?.id);
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateResume(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteResume(input.id, ctx.user.id)),
  }),

  // ── Schedules ──────────────────────────────────────────────────
  schedule: router({
    list: protectedProcedure.query(({ ctx }) => getSchedules(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        company: z.string().optional(),
        type: z.enum(["application", "document", "interview", "test", "other"]),
        scheduledAt: z.number(),
        description: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) =>
        createSchedule({ ...input, userId: ctx.user.id })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        company: z.string().optional(),
        type: z.enum(["application", "document", "interview", "test", "other"]).optional(),
        scheduledAt: z.number().optional(),
        description: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateSchedule(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteSchedule(input.id, ctx.user.id)),
  }),

  // ── Company Bookmarks ──────────────────────────────────────────
  bookmark: router({
    list: protectedProcedure.query(({ ctx }) => getCompanyBookmarks(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        industry: z.string().optional(),
        position: z.string().optional(),
        jobUrl: z.string().optional(),
        deadline: z.number().optional(),
        notes: z.string().optional(),
        status: z.enum(["interested", "applied", "interview", "offer", "rejected"]).optional(),
      }))
      .mutation(({ ctx, input }) =>
        createCompanyBookmark({ ...input, userId: ctx.user.id })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        industry: z.string().optional(),
        position: z.string().optional(),
        jobUrl: z.string().optional(),
        deadline: z.number().optional(),
        notes: z.string().optional(),
        status: z.enum(["interested", "applied", "interview", "offer", "rejected"]).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCompanyBookmark(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteCompanyBookmark(input.id, ctx.user.id)),
  }),

  // ── Checklist ──────────────────────────────────────────────────
  checklist: router({
    list: protectedProcedure.query(({ ctx }) => getChecklistItems(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        isCompleted: z.boolean().optional(),
        order: z.number().optional(),
      }))
      .mutation(({ ctx, input }) =>
        createChecklistItem({ ...input, userId: ctx.user.id })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        isCompleted: z.boolean().optional(),
        order: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateChecklistItem(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteChecklistItem(input.id, ctx.user.id)),
  }),

  // ── Companies ──────────────────────────────────────────────────
  company: router({
    list: publicProcedure.query(() => getAllCompanies()),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCompanyById(input.id)),
    jobPostings: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(({ input }) => getJobPostingsByCompanyId(input.companyId)),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        sector: z.string().min(1),
        established: z.number().optional(),
        employees: z.string().optional(),
        revenue: z.string().optional(),
        location: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const now = Date.now();
        return createCompany({ ...input, createdAt: now, updatedAt: now });
      }),
    createJobPosting: publicProcedure
      .input(z.object({
        companyId: z.number(),
        title: z.string().min(1),
        position: z.string().min(1),
        description: z.string().optional(),
        requiredMajors: z.string().optional(), // JSON string
        salary: z.string().optional(),
        location: z.string().optional(),
        deadline: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const now = Date.now();
        return createJobPosting({ 
          ...input, 
          postedAt: now,
          createdAt: now, 
          updatedAt: now,
          isActive: 1,
        });
      }),
  }),

  // ── User Profile ───────────────────────────────────────────────
  profile: router({
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        targetJob: z.string().optional(),
        targetCompany: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
