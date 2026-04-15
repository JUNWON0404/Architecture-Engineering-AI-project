import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import Parser from "rss-parser";
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
  getCoverLettersBrief,
  getInterviewQuestionById,
  getInterviewQuestions,
  getMasterCoverLetter,
  getResumeById,
  getResumes,
  getSchedules,
  getAllCompanies,
  getJobPostingsByCompanyId,
  setMasterCoverLetter,
  cloneCoverLetter,
  updateChecklistItem,
  updateCompanyBookmark,
  updateCoverLetter,
  updateInterviewQuestion,
  updateResume,
  updateSchedule,
  updateUserProfile,
  getDashboardSummary,
  insertNewsScrap,
  getNewsScraps,
  deleteNewsScrap,
  getCompanyNote,
  upsertCompanyNote,
} from "./db";

const rssParser = new Parser();

export const appRouter = router({
  system: systemRouter,
  
  dashboard: router({
    getSummary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id)),
  }),

  news: router({
    list: publicProcedure
      .input(z.object({ companyName: z.string() }))
      .query(async ({ input }) => {
        try {
          let url;
          const isGlobal = input.companyName === "건설";
          if (isGlobal) url = "http://www.conslove.co.kr/rss/clickTop.xml";
          else url = "http://www.conslove.co.kr/rss/allArticle.xml";
          
          const feed = await rssParser.parseURL(url);
          let items = feed.items;
          if (!isGlobal) {
            const cleanName = input.companyName.replace(/\(.*\)/, "").trim();
            items = items.filter(item => item.title?.includes(cleanName) || item.contentSnippet?.includes(cleanName));
          }
          
          return items.slice(0, 5).map(item => ({
            title: item.title?.split(" - ")[0] || "제목 없음",
            link: item.link || "#",
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
            source: isGlobal ? "한국건설신문 인기" : "한국건설신문"
          }));
        } catch (error) {
          console.error("[News] RSS Fetch Error:", error);
          return [];
        }
      }),
  }),

  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user && process.env.NODE_ENV === "development") {
        return {
          id: 1, openId: "dev-user-id", email: "dev@example.com", name: "개발 사용자", role: "user",
          bio: "안녕하세요, 개발 사용자입니다.", targetJob: "풀스택 개발자", targetCompany: "구글",
          loginMethod: "email", createdAt: Date.now(), updatedAt: Date.now(), lastSignedIn: Date.now(),
        };
      }
      return ctx.user;
    }),
    signUp: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const user = await createUserWithEmail(input.email, input.password, input.name) as any;
        const sessionToken = await sdk.createSessionToken(user.id.toString(), { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
    signIn: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await authenticateUser(input.email, input.password);
        const sessionToken = await sdk.createSessionToken(user.id.toString(), { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    }),
  }),

  coverLetter: router({
    getMaster: protectedProcedure.query(async ({ ctx }) => {
      const master = await getMasterCoverLetter(ctx.user.id);
      if (master) return master;
      return createCoverLetter({ userId: ctx.user.id, title: "나의 마스터 자소서", status: "draft", isMaster: 1, createdAt: Date.now(), updatedAt: Date.now() });
    }),
    listBrief: protectedProcedure.query(({ ctx }) => getCoverLettersBrief(ctx.user.id)),
    list: protectedProcedure.query(({ ctx }) => getCoverLetters(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => getCoverLetterById(input.id, ctx.user.id)),
    setMaster: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => setMasterCoverLetter(ctx.user.id, input.id)),
    clone: protectedProcedure.input(z.object({ masterId: z.number(), companyName: z.string() })).mutation(({ ctx, input }) => cloneCoverLetter(input.masterId, ctx.user.id, input.companyName)),
    create: protectedProcedure.input(z.object({ title: z.string(), company: z.string().optional(), position: z.string().optional(), content: z.string().optional(), status: z.enum(["draft", "completed", "submitted"]).optional() }))
      .mutation(({ ctx, input }) => createCoverLetter({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), status: z.enum(["draft", "completed", "submitted"]).optional() }))
      .mutation(({ ctx, input }) => updateCoverLetter(input.id, ctx.user.id, { ...input, updatedAt: Date.now() })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteCoverLetter(input.id, ctx.user.id)),
  }),

  interview: router({
    list: protectedProcedure.query(({ ctx }) => getInterviewQuestions(ctx.user.id)),
    create: protectedProcedure.input(z.object({ question: z.string(), answer: z.string().optional() }))
      .mutation(({ ctx, input }) => createInterviewQuestion({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z.object({ id: z.number(), question: z.string().optional(), answer: z.string().optional() }))
      .mutation(({ ctx, input }) => updateInterviewQuestion(input.id, ctx.user.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteInterviewQuestion(input.id, ctx.user.id)),
  }),

  resume: router({
    list: protectedProcedure.query(({ ctx }) => getResumes(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string(), content: z.string().optional() }))
      .mutation(({ ctx, input }) => createResume({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => getResumeById(input.id, ctx.user.id)),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), isDefault: z.boolean().optional() }))
      .mutation(({ ctx, input }) => updateResume(input.id, ctx.user.id, { ...input, isDefault: input.isDefault !== undefined ? (input.isDefault ? 1 : 0) : undefined })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteResume(input.id, ctx.user.id)),
  }),

  schedule: router({
    list: protectedProcedure.query(({ ctx }) => getSchedules(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string(), scheduledAt: z.number(), type: z.enum(["application", "document", "interview", "test", "other"]) }))
      .mutation(({ ctx, input }) => createSchedule({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), scheduledAt: z.number().optional(), isCompleted: z.boolean().optional() }))
      .mutation(({ ctx, input }) => updateSchedule(input.id, ctx.user.id, { ...input, isCompleted: input.isCompleted ? 1 : 0 })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteSchedule(input.id, ctx.user.id)),
  }),

  bookmark: router({
    list: protectedProcedure.query(({ ctx }) => getCompanyBookmarks(ctx.user.id)),
    create: protectedProcedure.input(z.object({ companyName: z.string() }))
      .mutation(({ ctx, input }) => createCompanyBookmark({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteCompanyBookmark(input.id, ctx.user.id)),
  }),

  checklist: router({
    list: protectedProcedure.query(({ ctx }) => getChecklistItems(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string(), description: z.string().optional(), category: z.string().optional() }))
      .mutation(({ ctx, input }) => createChecklistItem({ ...input, userId: ctx.user.id, createdAt: Date.now(), updatedAt: Date.now() })),
    update: protectedProcedure.input(z.object({ id: z.number(), isCompleted: z.boolean().optional() }))
      .mutation(({ ctx, input }) => updateChecklistItem(input.id, ctx.user.id, { ...input, isCompleted: input.isCompleted ? 1 : 0 })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteChecklistItem(input.id, ctx.user.id)),
  }),

  company: router({
    list: publicProcedure.input(z.object({ location: z.string().nullable().optional(), sortBy: z.enum(["rank", "name", "recent"]).optional() }).optional())
      .query(({ input }) => getAllCompanies(input ? { ...input, location: input.location ?? undefined } : undefined)),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getCompanyById(input.id)),
    jobPostings: publicProcedure.input(z.object({ companyId: z.number() })).query(({ input }) => getJobPostingsByCompanyId(input.companyId)),
  }),

  profile: router({
    update: protectedProcedure.input(z.object({ name: z.string().optional(), bio: z.string().optional() }))
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  }),

  newsScrap: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number().nullish() }).optional())
      .query(({ ctx, input }) => getNewsScraps(ctx.user.id, input?.companyId)),
    create: protectedProcedure
      .input(z.object({ title: z.string(), link: z.string(), source: z.string(), pubDate: z.string(), companyId: z.number().nullish() }))
      .mutation(({ ctx, input }) => insertNewsScrap(ctx.user.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteNewsScrap(input.id, ctx.user.id)),
  }),

  incruit: router({
    list: publicProcedure
      .input(z.object({ type: z.enum(["occupation", "open", "industry"]) }))
      .query(async ({ input }) => {
        try {
          let url;
          if (input.type === "occupation") url = "https://www.incruit.com/rss/job.asp?occ1=107";
          else if (input.type === "open") url = "https://www.incruit.com/rss/job.asp?jobtycd=1&today=y";
          else url = "https://www.incruit.com/rss/job.asp?Ind1=21";
          
          const feed = await rssParser.parseURL(url);
          return feed.items.slice(0, 10).map(item => {
            const match = item.title?.match(/\[(.*?)\] (.*)/);
            return {
              company: match ? match[1] : "인크루트 채용",
              title: match ? match[2] : (item.title || "채용 공고"),
              link: item.link || "#",
              pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
            };
          });
        } catch (error) {
          console.error("[Incruit] RSS Fetch Error:", error);
          return [];
        }
      }),
  }),

  companyNote: router({
    get: protectedProcedure.input(z.object({ companyId: z.number() })).query(({ ctx, input }) => getCompanyNote(ctx.user.id, input.companyId)),
    upsert: protectedProcedure
      .input(z.object({ companyId: z.number(), content: z.string() }))
      .mutation(({ ctx, input }) => upsertCompanyNote(ctx.user.id, input.companyId, input.content)),
  }),
});

export type AppRouter = typeof appRouter;
