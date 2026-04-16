import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeftIcon,
  SaveIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircle2Icon,
  SparklesIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  BriefcaseIcon,
  FileTextIcon,
  FileIcon,
  ArrowRightIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { exportDocx, exportPdf } from "@/lib/exportCoverLetter";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  id?: number;
}

// 마스터 모드: 3단계
type MasterStep = 1 | 2 | 3;
// 기업별 모드: 2단계
type CompanyStep = 1 | 2;

interface Experience {
  id: string;
  type: "intern" | "project" | "activity" | "other";
  title: string;
  period: string;
  role: string;
  keyAction: string;
  result: string;
  learned: string;
  s?: string;
  t?: string;
  a?: string;
  r?: string;
}

const EXPERIENCE_GUIDES = {
  intern: {
    title: "인턴/현장실습",
    questions: [
      "담당했던 공종이나 공정은 무엇이었나요?",
      "현장 대리인이나 사수로부터 배운 실무 노하우는?",
      "안전 관리나 도면 검토 시 본인만의 꼼꼼함이 발휘된 사례는?",
    ],
    samples: {
      title: "OO건설 현장실습 (아파트 신축 현장)",
      period: "2025.01 - 2025.02",
      s: "2025년 겨울, OO건설 현장실습생으로 참여하여 아파트 신축 공사 현장에 배치되었습니다.",
      t: "매일 아침 안전 점검과 공정 기록을 보조하며, 현장 관리 프로세스를 익히는 과제를 맡았습니다.",
      a: "도면과 실제 시공 현장을 대조하며 오차를 체크했고, 특히 철근 배근 간격을 꼼꼼히 검수하여 보고서로 작성했습니다.",
      r: "사수로부터 '신입답지 않은 꼼꼼함'이라는 칭찬을 들었으며, 실무 도면 해석 능력이 크게 향상되었습니다.",
    },
  },
  project: {
    title: "프로젝트/공모전",
    questions: [
      "본인이 담당한 설계/해석 파트는 어디였나요?",
      "협업 과정에서 발생한 의견 충돌과 해결 과정은?",
      "BIM이나 특정 툴을 활용해 효율을 높인 경험은?",
    ],
    samples: {
      title: "BIM 기반 친환경 건축물 설계 프로젝트",
      period: "2024.09 - 2024.12",
      s: "대학교 4학년 전공 종합설계 과목에서 BIM 기반 친환경 건축물 설계 프로젝트를 수행했습니다.",
      t: "팀장으로서 5명의 팀원을 조율하며, 제한된 시간 내에 최적의 단열 성능과 공간 효율을 확보하는 모델을 설계해야 했습니다.",
      a: "Revit을 활용해 건물 통합 모델링을 진행했고, 에너지 시뮬레이션을 통해 기존 대비 열손실을 15% 줄이는 대안을 도출했습니다.",
      r: "교내 캡스톤 경진대회에서 금상을 수상했으며, 협업 과정에서의 갈등 해결 능력을 길렀습니다.",
    },
  },
  activity: {
    title: "대외활동/봉사/군대",
    questions: [
      "단체 생활에서 본인만의 역할을 충실히 수행한 경험은?",
      "열악한 환경이나 반복되는 일상을 견뎌낸 본인만의 끈기는?",
      "다양한 사람들과 소통하며 마찰을 줄이기 위해 노력한 점은?",
    ],
    samples: {
      title: "해비타트 사랑의 집짓기 봉사활동",
      period: "2023.07 - 2023.08",
      s: "대학 재학 중 해비타트 집짓기 봉사활동에 참여하여 2주간 현장 보조로 활동했습니다.",
      t: "전문 기술이 부족한 상태에서 현장의 잡무를 완벽히 수행하고 팀의 사기를 진작시키는 역할을 맡았습니다.",
      a: "무더운 날씨에도 불구하고 솔선수범하여 자재를 운반했고, 팀원들의 컨디션을 체크하며 소통 창구 역할을 했습니다.",
      r: "예정된 공기보다 2일 앞당겨 공사를 마칠 수 있었고, 단체 생활에서의 끈기와 배려를 몸소 배웠습니다.",
    },
  },
  other: {
    title: "아르바이트/일상/과제",
    questions: [
      "전공 수업 중 가장 공들여서 수행했던 리포트나 과제는?",
      "아르바이트를 하며 책임감을 가지고 끝까지 일을 완수한 사례는?",
      "특별한 스펙은 아니더라도 본인의 '성실함'을 증명할 수 있는 습관은?",
    ],
    samples: {
      title: "편의점 주말 야간 아르바이트 (1년)",
      period: "2022.03 - 2023.02",
      s: "대학가 근처 편의점에서 1년간 주말 야간 아르바이트를 하며 매장 관리를 책임졌습니다.",
      t: "물류 입고 시간이 겹쳐 업무량이 많았음에도, 재고 관리의 정확성을 높여야 하는 상황이었습니다.",
      a: "품목별 위치를 최적화한 체크리스트를 만들어 재고 실사 시간을 단축시켰고, 고객 응대 매뉴얼을 스스로 만들어 지켰습니다.",
      r: "성실함을 인정받아 '우수 스태프'로 선정되었고, 1년 내내 단 한 번의 지각이나 결근 없이 성실하게 근무했습니다.",
    },
  },
};

