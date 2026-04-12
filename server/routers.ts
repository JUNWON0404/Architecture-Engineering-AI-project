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
          // 한국건설신문(conslove.co.kr) 뉴스만 필터링하여 Google News RSS 검색
          const query = encodeURIComponent(`${input.companyName} site:conslove.co.kr`);
          const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
          
          const feed = await rssParser.parseURL(url);
          
          return feed.items.slice(0, 5).map(item => ({
            title: item.title?.split(" - ")[0] || "제목 없음",
            link: item.link || "#",
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
            source: "한국건설신문"
          }));
        } catch (error) {
          console.error("[News] RSS Fetch Error:", error);
          return [];
        }
      }),
  }),

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
          bio: "안녕하세요, 개발 사용자입니다.",
          targetJob: "풀스택 개발자",
          targetCompany: "구글",
          loginMethod: "email",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
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
          const user = await createUserWithEmail(input.email, input.password, input.name) as any;
          if (!user) throw new Error("사용자 생성 실패");
          const sessionToken = await sdk.createSessionToken(user.id.toString(), {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const { password: _, ...userWithoutPassword } = user as any;
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
          const { password: _, ...userWithoutPassword } = user as any;
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
    // 단일 마스터 자소서 가져오기
    getMaster: protectedProcedure.query(async ({ ctx }) => {
      const master = await getMasterCoverLetter(ctx.user.id);
      if (master) return master;
      
      // 마스터가 아예 없으면 최초 1회 자동 생성 및 마스터 설정
      const now = Date.now();
      return createCoverLetter({
        userId: ctx.user.id,
        title: "나의 마스터 자소서",
        status: "draft",
        isMaster: 1,
        createdAt: now,
        updatedAt: now,
      });
    }),
    listBrief: protectedProcedure.query(({ ctx }) => getCoverLettersBrief(ctx.user.id)),
    list: protectedProcedure.query(({ ctx }) => getCoverLetters(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getCoverLetterById(input.id, ctx.user.id)
    ),
    setMaster: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => setMasterCoverLetter(ctx.user.id, input.id)),
    clone: protectedProcedure
      .input(z.object({ masterId: z.number(), companyName: z.string() }))
      .mutation(({ ctx, input }) => cloneCoverLetter(input.masterId, ctx.user.id, input.companyName)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        company: z.string().optional(),
        position: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "completed", "submitted"]).optional(),
        major: z.string().optional(),
        gpa: z.string().optional(),
        certifications: z.string().optional(),
        experience: z.string().optional(),
        activities: z.string().optional(),
        majorCourses: z.string().optional(),
        keywords: z.string().optional(),
        keyStory: z.string().optional(),
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
          major: input.major || null,
          gpa: input.gpa || null,
          certifications: input.certifications || null,
          experience: input.experience || null,
          activities: input.activities || null,
          majorCourses: input.majorCourses || null,
          keywords: input.keywords || null,
          keyStory: input.keyStory || null,
        });
        console.log("[Router] createCoverLetter success:", result?.id);
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "completed", "submitted"]).optional(),
        major: z.string().optional(),
        gpa: z.string().optional(),
        certifications: z.string().optional(),
        experience: z.string().optional(),
        activities: z.string().optional(),
        keywords: z.string().optional(),
        keyStory: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateCoverLetter(id, ctx.user.id, {
          ...data,
          updatedAt: Date.now(),
        });
      }),
    generate: protectedProcedure
      .input(z.object({
        company: z.string().optional(),
        position: z.string().optional(),
        major: z.string().optional(),
        gpa: z.string().optional(),
        certifications: z.string().optional(),
        experience: z.string().optional(),
        activities: z.string().optional(),
        keywords: z.string().optional(),
        keyStory: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `
당신은 전문 취업 컨설턴트이자 건설사 채용 전문가입니다. 
아래 제공된 사용자의 브레인스토밍 데이터와 지원 정보를 바탕으로, 건설사(건축/토목/플랜트 등)에 최적화된 전문적이고 매력적인 자기소개서 초안을 작성해주세요.

[지원 정보]
- 지원 기업: ${input.company || "미정"}
- 지원 직무: ${input.position || "미정"}

[사용자 데이터]
- 전공: ${input.major || "미정"}
- 학점: ${input.gpa || "미정"}
- 자격증 및 스펙: ${input.certifications || "미정"}
- 주요 경험: ${input.experience || "미정"}
- 핵심 역량 키워드: ${input.keywords || "미정"}
- 주요 에피소드(STAR): ${input.keyStory || "미정"}

[작성 가이드라인]
1. 건설 산업의 특성(안전, 현장 중심, 협업, 공기 준수 등)이 잘 드러나도록 작성하세요.
2. 사용자가 제공한 구체적인 에피소드(STAR)를 자연스럽게 문장으로 풀어내세요.
3. 전문적이고 신뢰감 있는 어조를 사용하되, 너무 딱딱하지 않게 작성하세요.
4. 문단별로 소제목을 달아 가독성을 높여주세요.
5. 분량은 약 1,000자 내외로 작성해주세요.

자기소개서 초안만 출력하세요. 다른 설명은 생략하세요.
        `;

        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content = result.choices[0].message.content;
        return { 
          content: typeof content === 'string' 
            ? content 
            : Array.isArray(content) 
              ? content.map(p => 'text' in p ? p.text : '').join('') 
              : JSON.stringify(content) 
        };
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
      .mutation(({ ctx, input }) => {
        const now = Date.now();
        return createInterviewQuestion({
          ...input,
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          isPublic: input.isPublic ? 1 : 0,
          answer: input.answer || null,
          category: input.category || null,
          company: input.company || null,
          position: input.position || null,
        });
      }),
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
        return updateInterviewQuestion(id, ctx.user.id, {
          ...data,
          isPublic: data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : undefined,
        });
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
        return updateResume(id, ctx.user.id, {
          ...data,
          isDefault: data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : undefined,
        });
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
      .mutation(({ ctx, input }) => {
        const now = Date.now();
        return createSchedule({
          ...input,
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          isCompleted: input.isCompleted ? 1 : 0,
          company: input.company || null,
          description: input.description || null,
        });
      }),
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
        return updateSchedule(id, ctx.user.id, {
          ...data,
          isCompleted: data.isCompleted !== undefined ? (data.isCompleted ? 1 : 0) : undefined,
        });
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
      .mutation(({ ctx, input }) => {
        const now = Date.now();
        return createCompanyBookmark({
          ...input,
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          industry: input.industry || null,
          position: input.position || null,
          jobUrl: input.jobUrl || null,
          deadline: input.deadline || null,
          notes: input.notes || null,
          status: input.status || "interested",
        });
      }),
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
      .mutation(({ ctx, input }) => {
        const now = Date.now();
        return createChecklistItem({
          ...input,
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
          isCompleted: input.isCompleted ? 1 : 0,
          description: input.description || null,
          category: input.category || null,
          order: input.order ?? 0,
        });
      }),
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
        return updateChecklistItem(id, ctx.user.id, {
          ...data,
          isCompleted: data.isCompleted !== undefined ? (data.isCompleted ? 1 : 0) : undefined,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteChecklistItem(input.id, ctx.user.id)),
  }),

  // ── Companies ──────────────────────────────────────────────────
  company: router({
    list: publicProcedure
      .input(z.object({
        location: z.string().nullable().optional(),
        sortBy: z.enum(["rank", "name", "recent"]).optional(),
      }).optional())
      .query(({ input }) => getAllCompanies({
        ...input,
        location: input?.location ?? undefined
      })),
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
