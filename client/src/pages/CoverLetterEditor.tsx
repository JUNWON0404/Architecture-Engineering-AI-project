import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  CheckCircle2Icon, 
  CopyIcon, 
  SparklesIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  DownloadIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportToWord } from "@/lib/exportUtils";

interface Props {
  id?: number;
}

type Step = 1 | 2 | 3 | 4;

interface Experience {
  id: string;
  type: "intern" | "project" | "activity" | "other";
  title: string;
  period: string;
  role: string;
  keyAction: string;
  result: string;
  learned: string;
}

const EXPERIENCE_GUIDES = {
  intern: {
    title: "인턴/현장실습",
    questions: [
      "담당했던 공종이나 공정은 무엇이었나요?",
      "현장 대리인이나 사수로부터 배운 실무 노하우는?",
      "안전 관리나 도면 검토 시 본인만의 꼼꼼함이 발휘된 사례는?"
    ]
  },
  project: {
    title: "프로젝트/공모전",
    questions: [
      "본인이 담당한 설계/해석 파트는 어디였나요?",
      "협업 과정에서 발생한 의견 충돌과 해결 과정은?",
      "BIM이나 특정 툴을 활용해 효율을 높인 경험은?"
    ]
  },
  activity: {
    title: "대외활동/봉사/군대",
    questions: [
      "단체 생활에서 본인만의 역할을 충실히 수행한 경험은?",
      "열악한 환경이나 반복되는 일상을 견뎌낸 본인만의 끈기는?",
      "다양한 사람들과 소통하며 마찰을 줄이기 위해 노력한 점은?"
    ]
  },
  other: {
    title: "아르바이트/일상/과제",
    questions: [
      "전공 수업 중 가장 공들여서 수행했던 리포트나 과제는?",
      "아르바이트를 하며 책임감을 가지고 끝까지 일을 완수한 사례는?",
      "특별한 스펙은 아니더라도 본인의 '성실함'을 증명할 수 있는 습관은?"
    ]
  }
};

