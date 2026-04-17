import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
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
  upsertUser,
  searchCompanies,
  getCoverLettersByCompany,
} from "./db";

const rssParser = new Parser({
  timeout: 5000,
  headers: { "User-Agent": "Mozilla/5.0" }
});

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
          const isGlobal = input.companyName === "건설" || input.companyName === "핫뉴스";
          if (isGlobal) url = "http://www.conslove.co.kr/rss/clickTop.xml";
          else url = "http://www.conslove.co.kr/rss/allArticle.xml";
          
          const feed = await rssParser.parseURL(url);
          let items = feed.items;
          if (!isGlobal) {
            const cleanName = input.companyName.replace(/\(.*\)/g, "").replace(/주식회사/g, "").trim();
            items = items.filter(item => 
              (item.title && item.title.includes(cleanName)) || 
              (item.contentSnippet && item.contentSnippet.includes(cleanName))
            );
          }
          
          return items.slice(0, 5).map(item => ({
            title: item.title?.split(" - ")[0] || "제목 없음",
            link: item.link || "#",
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ko-KR") : "",
            source: isGlobal ? "한국건설신문 인기" : "한국건설신문"
          }));
        } catch (error) {
          console.error("[News] RSS Fetch Error:", String(error));
          return [];
        }
      }),
  }),

  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.user;
    }),
    signUp: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const user = await createUserWithEmail(input.email, input.password, input.name) as any;
        const openId = user.openId || `email:${input.email}`;
        const sessionToken = await sdk.createSessionToken(openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
        const opts = getSessionCookieOptions(ctx.req);
        // 기존 쿠키 초기화 후 새 쿠키 세팅
        ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", expires: new Date(0) });
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...opts, maxAge: ONE_YEAR_MS });
        return { success: true, user };
      }),
    signIn: publicProcedure.input(z.object({ email: z.string().email(), password: z.string(), rememberMe: z.boolean().optional().default(false) }))
      .mutation(async ({ input, ctx }) => {
        const user = await authenticateUser(input.email, input.password);
        const correctOpenId = `email:${input.email}`;
        if (!(user as any).openId) {
          await upsertUser({ openId: correctOpenId, email: input.email, name: user.name, loginMethod: "email", createdAt: (user as any).createdAt || Date.now(), updatedAt: Date.now(), lastSignedIn: Date.now() });
        }
        const openId = (user as any).openId || correctOpenId;
        console.log("[signIn] creating token with openId:", openId);
        
        // 토큰 수명: 로그인 유지가 켜져있으면 1년, 아니면 1일(또는 세션에 맞춤)로 설정
        const tokenExpires = input.rememberMe ? ONE_YEAR_MS : 24 * 60 * 60 * 1000;
        const sessionToken = await sdk.createSessionToken(openId, { name: user.name || "", expiresInMs: tokenExpires });
        
        const opts = getSessionCookieOptions(ctx.req);
        // 기존 쿠키 초기화 후 새 쿠키 세팅
        ctx.res.cookie(COOKIE_NAME, "", { httpOnly: true, path: "/", expires: new Date(0) });
        
        // 로그인 유지 설정에 따라 maxAge 속성 부여 (세션 쿠키 여부 결정)
        const finalCookieOpts = input.rememberMe ? { ...opts, maxAge: ONE_YEAR_MS } : { ...opts };
        ctx.res.cookie(COOKIE_NAME, sessionToken, finalCookieOpts);
        
        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const opts = getSessionCookieOptions(ctx.req);
      // maxAge 없이 expires를 과거로 설정해 쿠키 삭제
      ctx.res.cookie(COOKIE_NAME, "", { ...opts, expires: new Date(0) });
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
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), company: z.string().optional(), position: z.string().optional(), content: z.string().optional(), status: z.enum(["draft", "completed", "submitted"]).optional(), major: z.string().optional(), gpa: z.string().optional(), certifications: z.string().optional(), experience: z.string().optional(), activities: z.string().optional(), majorCourses: z.string().optional(), keywords: z.string().optional(), keyStory: z.string().optional() }))
      .mutation(({ ctx, input }) => updateCoverLetter(input.id, ctx.user.id, { ...input, updatedAt: Date.now() })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteCoverLetter(input.id, ctx.user.id)),
    generateDraft: protectedProcedure.input(z.object({
      major: z.string().optional().default(""),
      gpa: z.string().optional().default(""),
      certifications: z.string().optional().default(""),
      experience: z.string().optional().default("[]"),
      majorCourses: z.string().optional().default(""),
      keyStory: z.string().optional().default(""),
      company: z.string().optional().default("건설사"),
      position: z.string().optional().default("시공/설계"),
      companyDescription: z.string().optional().default(""),
      companyKeywords: z.string().optional().default(""),
    })).mutation(async ({ input }) => {
      const companyContext = (input.companyDescription || input.companyKeywords)
        ? `\n[지원 기업 참고 정보 - 직접 인용 금지, 배경 이해용으로만 활용]\n- 기업 특성: ${input.companyDescription}\n- 인재상/핵심 가치: ${input.companyKeywords}`
        : "";

      const prompt = `
[지원자 데이터]
- 지원 기업/직무: ${input.company} / ${input.position}
- 전공/학점: ${input.major} (${input.gpa})
- 자격/역량: ${input.certifications} / ${input.majorCourses}
- 핵심 경험 (STAR):
${input.keyStory}
${companyContext}

[작성 지침]
아래 두 버전의 자기소개서 초안을 각 500자 내외로 작성하라.${companyContext ? `
기업 정보는 지원자의 경험과 자연스럽게 연결되는 맥락 설정에만 활용하라. 기업 소개 문구나 슬로건을 그대로 옮겨 쓰지 말고, 지원자의 실제 행동과 결과를 통해 해당 기업이 원하는 인재상을 간접적으로 증명하라.` : ""}

버전 가 - 현장 소통형: TBM, 안전 관리, 공정 조율, 돌발 변수 대처를 중심으로 현장에서 직접 뛰는 실행력을 부각한다.
구조: 소제목 → 현장 문제 상황 → 지원자의 구체적 대응 → 입사 후 기여

버전 나 - 기술 분석형: CPM, BIM, Con-Tech 등 데이터·기술 기반으로 리스크를 사전 차단하고 공정을 최적화하는 역량을 부각한다.
구조: 소제목 → 기술적 문제 정의 → 지원자의 분석·적용 과정 → 정량 성과 및 입사 포부

[출력 형식]
버전 가
[소제목]
(본문)
---OPTION_BOUNDARY---
버전 나
[소제목]
(본문)`;

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 대한민국 1군 건설사(현대건설, 삼성물산, GS건설 등)에서 15년간 채용을 총괄한 커리어 코치다.

[언어 규칙 - 절대 준수]
- 출력은 반드시 100% 순한국어로 작성한다. 한자, 일본어, 일반 영어 단어 혼용 금지.
- 건설·엔지니어링 전문 약어(TBM, CPM, BIM, Con-Tech)만 예외적으로 영문 허용.

[작성 원칙]
- "열정", "최선", "노력", "성실" 같은 진부한 추상어 사용 금지.
- 지원자의 실제 행동과 수치로 역량을 증명한다.
- 구분선(---OPTION_BOUNDARY---)을 정확히 삽입하여 파싱 오류를 방지한다.

[고품질 출력 예시 - 이 수준과 문체를 유지할 것]
버전 가
[현장의 변수를 공정으로 묶다]
아파트 신축 현장에서 철근 배근 간격 오차를 도면과 대조해 직접 검수하며, 하루 평균 3건의 시공 오류를 사전에 차단했습니다. TBM 시간에 당일 공정 리스크를 협력사와 공유하고, 자재 반입 지연 상황에서는 공종 순서를 조정해 공기 지연 없이 마감했습니다. 현장에서 쌓은 이 조율 경험을 바탕으로, 입사 후에는 협력사와의 신뢰를 기반으로 공정 정상화를 주도하는 현장 관리자가 되겠습니다.
---OPTION_BOUNDARY---
버전 나
[데이터로 리스크를 설계 단계에서 차단하다]
BIM 기반 설계 프로젝트에서 Revit 통합 모델링을 주도하며 에너지 시뮬레이션을 통해 열손실을 기존 대비 15% 절감하는 대안을 도출했습니다. 간섭 체크를 통해 시공 단계의 재작업 요인을 사전에 제거하고, CPM 일정 분석으로 주공정 작업에 자원을 집중 배분했습니다. 입사 후에는 스마트 건설 기술을 활용해 공정 최적화와 원가 절감을 동시에 실현하는 엔지니어로 기여하겠습니다.`
          },
          { role: "user", content: prompt }
        ],
      });

      const sanitize = (text: string) =>
        text
          .replace(/[\u3040-\u309F]+/g, "")        // 히라가나 제거
          .replace(/[\u30A0-\u30FF]+/g, "")        // 가타카나 제거
          .replace(/[\u4E00-\u9FFF]+/g, "")        // 한자 제거
          .replace(/[ \t]{2,}/g, " ")              // 가로 공백 정리 (줄바꿈 유지)
          .replace(/\n[ \t]+/g, "\n")              // 줄 시작 공백 정리
          .trim();

      const fullText = sanitize((result.choices[0].message.content as string) || "");
      const parts = fullText.split("---OPTION_BOUNDARY---");

      return {
        draft: parts[0]?.trim() || "초안 생성 실패",
        draft2: (parts[1] || parts[0])?.trim() || ""
      };
    }),
    refineForCompany: protectedProcedure.input(z.object({
      masterContent: z.string(),
      company: z.string().optional().default("건설사"),
      position: z.string().optional().default("시공/설계"),
      companyDescription: z.string().optional().default(""),
      companyKeywords: z.string().optional().default(""),
    })).mutation(async ({ input }) => {
      const companyContext = (input.companyDescription || input.companyKeywords)
        ? `\n[지원 기업 참고 정보 - 직접 인용 금지, 배경 이해용으로만 활용]\n- 기업 특성: ${input.companyDescription}\n- 인재상/핵심 가치: ${input.companyKeywords}`
        : "";

      const prompt = `[마스터 자소서 초안]
${input.masterContent}

[지원 기업/직무]
- 기업: ${input.company}
- 직무: ${input.position}
${companyContext}

[작성 지침]
위 마스터 초안을 기반으로, ${input.company} ${input.position} 직무에 최적화된 맞춤형 자기소개서를 작성하라.
- 지원자의 실제 경험과 행동은 그대로 유지하되, 이 기업/직무에서 더 강조되어야 할 역량을 부각하라.
- 기업 소개 문구나 슬로건을 그대로 옮겨 쓰지 말고, 지원자의 행동으로 간접 증명하라.
- 500자 내외로 완성하라.

[출력 형식]
[소제목]
(본문)`;

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `당신은 대한민국 1군 건설사(현대건설, 삼성물산, GS건설 등)에서 15년간 채용을 총괄한 커리어 코치다.

[언어 규칙 - 절대 준수]
- 출력은 반드시 100% 순한국어로 작성한다. 한자, 일본어, 일반 영어 단어 혼용 금지.
- 건설·엔지니어링 전문 약어(TBM, CPM, BIM, Con-Tech)만 예외적으로 영문 허용.

[작성 원칙]
- "열정", "최선", "노력", "성실" 같은 진부한 추상어 사용 금지.
- 지원자의 실제 행동과 수치로 역량을 증명한다.`
          },
          { role: "user", content: prompt }
        ],
      });

      const sanitize = (text: string) =>
        text
          .replace(/[\u3040-\u309F]+/g, "")
          .replace(/[\u30A0-\u30FF]+/g, "")
          .replace(/[\u4E00-\u9FFF]+/g, "")
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\n[ \t]+/g, "\n")
          .trim();

      const refined = sanitize((result.choices[0].message.content as string) || "");
      return { refined: refined || "초안 수정 실패" };
    }),
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
    search: publicProcedure.input(z.object({ query: z.string() })).query(({ input }) => searchCompanies(input.query)),
    coverLetters: protectedProcedure.input(z.object({ companyName: z.string() })).query(({ ctx, input }) => getCoverLettersByCompany(ctx.user.id, input.companyName)),
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