export default function CoverLetterEditor({ id: _unusedId }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // 마스터/기업별 공통 단계 (마스터=1~3, 기업=1~2)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{
    id: number;
    name: string;
    description?: string | null;
    keywords?: string | null;
    sector: string;
  } | null>(null);

  // 마스터 초안 생성 결과
  const [aiDrafts, setAiDrafts] = useState<{ a: string; b: string } | null>(null);
  const [activeDraftTab, setActiveDraftTab] = useState<"a" | "b">("a");

  // 기업별 2차 수정 결과
  const [refinedDraft, setRefinedDraft] = useState<string | null>(null);

  // 마스터 완성 후 기업별 자소서 유도 팝업
  const [showCompanyPrompt, setShowCompanyPrompt] = useState(false);
  const [promptCompanySearch, setPromptCompanySearch] = useState("");
  const [promptSelectedCompany, setPromptSelectedCompany] = useState<{ id: number; name: string } | null>(null);

  const targetId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("id");
    return raw ? parseInt(raw, 10) : null;
  }, []);

  const isMasterMode = !targetId;

  const { data: companySearchResults } = trpc.company.search.useQuery(
    { query: companySearch },
    { enabled: companySearch.length >= 1, staleTime: 10000 }
  );

  const { data: allCompanies } = trpc.company.list.useQuery(undefined, {
    staleTime: 60000,
    enabled: !isMasterMode && currentStep === 1,
  });

  const displayedCompanies =
    companySearch.length >= 1 ? (companySearchResults ?? []) : (allCompanies ?? []);

  // 팝업용 기업 검색
  const { data: promptCompanyResults } = trpc.company.search.useQuery(
    { query: promptCompanySearch },
    { enabled: promptCompanySearch.length >= 1, staleTime: 10000 }
  );
  const { data: promptAllCompanies } = trpc.company.list.useQuery(undefined, {
    staleTime: 60000,
    enabled: showCompanyPrompt,
  });
  const promptDisplayedCompanies =
    promptCompanySearch.length >= 1 ? (promptCompanyResults ?? []) : (promptAllCompanies ?? []);

  const [form, setForm] = useState({
    title: "",
    company: "",
    position: "",
    content: "",
    status: "draft" as "draft" | "completed" | "submitted",
    major: "",
    gpa: "",
    certifications: "",
    experience: "[]",
    activities: "",
    majorCourses: "",
    keywords: "",
    keyStory: "",
  });

  const { data: master, isLoading: isMasterLoading, isError: isMasterError } =
    trpc.coverLetter.getMaster.useQuery(undefined, {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    });

  const { data: targetCoverLetter } = trpc.coverLetter.get.useQuery(
    { id: targetId ?? 0 },
    { enabled: !!targetId, refetchOnWindowFocus: false, staleTime: 30000 }
  );

  // 기업별 자소서 열 때 기업 자동 매칭
  const { data: autoCompanyResult } = trpc.company.search.useQuery(
    { query: targetCoverLetter?.company ?? "" },
    { enabled: !!targetCoverLetter?.company && !selectedCompany, staleTime: 30000 }
  );

  useEffect(() => {
    if (autoCompanyResult && autoCompanyResult.length > 0 && !selectedCompany && targetCoverLetter?.company) {
      const match =
        autoCompanyResult.find((c: any) => c.name === targetCoverLetter.company) ??
        autoCompanyResult[0];
      setSelectedCompany(match as any);
    }
  }, [autoCompanyResult, targetCoverLetter?.company]);

  // 서버 데이터 폼 초기화
  useEffect(() => {
    const source = targetId ? targetCoverLetter : master;
    if (!source || isInitialized) return;
    if (targetId && !targetCoverLetter) return;
    try {
      setForm({
        title: source.title || "자소서",
        company: source.company || "",
        position: source.position || "",
        content: source.content || "",
        status: (source.status as any) || "draft",
        major: (source as any).major || "",
        gpa: (source as any).gpa || "",
        certifications: (source as any).certifications || "",
        experience: (source as any).experience || "[]",
        activities: (source as any).activities || "",
        majorCourses: (source as any).majorCourses || "",
        keywords: (source as any).keywords || "",
        keyStory: (source as any).keyStory || "",
      });
      setIsInitialized(true);
    } catch {
      setIsInitialized(true);
    }
  }, [master, targetCoverLetter, isInitialized, targetId]);

  const updateMutation = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      utils.coverLetter.getMaster.setData(undefined, (old: any) => ({ ...old, ...form }));
    },
  });

  const deleteMutation = trpc.coverLetter.delete.useMutation({
    onSuccess: () => {
      toast.success("자소서가 삭제되었습니다.");
      utils.coverLetter.listBrief.invalidate();
      navigate("/dashboard");
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  // 자동 저장 (5초 디바운스)
  useEffect(() => {
    const saveId = targetId ?? master?.id;
    if (!saveId || !isInitialized) return;
    const timer = setTimeout(() => {
      updateMutation.mutate({ id: saveId, ...form });
    }, 5000);
    return () => clearTimeout(timer);
  }, [form, master?.id, targetId, isInitialized]);

  const addExperience = useCallback((type: Experience["type"]) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newExp: Experience = {
      id: newId,
      type,
      title: "",
      period: "",
      role: "",
      keyAction: "",
      result: "",
      learned: "",
      s: "",
      t: "",
      a: "",
      r: "",
    };
    setForm((prev) => {
      const currentExps = JSON.parse(prev.experience || "[]");
      return { ...prev, experience: JSON.stringify([...currentExps, newExp]) };
    });
    setSelectedExpId(newId);
    toast.success(`${EXPERIENCE_GUIDES[type].title} 항목이 추가되었습니다.`);
  }, []);

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    const newExperiences = experiences.map((exp) =>
      exp.id === id ? { ...exp, ...updates } : exp
    );
    setForm((prev) => ({ ...prev, experience: JSON.stringify(newExperiences) }));
  };

  const removeExperience = (id: string) => {
    const newExperiences = experiences.filter((exp) => exp.id !== id);
    setForm((prev) => ({ ...prev, experience: JSON.stringify(newExperiences) }));
    if (selectedExpId === id) setSelectedExpId(null);
  };

  const handleStarChange = (expId: string, key: "s" | "t" | "a" | "r", value: string) => {
    updateExperience(expId, { [key]: value });
  };

  const experiences: Experience[] = useMemo(() => {
    try {
      if (!form.experience) return [];
      if (Array.isArray(form.experience)) return form.experience;
      const parsed = JSON.parse(form.experience);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [form.experience]);

  // 마스터 초안 생성 (기업 무관)
  const generateDraftMutation = trpc.coverLetter.generateDraft.useMutation({
    onSuccess: (data) => {
      setAiDrafts({ a: data.draft, b: data.draft2 });
      toast.success("2가지 버전의 AI 초안이 생성되었습니다!");
    },
    onError: (err: any) => toast.error(`초안 생성 실패: ${err.message}`),
  });

  // 기업별 2차 수정
  const refineForCompanyMutation = trpc.coverLetter.refineForCompany.useMutation({
    onSuccess: (data) => {
      setRefinedDraft(data.refined);
      toast.success("기업 맞춤 초안이 생성되었습니다!");
    },
    onError: (err: any) => toast.error(`2차 수정 실패: ${err.message}`),
  });

  const handleGenerateMasterDraft = () => {
    const starStories = experiences
      .map((exp) => {
        if (!exp.title && !exp.s && !exp.t && !exp.a && !exp.r) return null;
        return `[${exp.title || "경험"}]\n- 상황: ${exp.s || ""}\n- 과제: ${exp.t || ""}\n- 행동: ${exp.a || ""}\n- 결과: ${exp.r || ""}`;
      })
      .filter(Boolean)
      .join("\n\n");

    generateDraftMutation.mutate({
      ...form,
      keyStory: starStories || form.keyStory || "제공된 상세 경험 스토리 없음",
      company: "",
      companyDescription: "",
      companyKeywords: "",
    });
  };

  const applyMasterDraft = (content: string) => {
    setForm((prev) => ({ ...prev, content }));
    toast.success("선택한 초안이 에디터에 적용되었습니다.");
  };

  const handleRefineForCompany = () => {
    refineForCompanyMutation.mutate({
      masterContent: form.content,
      company: form.company,
      position: form.position,
      companyDescription: selectedCompany?.description ?? "",
      companyKeywords: selectedCompany?.keywords ?? "",
    });
  };

  const applyRefinedDraft = () => {
    if (!refinedDraft) return;
    setForm((prev) => ({ ...prev, content: refinedDraft }));
    toast.success("기업 맞춤 초안이 에디터에 적용되었습니다.");
  };

  const cloneMutation = trpc.coverLetter.clone.useMutation({
    onSuccess: (data) => {
      utils.coverLetter.listBrief.invalidate();
      setShowCompanyPrompt(false);
      navigate(`/cover-letter-editor?id=${data.id}`);
      toast.success(`${data.company} 맞춤 자소서가 생성되었습니다.`);
    },
    onError: () => toast.error("기업별 자소서 생성에 실패했습니다."),
  });

  const handleSaveAndExit = () => {
    const saveId = targetId ?? master?.id;
    if (saveId) updateMutation.mutate({ id: saveId, ...form });
    // 마스터 최종 단계 완료 시 → 기업별 자소서 유도 팝업
    if (isMasterMode && currentStep === maxStep) {
      setShowCompanyPrompt(true);
      return;
    }
    navigate(isMasterMode ? "/dashboard" : "/my-cover-letters");
  };

  const handlePromptConfirm = () => {
    if (!master?.id) return;
    const companyName = promptSelectedCompany?.name || promptCompanySearch.trim();
    if (!companyName) {
      toast.error("기업명을 입력하거나 선택해 주세요.");
      return;
    }
    cloneMutation.mutate({ masterId: master.id, companyName });
  };

  const handleExport = async (format: "docx" | "pdf") => {
    if (!form.content.trim()) {
      toast.error("내보낼 내용이 없습니다. 먼저 초안을 작성해 주세요.");
      return;
    }
    const options = {
      title: form.title || "자소서",
      company: form.company || undefined,
      position: form.position || undefined,
      content: form.content,
    };
    try {
      if (format === "docx") {
        await exportDocx(options);
        toast.success("Word 파일(.docx)로 저장되었습니다.");
      } else {
        exportPdf(options);
        toast.success("인쇄 창에서 'PDF로 저장'을 선택해 주세요.");
      }
    } catch {
      toast.error("내보내기에 실패했습니다.");
    }
  };

  // 단계 정의
  const masterSteps = [
    { id: 1, title: "경험 정리" },
    { id: 2, title: "스토리 기술" },
    { id: 3, title: "초안 완성" },
  ];
  const companySteps = [
    { id: 1, title: "기업 설정" },
    { id: 2, title: "2차 맞춤 수정" },
  ];
  const steps = isMasterMode ? masterSteps : companySteps;
  const maxStep = steps.length;

  if (isMasterLoading || (targetId && !isInitialized)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse font-medium">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isMasterError || (!isMasterLoading && !master)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <XIcon className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">불러오기 실패</h2>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl px-8 h-12 font-bold">다시 시도</Button>
          <Button onClick={() => navigate("/login")} className="rounded-xl px-8 h-12 font-bold">로그인 페이지로</Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen text-left bg-slate-50/30">
      {/* 고밀도 Bento 헤더 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(isMasterMode ? "/dashboard" : "/my-cover-letters")}
              className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900 border border-slate-100"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isMasterMode ? "마스터 자소서" : "기업별 맞춤 작성"}
                </h1>
                {updateMutation.isPending && (
                  <Badge variant="secondary" className="animate-pulse bg-indigo-50 text-indigo-600 border-none text-[10px] font-bold">저장 중</Badge>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5 font-medium">
                {isMasterMode
                  ? "경험과 스토리를 정리하고 초안을 완성하세요."
                  : `${targetCoverLetter?.company || "기업"} 맞춤형 2차 수정 중`}
              </p>
            </div>
          </div>

          {!isMasterMode && (
            <div className="flex items-center gap-4 p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <BriefcaseIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-slate-900 truncate">
                  {targetCoverLetter?.company || "자소서"}
                </h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{targetCoverLetter?.position || "직무 미지정"}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("이 자소서를 삭제하시겠습니까?"))
                    deleteMutation.mutate({ id: targetId! });
                }}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-4 bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Progress Steps</p>
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setCurrentStep(s.id)}
                  className="flex flex-col items-center gap-2 group outline-none"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                    currentStep === s.id
                      ? "border-emerald-500 bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 scale-105"
                      : currentStep > s.id
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                      : "border-white/10 text-white/30 group-hover:border-white/30"
                  )}>
                    {currentStep > s.id ? <CheckCircle2Icon className="w-5 h-5" /> : <span className="text-xs font-black">{s.id}</span>}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors",
                    currentStep === s.id ? "text-emerald-400" : "text-white/40 group-hover:text-white/60"
                  )}>
                    {s.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    "h-px flex-1 mx-2 transition-colors",
                    currentStep > s.id ? "bg-emerald-500/50" : "bg-white/10"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="w-full border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white min-h-[600px] flex flex-col relative">

          {/* ===== 마스터 Step 1: 경험 정리 ===== */}
          {isMasterMode && currentStep === 1 && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2Icon className="w-3 h-3" />Step 01. Portfolio
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">보유 역량 및 경험 집대성</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => addExperience("intern")} className="rounded-xl border-slate-200 h-10 text-xs font-bold gap-2 bg-white">
                    <PlusIcon className="w-3.5 h-3.5" />인턴 추가
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addExperience("project")} className="rounded-xl border-slate-200 h-10 text-xs font-bold gap-2 bg-white">
                    <PlusIcon className="w-3.5 h-3.5" />프로젝트 추가
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addExperience("activity")} className="rounded-xl border-slate-200 h-10 text-xs font-bold gap-2 bg-white">
                    <PlusIcon className="w-3.5 h-3.5" />기타활동 추가
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-10 overflow-y-auto max-h-[calc(100vh-400px)]">
                {/* 기본 정보 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-3 bg-slate-300 rounded-full" />기본 학력 및 자격
                    </h4>
                  </div>
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">전공</Label>
                    <Input
                      placeholder="예: 건축공학"
                      value={form.major}
                      onChange={(e) => setForm({ ...form, major: e.target.value })}
                      className="rounded-xl h-12 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 px-4 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">학점</Label>
                    <Input
                      placeholder="4.5"
                      value={form.gpa}
                      onChange={(e) => setForm({ ...form, gpa: e.target.value.replace(/[^0-9.]/g, "") })}
                      className="rounded-xl h-12 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 text-center text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">자격증 / 어학</Label>
                    <Input
                      placeholder="예: 건축기사, 토익 900"
                      value={form.certifications}
                      onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      className="rounded-xl h-12 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 px-4 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">전공 심화 및 직무 프로젝트</Label>
                    <textarea
                      placeholder="수업 중 수행한 설계 프로젝트나 직무와 직결되는 성과를 적어주세요."
                      value={form.majorCourses}
                      onChange={(e) => setForm({ ...form, majorCourses: e.target.value })}
                      className="w-full min-h-[80px] rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 p-4 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 경험 상세 그리드 */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />상세 경험 스토리보드
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {experiences.length === 0 ? (
                      <div className="md:col-span-2 py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <SparklesIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">아직 등록된 경험이 없습니다.<br/>상단의 버튼을 눌러 경험을 추가하세요.</p>
                      </div>
                    ) : (
                      experiences.map((exp) => (
                        <div key={exp.id} className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 transition-all hover:shadow-md relative">
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2Icon className="w-3.5 h-3.5" />
                          </button>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Badge className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border-none",
                                exp.type === "intern" ? "bg-emerald-100 text-emerald-700"
                                  : exp.type === "project" ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                              )}>
                                {EXPERIENCE_GUIDES[exp.type].title}
                              </Badge>
                              <Input
                                placeholder={EXPERIENCE_GUIDES[exp.type].samples.title}
                                value={exp.title}
                                onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                                className="bg-transparent border-none text-base font-black p-0 h-auto focus:ring-0 flex-1 truncate pr-8"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Action</Label>
                                <textarea
                                  placeholder="어떤 역할을 수행했나요?"
                                  value={exp.keyAction}
                                  onChange={(e) => updateExperience(exp.id, { keyAction: e.target.value })}
                                  className="w-full min-h-[60px] bg-slate-100 border-none rounded-lg p-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500/20"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Result</Label>
                                <textarea
                                  placeholder="어떤 성과를 얻었나요?"
                                  value={exp.result}
                                  onChange={(e) => updateExperience(exp.id, { result: e.target.value })}
                                  className="w-full min-h-[60px] bg-slate-100 border-none rounded-lg p-3 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== 마스터 Step 2: 스토리 기술 (STAR) ===== */}
          {isMasterMode && currentStep === 2 && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    <SparklesIcon className="w-3 h-3" />Step 02. STAR Storytelling
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">경험의 구체화 및 입체적 기술</h3>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                <div className="w-full lg:w-72 bg-slate-50/30 overflow-y-auto max-h-[calc(100vh-450px)]">
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">경험 리스트</p>
                    {experiences.length === 0 ? (
                      <p className="text-[11px] text-slate-400 p-4 text-center italic">Step 1에서 경험을 추가하세요.</p>
                    ) : (
                      experiences.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => setSelectedExpId(exp.id)}
                          className={cn(
                            "w-full p-4 rounded-xl text-left transition-all relative border flex flex-col gap-1",
                            selectedExpId === exp.id
                              ? "border-indigo-500 bg-white shadow-sm ring-1 ring-indigo-500/10"
                              : "border-transparent hover:bg-slate-100/50"
                          )}
                        >
                          <Badge className={cn("w-fit px-1.5 py-0 rounded text-[8px] font-black border-none", 
                            exp.type === "intern" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                            {EXPERIENCE_GUIDES[exp.type].title}
                          </Badge>
                          <p className="text-xs font-black text-slate-900 truncate">{exp.title || "제목 없음"}</p>
                          <div className="flex gap-1 mt-1">
                            {["s", "t", "a", "r"].map((k) => (
                              <div key={k} className={cn("w-1 h-1 rounded-full", (exp as any)[k] ? "bg-emerald-500" : "bg-slate-200")} />
                            ))}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 p-8 bg-white overflow-y-auto max-h-[calc(100vh-450px)]">
                  {selectedExpId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: "s", label: "S", title: "Situation", hint: "언제 어디서?", placeholder: "상황 배경 설명..." },
                        { id: "t", label: "T", title: "Task", hint: "당면 과제", placeholder: "내가 해결해야 했던 문제..." },
                        { id: "a", label: "A", title: "Action", hint: "수행 행동", placeholder: "구체적으로 어떻게 조치했나? (역량 강조)..." },
                        { id: "r", label: "R", title: "Result", hint: "결과 및 교훈", placeholder: "성과와 배운 점..." },
                      ].map((item) => {
                        const currentExp = experiences.find((e) => e.id === selectedExpId);
                        return (
                          <div key={item.id} className="p-5 rounded-2xl bg-slate-100 border border-transparent focus-within:bg-white focus-within:border-indigo-200 transition-all shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">{item.label}</span>
                                <span className="font-black text-slate-900 text-xs">{item.title}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{item.hint}</span>
                            </div>
                            <textarea
                              className="w-full min-h-[120px] bg-transparent border-none outline-none text-sm text-slate-900 resize-none leading-relaxed placeholder:text-slate-300"
                              placeholder={item.placeholder}
                              value={(currentExp as any)?.[item.id] || ""}
                              onChange={(e) => handleStarChange(selectedExpId, item.id as any, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                        <ChevronLeftIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">경험을 선택하세요</h3>
                      <p className="text-xs text-slate-500">좌측 리스트에서 구체화할 항목을 클릭하세요.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== 마스터 Step 3: 초안 완성 ===== */}
          {isMasterMode && currentStep === 3 && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    <SparklesIcon className="w-3 h-3" />Step 03. Master Draft
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">마스터 자소서 통합 에디터</h3>
                </div>
                <Button
                  onClick={handleGenerateMasterDraft}
                  disabled={generateDraftMutation.isPending}
                  className="gap-2 bg-slate-900 hover:bg-black text-white rounded-xl h-12 px-6 font-black shadow-lg transition-all active:scale-95"
                >
                  {generateDraftMutation.isPending ? "AI 생성 중..." : "AI 초안 생성"}
                </Button>
              </div>

              <div className="flex-1 flex flex-col p-8 overflow-y-auto max-h-[calc(100vh-400px)]">
                {aiDrafts && (
                  <div className="mb-6 space-y-4 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 p-1 bg-white/50 rounded-lg">
                        <button onClick={() => setActiveDraftTab("a")} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black transition-all", activeDraftTab === "a" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}>버전 A</button>
                        <button onClick={() => setActiveDraftTab("b")} className={cn("px-4 py-1.5 rounded-md text-[10px] font-black transition-all", activeDraftTab === "b" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}>버전 B</button>
                      </div>
                      <Button size="sm" onClick={() => applyMasterDraft(activeDraftTab === "a" ? aiDrafts.a : aiDrafts.b)} className="h-8 bg-indigo-600 text-white rounded-lg text-[10px] font-black">이 초안 사용</Button>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium max-h-[200px] overflow-y-auto pr-4">
                      {activeDraftTab === "a" ? aiDrafts.a : aiDrafts.b}
                    </div>
                  </div>
                )}

                <div className="flex-1 relative">
                  <textarea
                    className="w-full min-h-[400px] p-8 text-lg bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all leading-relaxed font-medium text-slate-900"
                    placeholder="여기에 직접 작성하거나 AI 초안을 적용하세요..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                  {generateDraftMutation.isPending && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== 기업별 Step 1: 기업 설정 ===== */}
          {!isMasterMode && currentStep === 1 && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Step 01. Target Settings</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">지원할 기업과 직무를 확정하세요.</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 overflow-y-auto max-h-[calc(100vh-400px)]">
                <div className="md:col-span-12 space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">관리 제목</Label>
                  <Input
                    placeholder="예: 2026 현대건설 플랜트 시공"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="rounded-xl h-14 bg-slate-100 border-none px-5 text-lg font-black"
                  />
                </div>

                <div className="md:col-span-7 space-y-4">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">지원 기업 검색</Label>
                  {selectedCompany ? (
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-base">{selectedCompany.name}</p>
                        <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{selectedCompany.sector}</p>
                      </div>
                      <button onClick={() => { setSelectedCompany(null); setCompanySearch(""); }} className="p-2 text-slate-300 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="기업명을 입력하세요"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        className="rounded-xl h-12 bg-slate-100 border-none"
                      />
                      <div className="bg-white border border-slate-100 rounded-xl max-h-48 overflow-y-auto shadow-inner">
                        {displayedCompanies.map((c) => (
                          <button key={c.id} onClick={() => { setSelectedCompany(c as any); setForm({ ...form, company: c.name }); }} className="w-full px-4 py-3 hover:bg-slate-50 text-left text-sm font-bold border-b last:border-none flex items-center justify-between">
                            {c.name} <ChevronRightIcon className="w-3 h-3 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-5 space-y-4">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">지원 직무</Label>
                  <Input
                    placeholder="예: 토목 시공"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="rounded-xl h-14 bg-slate-100 border-none px-5 text-base font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== 기업별 Step 2: 2차 맞춤 수정 ===== */}
          {!isMasterMode && currentStep === 2 && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Step 02. Personalization</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium"><span className="text-emerald-600 font-black">{form.company}</span>에 최적화된 문장으로 고도화합니다.</p>
                </div>
                <Button
                  onClick={handleRefineForCompany}
                  disabled={refineForCompanyMutation.isPending || !form.content.trim()}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-black shadow-lg"
                >
                  {refineForCompanyMutation.isPending ? "맞춤 수정 중..." : "AI 기업 맞춤 수정"}
                </Button>
              </div>

              <div className="flex-1 flex flex-col p-8 overflow-y-auto max-h-[calc(100vh-400px)]">
                {refinedDraft && (
                  <div className="mb-6 bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100 relative">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-3">AI Personalization Result</p>
                    <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium max-h-[150px] overflow-y-auto mb-4">
                      {refinedDraft}
                    </div>
                    <Button size="sm" onClick={applyRefinedDraft} className="bg-emerald-600 text-white rounded-lg text-[10px] font-black h-8 px-4">에디터에 적용</Button>
                  </div>
                )}

                <div className="flex-1 relative">
                  <textarea
                    className="w-full min-h-[400px] p-8 text-lg bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all leading-relaxed font-medium text-slate-900"
                    placeholder="마스터 내용을 기반으로 기업에 맞게 수정하세요..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 하단 통합 액션 바 */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? () => navigate(isMasterMode ? "/dashboard" : "/my-cover-letters") : () => setCurrentStep((prev) => prev - 1)}
              className="gap-2 text-slate-500 hover:text-slate-900 font-bold"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              {currentStep === 1 ? "취소 및 나가기" : "이전"}
            </Button>
            <div className="flex items-center gap-3">
              {currentStep < maxStep ? (
                <Button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="gap-2 px-8 h-12 rounded-xl bg-slate-900 text-white font-black hover:bg-black shadow-lg"
                >
                  다음 단계 <ChevronRightIcon className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  {/* 내보내기 버튼 — 최종 단계에서만 노출 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExport("docx")}
                      disabled={!form.content.trim()}
                      className="gap-2 px-5 h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
                      title="Word 파일로 내보내기"
                    >
                      <FileTextIcon className="w-4 h-4" />
                      DOCX
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport("pdf")}
                      disabled={!form.content.trim()}
                      className="gap-2 px-5 h-12 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
                      title="PDF로 내보내기"
                    >
                      <FileIcon className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <Button
                    onClick={handleSaveAndExit}
                    className="gap-2 px-10 h-12 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
                  >
                    <SaveIcon className="w-4 h-4" />최종 저장
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>

    {/* 마스터 완성 후 기업별 자소서 유도 팝업 */}
    <Dialog open={showCompanyPrompt} onOpenChange={(open) => {
      setShowCompanyPrompt(open);
    }}>
      <DialogContent className="max-w-lg rounded-[2rem] p-0 overflow-hidden">
        {/* 상단 헤더 */}
        <div className="bg-indigo-600 px-8 py-7">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-6 h-6 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">
              마스터 자소서 완성을 축하합니다!
            </DialogTitle>
            <DialogDescription className="text-indigo-200 font-medium mt-1">
              이제 지원할 기업을 선택하면 맞춤형 자소서를 바로 시작할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* 기업 선택 영역 */}
        <div className="px-8 py-6 space-y-4">
          {promptSelectedCompany ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-300">
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-lg">{promptSelectedCompany.name}</p>
              </div>
              <button
                onClick={() => { setPromptSelectedCompany(null); setPromptCompanySearch(""); }}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Input
              placeholder="기업명 검색 또는 직접 입력"
              value={promptCompanySearch}
              onChange={(e) => setPromptCompanySearch(e.target.value)}
              className="rounded-xl h-12 bg-slate-50 border-slate-200 pl-5 font-bold"
              autoFocus
            />
          )}

          {!promptSelectedCompany && (
            <div className="rounded-xl border border-slate-100 overflow-hidden max-h-[220px] overflow-y-auto">
              {promptDisplayedCompanies.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400 font-medium text-center">
                  {promptCompanySearch.length >= 1 ? "검색 결과가 없습니다." : "기업명을 검색해 보세요."}
                </p>
              ) : promptDisplayedCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setPromptSelectedCompany({ id: c.id, name: c.name }); setPromptCompanySearch(""); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-indigo-50 transition-colors text-left border-b border-slate-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                    <p className="text-xs text-slate-400">{(c as any).sector}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-8 pb-7 flex gap-3">
          <Button
            variant="ghost"
            onClick={() => { setShowCompanyPrompt(false); navigate("/dashboard"); }}
            className="flex-1 h-12 rounded-xl text-slate-500 font-bold"
          >
            기업 살펴보기
          </Button>
          <Button
            onClick={handlePromptConfirm}
            disabled={cloneMutation.isPending || (!promptSelectedCompany && !promptCompanySearch.trim())}
            className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 disabled:opacity-40"
          >
            {cloneMutation.isPending ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />생성 중...</>
            ) : (
              <>맞춤 자소서 시작 <ArrowRightIcon className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );

}