export default function CoverLetterEditor({ id: _unusedId }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    company: "",
    position: "",
    content: "",
    status: "draft" as "draft" | "completed" | "submitted",
    major: "",
    gpa: "",
    certifications: "",
    languageSkills: "",
    experience: "[]",
    activities: "",
    majorCourses: "",
    keywords: "",
    keyStory: "",
  });

  const [starForm, setStarForm] = useState({
    s: "",
    t: "",
    a: "",
    r: "",
  });

  const { data: master, isLoading: isMasterLoading } = trpc.coverLetter.getMaster.useQuery();
  const { data: resumes = [] } = trpc.resume.list.useQuery();

  const experiences: Experience[] = (() => {
    try {
      return JSON.parse(form.experience || "[]");
    } catch (e) {
      return [];
    }
  })();

  const setExperiences = (exps: Experience[]) => {
    setForm(prev => ({ ...prev, experience: JSON.stringify(exps) }));
  };

  const addExperience = (type: Experience["type"]) => {
    const newExp: Experience = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: "",
      period: "",
      role: "",
      keyAction: "",
      result: "",
      learned: "",
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setExperiences(experiences.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleStarChange = (key: keyof typeof starForm, value: string) => {
    const newStarForm = { ...starForm, [key]: value };
    setStarForm(newStarForm);
    const merged = `[S] ${newStarForm.s}\n\n[T] ${newStarForm.t}\n\n[A] ${newStarForm.a}\n\n[R] ${newStarForm.r}`;
    setForm(prev => ({ ...prev, keyStory: merged }));
  };

  const updateMutation = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      utils.coverLetter.getMaster.invalidate();
    },
    onError: () => {
      toast.error("자동 저장에 실패했습니다.");
    }
  });

  useEffect(() => {
    if (master) {
      setForm({
        title: master.title,
        company: master.company ?? "",
        position: master.position ?? "",
        content: master.content ?? "",
        status: master.status as "draft" | "completed" | "submitted",
        major: (master as any).major ?? "",
        gpa: (master as any).gpa ?? "",
        certifications: (master as any).certifications ?? "",
        languageSkills: "",
        experience: (master as any).experience || "[]",
        activities: (master as any).activities ?? "",
        majorCourses: (master as any).majorCourses ?? "",
        keywords: (master as any).keywords ?? "",
        keyStory: (master as any).keyStory ?? "",
      });
    }
  }, [master]);

  useEffect(() => {
    if (!master) return;
    const timer = setTimeout(() => {
      updateMutation.mutate({ id: master.id, ...form });
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, master?.id]);

  useEffect(() => {
    if (form.keyStory && !starForm.s && !starForm.t && !starForm.a && !starForm.r) {
      const parts = form.keyStory.split("\n\n");
      setStarForm({
        s: parts[0]?.replace("[S] ", "") || "",
        t: parts[1]?.replace("[T] ", "") || "",
        a: parts[2]?.replace("[A] ", "") || "",
        r: parts[3]?.replace("[R] ", "") || "",
      });
    }
  }, [form.keyStory]);

  const nextStep = () => {
    if (master) updateMutation.mutate({ id: master.id, ...form });
    setCurrentStep((prev) => (prev + 1) as Step);
  };
  
  const prevStep = () => {
    if (master) updateMutation.mutate({ id: master.id, ...form });
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    if (master) updateMutation.mutate({ id: master.id, ...form });
  };

  const importResume = (content: string) => {
    setForm(prev => ({ ...prev, experience: content }));
    toast.success("이력서 내용을 가져왔습니다.");
  };

  if (isMasterLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const steps = [
    { id: 1, title: "경험 정리" },
    { id: 2, title: "스토리 기술" },
    { id: 3, title: "기업 설정" },
    { id: 4, title: "최종 완성" },
  ];

  return (
    <div className="p-8 md:p-12 max-w-[1400px] mx-auto min-h-screen text-left">
      <div className="max-w-5xl mx-auto w-full mb-12">
        <div className="flex items-center gap-6 mb-12">
          <button onClick={() => navigate("/dashboard")} className="p-3 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"><ArrowLeftIcon className="w-6 h-6" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-foreground tracking-tight">마스터 자소서 관리</h1>
              {updateMutation.isPending && <Badge variant="secondary" className="animate-pulse bg-indigo-50 text-indigo-600 border-none">저장 중...</Badge>}
            </div>
            <p className="text-muted-foreground text-base mt-1 font-medium">나의 모든 경험을 집대성한 단 하나의 마스터 초안</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button type="button" onClick={() => goToStep(s.id as Step)} className="flex flex-col items-center gap-3 group outline-none">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all", currentStep === s.id ? "border-primary bg-primary text-primary-foreground font-black shadow-xl shadow-primary/30 scale-110" : currentStep > s.id ? "border-primary bg-primary/10 text-primary group-hover:bg-primary/20" : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50")}>
                  {currentStep > s.id ? <CheckCircle2Icon className="w-8 h-8" /> : <span className="text-lg font-black">{s.id}</span>}
                </div>
                <span className={cn("text-sm font-bold transition-colors", currentStep === s.id ? "text-primary" : "text-muted-foreground group-hover:text-primary")}>{s.title}</span>
              </button>
              {idx < steps.length - 1 && <div className={cn("h-[3px] flex-1 mx-6 transition-colors", currentStep > s.id ? "bg-primary" : "bg-muted-foreground/20")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 justify-center items-stretch">
        <Card className="w-full max-w-5xl p-10 md:p-16 border-border/50 shadow-xl rounded-[3rem] min-h-[700px] flex flex-col bg-white shrink-0 relative z-10">
          {currentStep === 1 && (
            <div className="space-y-12 flex-1">
              <div className="space-y-4 text-center pb-10 border-b border-slate-200">
                <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 text-sm font-black uppercase tracking-widest mb-2"><CheckCircle2Icon className="w-4 h-4" />Step 1. 경험 및 역량 정리</div>
                <Label className="text-4xl md:text-5xl font-black text-slate-900 block tracking-tighter">보유하신 <span className="text-indigo-600">직무 역량</span>을 정리해 보세요</Label>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">사소한 경험이라도 유형별로 분류하여 입력해 두시면, <br /> 추후 기업별 맞춤형 자기소개서를 작성할 때 훌륭한 소스가 됩니다.</p>
              </div>

              <div className="space-y-16 max-w-4xl mx-auto">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-left"><div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg"><CheckCircle2Icon className="w-6 h-6" /></div><h3 className="text-2xl font-black text-slate-900 tracking-tight">학력 및 기본 정보</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="space-y-3"><Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">전공</Label><Input placeholder="예: 건축공학" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 pl-5 text-lg font-bold text-slate-900" /></div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">학점</Label>
                      <Input 
                        placeholder="0.0 / 4.5" 
                        value={form.gpa}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, ""); // 숫자와 점만 허용
                          setForm({ ...form, gpa: val });
                        }}
                        className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 text-center text-lg font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-3"><Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">주요 자격증 / 어학</Label><Input placeholder="예: 건축기사, 토익 900" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 pl-5 text-lg font-bold text-slate-900" /></div>
                    <div className="md:col-span-3 space-y-4">
                      <div className="flex flex-col gap-1 px-1 text-left"><Label className="text-sm font-black text-slate-500 uppercase tracking-widest">전공 프로젝트 및 직무 심화 학습</Label><p className="text-xs text-slate-400 font-medium text-left">수업 중 수행한 설계 프로젝트나 직무와 직결되는 성과를 적어주세요.</p></div>
                      <textarea placeholder="예: 건축시공학 기말 프로젝트 - 모듈러 공법의 현장 적용성 분석 및 원가 절감 방안 제시" value={form.majorCourses} onChange={(e) => setForm({ ...form, majorCourses: e.target.value })} className="w-full min-h-[120px] rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 p-6 text-lg text-slate-900 placeholder:text-slate-400 leading-relaxed outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-left"><div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg"><SparklesIcon className="w-6 h-6" /></div><h3 className="text-2xl font-black text-slate-900 tracking-tight">경력 및 활동 상세</h3></div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => addExperience("intern")} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"><PlusIcon className="w-4 h-4" />인턴 추가</Button>
                      <Button variant="outline" size="sm" onClick={() => addExperience("project")} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"><PlusIcon className="w-4 h-4" />프로젝트 추가</Button>
                      <Button variant="outline" size="sm" onClick={() => addExperience("activity")} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"><PlusIcon className="w-4 h-4" />기타활동 추가</Button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {experiences.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center gap-6 group hover:border-indigo-200 transition-colors">
                        <div className="w-20 h-20 rounded-[2rem] bg-white shadow-lg flex items-center justify-center shrink-0 border border-slate-100"><SparklesIcon className="w-8 h-8 text-indigo-500" /></div>
                        <div className="space-y-3 text-center"><p className="text-xl font-black text-slate-900">"아직 등록된 경험이 없어도 괜찮아요!"</p><p className="text-slate-600 leading-relaxed font-medium text-sm">전공 프로젝트, 아르바이트, 군 생활 등 우리 일상의 모든 '성실함'이 건설 현장에서는 강력한 무기가 됩니다.</p></div>
                      </div>
                    ) : experiences.map((exp) => (
                      <div key={exp.id} className="group relative p-8 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg text-left">
                        <button onClick={() => removeExperience(exp.id)} className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2Icon className="w-5 h-5" /></button>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          <div className="md:col-span-4 space-y-4 text-left">
                            <Badge className={cn("px-4 py-1.5 rounded-lg font-black uppercase tracking-wider", exp.type === 'intern' ? 'bg-emerald-100 text-emerald-700' : exp.type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}>{EXPERIENCE_GUIDES[exp.type].title}</Badge>
                            <Input placeholder="경험 제목" value={exp.title} onChange={(e) => updateExperience(exp.id, { title: e.target.value })} className="bg-transparent border-none text-2xl font-black p-0 h-auto focus:ring-0" />
                            <Input placeholder="기간 (예: 2025.01 - 2025.03)" value={exp.period} onChange={(e) => updateExperience(exp.id, { period: e.target.value })} className="bg-transparent border-none text-sm font-bold text-slate-500 p-0 h-auto focus:ring-0" />
                          </div>
                          <div className="md:col-span-8 space-y-6 border-l border-slate-200 pl-8">
                            <div className="space-y-3 text-left"><Label className="text-xs font-black text-slate-400 uppercase tracking-widest">심화 질문 가이드</Label><div className="bg-white/50 rounded-xl p-4 border border-slate-100"><ul className="space-y-2">{EXPERIENCE_GUIDES[exp.type].questions.map((q, i) => (<li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-emerald-500 font-bold">Q.</span> {q}</li>))}</ul></div></div>
                            <div className="grid grid-cols-1 gap-4">
                              <textarea placeholder="어떤 역할을 수행했고, 구체적으로 무엇을 했나요? (Action)" value={exp.keyAction} onChange={(e) => updateExperience(exp.id, { keyAction: e.target.value })} className="w-full min-h-[100px] bg-white border border-slate-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                              <textarea placeholder="그 결과는 어떠했나요? 무엇을 배웠나요? (Result & Learned)" value={exp.result} onChange={(e) => updateExperience(exp.id, { result: e.target.value })} className="w-full min-h-[80px] bg-white border border-slate-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-12 flex-1">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 text-sm font-black uppercase tracking-widest mb-2"><SparklesIcon className="w-4 h-4" />Step 2. 스토리 기술 (STAR)</div>
                <Label className="text-3xl font-black text-slate-900 tracking-tight block">경험을 <span className="text-indigo-600">구체적인 스토리</span>로 조립하세요</Label>
              </div>
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-80 space-y-6 text-left">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">경험 선택</Label>
                  <div className="grid grid-cols-1 gap-3 text-left">
                    {experiences.map((exp) => (
                      <button key={exp.id} onClick={() => setSelectedExpId(exp.id)} className={cn("p-5 rounded-2xl border-2 text-left transition-all", selectedExpId === exp.id ? "border-indigo-600 bg-indigo-50 shadow-md" : "border-slate-100 bg-white hover:border-slate-200")}>
                        <p className="text-[10px] font-black uppercase mb-1 text-indigo-600">{EXPERIENCE_GUIDES[exp.type].title}</p>
                        <p className="text-sm font-black text-slate-900 line-clamp-1">{exp.title || "제목 없음"}</p>
                      </button>
                    ))}
                  </div>
                  {selectedExpId && (
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-4 text-left">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">핵심 재료</h4>
                      <div><p className="text-[10px] text-indigo-400 font-black uppercase mb-1">Action</p><p className="text-sm font-medium text-slate-300 leading-relaxed">{experiences.find(e => e.id === selectedExpId)?.keyAction || "내용 없음"}</p></div>
                      <div><p className="text-[10px] text-indigo-400 font-black uppercase mb-1">Result</p><p className="text-sm font-medium text-slate-300 leading-relaxed">{experiences.find(e => e.id === selectedExpId)?.result || "내용 없음"}</p></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 gap-4 text-left">
                  {[
                    { id: 's', label: 'S', title: '상황', hint: '배경 설명', placeholder: '2025년 OO현장 실습 당시...' },
                    { id: 't', label: 'T', title: '과제', hint: '당면한 문제', placeholder: '공정 지연이 발생할 위험이 있었습니다.' },
                    { id: 'a', label: 'A', title: '행동', hint: '본인의 조치', placeholder: '직접 레벨기를 들고 재측량을 실시했습니다.' },
                    { id: 'r', label: 'R', title: '결과', hint: '성과와 교훈', placeholder: '오차를 줄여 공기를 3일 단축했습니다.' },
                  ].map((item) => (
                    <div key={item.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 focus-within:bg-white focus-within:border-indigo-300 transition-all text-left">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{item.label}</span><span className="font-black text-slate-900 text-sm">{item.title}</span></div>
                        <span className="text-[10px] text-slate-400 font-bold">{item.hint}</span>
                      </div>
                      <textarea className="w-full min-h-[80px] bg-transparent border-none outline-none text-base text-slate-900 resize-none leading-relaxed" placeholder={item.placeholder} value={(starForm as any)[item.id]} onChange={(e) => handleStarChange(item.id as any, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-12 flex-1 text-left">
              <div className="space-y-4"><Label className="text-3xl font-black text-slate-900 tracking-tight">Step 3. 지원 기업 설정</Label><p className="text-lg text-slate-500 leading-relaxed font-medium">자소서를 제출할 타겟을 명확히 설정합니다.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2 space-y-4"><Label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">관리 제목</Label><Input placeholder="예: 2026 상반기 현대건설 시공직무" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-2xl h-16 bg-slate-50 border-none pl-6 text-xl font-black" /></div>
                <div className="space-y-4"><Label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">지원 기업</Label><Input placeholder="예: 현대건설" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="rounded-2xl h-16 bg-slate-50 border-none pl-6 text-lg font-bold" /></div>
                <div className="space-y-4"><Label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">지원 직무</Label><Input placeholder="예: 토목 시공" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="rounded-2xl h-16 bg-slate-50 border-none pl-6 text-lg font-bold" /></div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col lg:flex-row gap-10 flex-1 h-full min-h-[600px] text-left text-slate-900">
              <div className="flex-1 space-y-6">
                <div><Label className="text-3xl font-black tracking-tight text-left">Step 4. 최종 자기소개서 완성</Label><p className="text-lg text-slate-500 mt-1 font-medium text-left">준비된 재료들을 연결하여 나만의 문장을 완성하세요.</p></div>
                <textarea className="w-full h-full min-h-[550px] px-10 py-10 text-xl bg-slate-50 border-none rounded-[3rem] focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed shadow-inner" placeholder="내용을 작성하세요..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="w-full lg:w-96 space-y-6 text-left">
                <div className="sticky top-8 space-y-6">
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl text-left"><h4 className="flex items-center gap-2 text-slate-400 font-black mb-4 uppercase tracking-widest text-[10px]"><CheckCircle2Icon className="w-3.5 h-3.5" />Target Info</h4><div className="space-y-4"><div><p className="text-[10px] text-slate-500 font-black uppercase mb-1 text-left">지원 기업</p><p className="text-xl font-black text-left">{form.company || "미지정"}</p></div><div><p className="text-[10px] text-slate-500 font-black uppercase mb-1 text-left">지원 직무</p><p className="text-lg font-bold text-slate-200 text-left">{form.position || "미지정"}</p></div></div></div>
                  <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-8 h-[400px] overflow-y-auto custom-scrollbar text-left"><h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-indigo-500" />경험 소스</h4><div className="space-y-4">{experiences.map((exp) => (<div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"><p className="text-sm font-black">{exp.title}</p><p className="text-xs text-slate-500 line-clamp-2">{exp.keyAction}</p></div>))}</div></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/60">
            <Button variant="ghost" onClick={currentStep === 1 ? () => navigate("/dashboard") : prevStep} className="gap-2 text-muted-foreground"><ChevronLeftIcon className="w-4 h-4" />{currentStep === 1 ? "나가기" : "이전 단계"}</Button>
            <div className="flex items-center gap-2">{currentStep < 4 ? <Button onClick={nextStep} className="gap-2 px-8 h-11 rounded-xl shadow-sm transition-all active:scale-95">다음 단계 <ChevronRightIcon className="w-4 h-4" /></Button> : <Button onClick={() => { if (master) updateMutation.mutate({ id: master.id, ...form }); navigate("/dashboard"); }} className="gap-2 px-10 h-11 rounded-xl bg-primary shadow-md shadow-primary/20"><SaveIcon className="w-4 h-4" />저장 및 종료</Button>}</div>
          </div>
        </Card>

        {currentStep === 1 && (
          <aside className="hidden xl:block w-80 shrink-0 h-full"><div className="sticky top-16 space-y-6 text-left">
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] -mr-16 -mt-16" />
              <h4 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10 text-white">
                <SparklesIcon className="w-6 h-6 text-indigo-400" />
                합격 작성 가이드
              </h4>
              <div className="space-y-10 relative z-10">
                <div className="space-y-3">
                  <p className="text-lg text-indigo-300 font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400" />이론을 실무로 연결</p>
                  <p className="text-base text-slate-300 leading-relaxed font-bold">성적 나열은 금물입니다. <br/><span className="text-white">"전공 지식을 현장 설계나 시공 공법에 어떻게 적용했는지"</span>를 적으세요.</p>
                </div>
                <div className="space-y-3 border-t border-slate-800 pt-8">
                  <p className="text-lg text-emerald-400 font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" />현장 용어를 쓰세요</p>
                  <p className="text-base text-slate-300 leading-relaxed font-bold"><span className="text-white">#공종 #공기단축 #도면검토 #안전사이클</span> <br/>현장 냄새 나는 단어를 섞어야 전문가처럼 보입니다.</p>
                </div>
                <div className="space-y-3 border-t border-slate-800 pt-8">
                  <p className="text-lg text-orange-400 font-black flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-400" />협업의 성과 강조</p>
                  <p className="text-base text-slate-300 leading-relaxed font-bold">건설은 팀 경기입니다. <br/><span className="text-white">"마찰을 어떻게 중재하여 공기를 맞췄는지"</span> 본인의 역할을 기술하세요.</p>
                </div>
              </div>
              <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 text-center"><p className="text-xs text-slate-500 font-bold italic">"작은 경험도 건설업의 가치와 연결되면 <br/> 강력한 무기가 됩니다."</p></div>
            </div>
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] shadow-sm"><p className="text-xs text-indigo-900 font-bold leading-relaxed text-left">💡 팁: 입력을 완료하신 후 [다음 단계]를 누르면 이 재료들을 멋진 문장으로 다듬을 수 있습니다.</p></div>
          </div></aside>
        )}
      </div>
    </div>
  );
}
