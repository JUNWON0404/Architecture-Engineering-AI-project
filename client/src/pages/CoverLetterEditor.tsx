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
  XIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    title: "대외활동/봉사",
    questions: [
      "열악한 환경(해외봉사 등)을 극복한 본인만의 마인드는?",
      "다양한 사람들과 소통하며 팀워크를 이끌어낸 방법은?",
      "현장 실습 외에 직무 전문성을 쌓기 위해 노력한 점은?"
    ]
  },
  other: {
    title: "기타 경험",
    questions: [
      "이 경험이 건설업 직무 수행에 어떻게 도움이 될까요?",
      "본인만의 성실함이나 책임감이 가장 잘 드러난 순간은?",
      "실패를 통해 배운 교훈은 무엇인가요?"
    ]
  }
};

export default function CoverLetterEditor({ id: _unusedId }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // 마스터 자소서 데이터 가져오기 (없으면 자동 생성됨)
  const { data: master, isLoading: isMasterLoading } = trpc.coverLetter.getMaster.useQuery();

  // 기존 이력서 목록 가져오기 (Step 1용)
  const { data: resumes = [] } = trpc.resume.list.useQuery();

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
    experience: "[]", // JSON string for Experience[]
    activities: "",
    majorCourses: "",
    keywords: "",
    keyStory: "",
  });

  const experiences: Experience[] = JSON.parse(form.experience || "[]");

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

  const updateMutation = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      toast.success("마스터 자소서가 업데이트되었습니다.");
      utils.coverLetter.getMaster.invalidate();
    },
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  const generateMutation = trpc.coverLetter.generate.useMutation({
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, content: data.content }));
      toast.success("AI 초안이 생성되었습니다.");
    },
    onError: () => toast.error("AI 초안 생성에 실패했습니다."),
  });

  const handleSave = () => {
    if (!master) return;
    updateMutation.mutate({ id: master.id, ...form });
  };

  const nextStep = () => {
    if (currentStep === 1 && !form.major.trim()) {
      toast.error("최소한 전공 정보는 입력해 주세요.");
      return;
    }
    // 각 단계 이동 시 자동 저장
    if (master) {
      updateMutation.mutate({ id: master.id, ...form });
    }
    setCurrentStep((prev) => (prev + 1) as Step);
  };
  
  const prevStep = () => {
    // 이전 단계로 갈 때도 자동 저장
    if (master) {
      updateMutation.mutate({ id: master.id, ...form });
    }
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const importResume = (content: string) => {
    setForm(prev => ({ ...prev, experience: content }));
    toast.success("이력서 내용을 경력 사항에 가져왔습니다.");
  };

  const isPending = updateMutation.isPending;

  if (isMasterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: "기본 이력" },
    { id: 2, title: "핵심 키워드" },
    { id: 3, title: "지원 기업" },
    { id: 4, title: "최종 편집" },
  ];

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-6 mb-12">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-3 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            마스터 자소서 관리
          </h1>
          <p className="text-muted-foreground text-base mt-1 font-medium">나의 모든 경험을 집대성한 단 하나의 마스터 초안</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-16 px-4">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  currentStep === s.id
                    ? "border-primary bg-primary text-primary-foreground font-black shadow-xl shadow-primary/30 scale-110"
                    : currentStep > s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {currentStep > s.id ? <CheckCircle2Icon className="w-8 h-8" /> : <span className="text-lg font-black">{s.id}</span>}
              </div>
              <span className={`text-sm font-bold ${currentStep === s.id ? "text-primary" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[3px] flex-1 mx-6 transition-colors ${currentStep > s.id ? "bg-primary" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <Card className="p-10 md:p-16 border-border/50 shadow-xl rounded-[3rem] min-h-[700px] flex flex-col bg-white">
        {currentStep === 1 && (
          <div className="space-y-12 flex-1 text-left">
            <div className="space-y-4 text-center pb-10 border-b border-slate-200">
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 text-sm font-black uppercase tracking-widest mb-2">
                <CheckCircle2Icon className="w-4 h-4" />
                Step 1. 경험 및 역량 정리
              </div>
              <Label className="text-4xl md:text-5xl font-black text-slate-900 block tracking-tighter">
                보유하신 <span className="text-indigo-600">직무 역량</span>을 정리해 보세요
              </Label>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                사소한 경험이라도 유형별로 분류하여 입력해 두시면, <br /> 추후 기업별 맞춤형 자기소개서를 작성할 때 훌륭한 소스가 됩니다.
              </p>
            </div>

            {/* Resume Import Section */}
            {resumes.length > 0 && (
              <div className="p-8 rounded-[2rem] bg-slate-100/80 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-200">
                    <CopyIcon className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight">내 이력서 데이터 활용하기</p>
                    <p className="text-sm text-slate-600">저장된 이력서의 내용을 브레인스토밍 재료로 가져옵니다.</p>
                  </div>
                </div>
                <Select onValueChange={(val) => {
                  const r = resumes.find((r: any) => r.id === Number(val));
                  if (r) importResume(r.content || "");
                }}>
                  <SelectTrigger className="w-full md:w-72 h-14 rounded-2xl bg-white border-slate-300 shadow-sm text-slate-900 focus:ring-indigo-500/20">
                    <SelectValue placeholder="이력서 선택..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {resumes.map((r: any) => (
                      <SelectItem key={r.id} value={r.id.toString()} className="h-12 text-slate-800">
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-16 max-w-4xl mx-auto">
              {/* 학력 및 기본 스펙 (컴팩트 레이아웃) */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">학력 및 기본 정보</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">전공</Label>
                    <Input 
                      placeholder="예: 건축공학" 
                      value={form.major}
                      onChange={(e) => setForm({ ...form, major: e.target.value })}
                      className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 pl-5 text-lg font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">학점</Label>
                    <Input 
                      placeholder="0.0 / 4.5" 
                      value={form.gpa}
                      onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                      className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 text-center text-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">주요 자격증 / 어학</Label>
                    <Input 
                      placeholder="예: 건축기사, 토익 900" 
                      value={form.certifications}
                      onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      className="rounded-xl h-14 bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 pl-5 text-lg font-bold text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-4">
                    <div className="flex flex-col gap-1 px-1">
                      <Label className="text-sm font-black text-slate-500 uppercase tracking-widest">전공 프로젝트 및 직무 심화 학습</Label>
                      <p className="text-xs text-slate-400 font-medium">단순 과목 나열보다는 수업 중 수행한 설계 프로젝트나 직무와 직결되는 구체적인 성과를 적어주세요.</p>
                    </div>
                    <textarea 
                      placeholder="예: 건축시공학 기말 프로젝트 - 모듈러 공법의 현장 적용성 분석 및 원가 절감 방안 제시 (A+ 수료)" 
                      value={form.majorCourses}
                      onChange={(e) => setForm({ ...form, majorCourses: e.target.value })}
                      className="w-full min-h-[120px] rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 p-6 text-lg text-slate-900 placeholder:text-slate-400 leading-relaxed outline-none transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[
                        { tag: "#전공심화프로젝트", desc: "실습중심" },
                        { tag: "#설계경진대회수상", desc: "성과" },
                        { tag: "#BIM모델링실무", desc: "툴활용" },
                        { tag: "#학부연구생활동", desc: "전문성" }
                      ].map(item => (
                        <button 
                          key={item.tag} 
                          onClick={() => setForm(prev => ({ ...prev, majorCourses: prev.majorCourses ? `${prev.majorCourses}\n- ${item.tag}` : item.tag }))} 
                          className="group flex items-center gap-2 text-xs text-slate-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 transition-all shadow-sm"
                        >
                          <span className="font-bold text-indigo-500">{item.tag}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-500">({item.desc})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 경력 및 활동 상세 */}
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-lg">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">경력 및 활동 상세</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addExperience("intern")}
                      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      인턴 추가
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addExperience("project")}
                      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      프로젝트 추가
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addExperience("activity")}
                      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      기타활동 추가
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {experiences.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 text-left flex flex-col md:flex-row items-center gap-10 group hover:border-indigo-200 transition-colors">
                      <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                        <SparklesIcon className="w-10 h-10 text-indigo-500" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-xl font-black text-slate-900 tracking-tight">"아직 특별한 경험이 없어도 괜찮아요!"</p>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          대단한 인턴이 아니어도 좋습니다. <span className="text-indigo-600">전공 수업의 팀 프로젝트, 1년 넘게 꾸준히 한 아르바이트, 군 생활 중의 책임감</span> 등 우리 일상의 모든 '성실함'이 건설 현장에서는 강력한 무기가 됩니다. <br />
                          위의 버튼을 눌러 본인의 성실했던 순간 하나를 가볍게 적어보세요.
                        </p>
                        <div className="flex gap-2 pt-2">
                          {["#전공과제", "#아르바이트", "#책임감", "#끈기"].map(t => (
                            <Badge key={t} variant="outline" className="bg-white text-slate-400 border-slate-200 px-3 py-1">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    experiences.map((exp) => (
                      <div key={exp.id} className="group relative p-8 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-lg">
                        <button 
                          onClick={() => removeExperience(exp.id)}
                          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="삭제"
                        >
                          <Trash2Icon className="w-5 h-5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          <div className="md:col-span-4 space-y-4">
                            <Badge className={`px-4 py-1.5 rounded-lg font-black uppercase tracking-wider ${
                              exp.type === 'intern' ? 'bg-emerald-100 text-emerald-700' :
                              exp.type === 'project' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {EXPERIENCE_GUIDES[exp.type].title}
                            </Badge>
                            <Input 
                              placeholder="경험 제목 (예: OO건설 현장 인턴)" 
                              value={exp.title}
                              onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                              className="bg-transparent border-none text-2xl font-black p-0 h-auto focus:ring-0 placeholder:text-slate-300"
                            />
                            <Input 
                              placeholder="기간 (예: 2025.01 - 2025.03)" 
                              value={exp.period}
                              onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                              className="bg-transparent border-none text-sm font-bold text-slate-500 p-0 h-auto focus:ring-0 placeholder:text-slate-300"
                            />
                          </div>

                          <div className="md:col-span-8 space-y-6 border-l border-slate-200 pl-8">
                            <div className="space-y-3">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">심화 질문 가이드</Label>
                              <div className="bg-white/50 rounded-xl p-4 border border-slate-100">
                                <ul className="space-y-2">
                                  {EXPERIENCE_GUIDES[exp.type].questions.map((q, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                                      <span className="text-emerald-500 font-bold">Q.</span> {q}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <textarea 
                                placeholder="어떤 역할을 수행했고, 구체적으로 무엇을 했나요? (Action)" 
                                value={exp.keyAction}
                                onChange={(e) => updateExperience(exp.id, { keyAction: e.target.value })}
                                className="w-full min-h-[100px] bg-white border border-slate-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 outline-none transition-all"
                              />
                              <textarea 
                                placeholder="그 결과는 어떠했나요? 무엇을 배웠나요? (Result & Learned)" 
                                value={exp.result}
                                onChange={(e) => updateExperience(exp.id, { result: e.target.value })}
                                className="w-full min-h-[80px] bg-white border border-slate-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1 px-1">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest">직무 가치관 및 태도 (Professional Mindset)</Label>
                    <p className="text-xs text-slate-400 font-medium">건설 현장에서 중요하게 생각하는 본인만의 직업 윤리나 태도를 키워드로 적어주세요.</p>
                  </div>
                  <Input 
                    placeholder="예: #안전제일 #공기엄수 #원가관리마인드 #현장중심 #정직한시공" 
                    value={form.activities}
                    onChange={(e) => setForm({ ...form, activities: e.target.value })}
                    className="rounded-2xl h-16 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all pl-6 text-xl text-slate-900 placeholder:text-slate-400"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { tag: "#안전절대원칙", desc: "안전" },
                      { tag: "#공기단축/준수", desc: "책임" },
                      { tag: "#공종간협업", desc: "소통" },
                      { tag: "#철저한품질관리", desc: "신뢰" },
                      { tag: "#원가절감마인드", desc: "효율" }
                    ].map(item => (
                      <button 
                        key={item.tag} 
                        onClick={() => setForm(prev => ({ ...prev, activities: prev.activities ? `${prev.activities}, ${item.tag}` : item.tag }))} 
                        className="group flex items-center gap-2 text-xs text-slate-600 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 transition-all shadow-sm"
                      >
                        <span className="font-black text-indigo-500">{item.tag}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-500">({item.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border-none p-12 rounded-[3rem] flex items-start gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="bg-indigo-500/20 text-indigo-400 p-4 rounded-2xl shrink-0 z-10">
                <SparklesIcon className="w-10 h-10" />
              </div>
              <div className="space-y-4 z-10 text-left">
                <p className="text-2xl font-black text-white leading-none tracking-tight">건설사 맞춤형 가이드</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-2">
                  <div className="space-y-2">
                    <p className="text-lg text-indigo-300 font-black flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" /> 전공 지식의 현장 연결
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">수강 과목 중 실제 현장에서 쓰일 만한 지식을 연결해 보세요. (예: 시공학 -&gt; 거푸집 공법)</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg text-emerald-400 font-black flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" /> 결과보다는 과정(STAR)
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">단순 결과보다는 과정에서 마주한 '문제'와 '해결책'을 구체적으로 적어보세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-12 flex-1">
            <div className="space-y-4">
              <Label className="text-3xl font-black text-slate-900 tracking-tight">Step 2. 핵심 키워드 & 스토리 뱅크</Label>
              <p className="text-lg text-slate-500 leading-relaxed">
                이 기업에서 나를 어떻게 기억하길 원하시나요? <br />핵심 키워드와 이를 뒷받침할 구체적인 에피소드를 연결하세요.
              </p>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-5">
                <Label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">나의 핵심 역량 키워드</Label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {["#현장중심", "#데이터기반", "#협업전문가", "#공기단축", "#안전제일", "#공정관리"].map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all py-2.5 px-5 rounded-xl text-sm border-slate-200"
                      onClick={() => setForm(prev => ({ ...prev, keywords: prev.keywords ? `${prev.keywords}, ${tag}` : tag }))}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Input 
                  placeholder="위 태그를 클릭하거나 직접 입력하세요 (예: #문제해결력, #BIM전문가)" 
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  className="rounded-2xl h-16 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 pl-6 text-lg text-slate-900"
                />
              </div>

              <div className="space-y-5">
                <Label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-between px-1">
                  주요 성공/해결 에피소드 (STAR 기법)
                  <span className="text-xs text-primary bg-primary/5 px-3 py-1 rounded-full uppercase font-black">최소 200자 이상 권장</span>
                </Label>
                <textarea
                  className="w-full min-h-[350px] px-8 py-8 text-lg bg-slate-50 border-none rounded-[2rem] outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed text-slate-900"
                  placeholder="Situation (상황): 언제, 어디서 일어난 일인가요?
Task (과제): 당신에게 주어진 목표나 당면한 문제는 무엇이었나요?
Action (행동): 당신은 구체적으로 어떤 노력을 했나요? (자신의 기여도 중심)
Result (결과): 그 결과 어떤 성과를 냈나요? (수치나 구체적 변화)"
                  value={form.keyStory}
                  onChange={(e) => setForm({ ...form, keyStory: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-12 flex-1">
            <div className="space-y-4">
              <Label className="text-3xl font-black text-slate-900 tracking-tight">Step 3. 지원 기업 및 타겟 직무</Label>
              <p className="text-lg text-slate-500 leading-relaxed">
                이제 이 자소서를 제출할 곳을 명확히 설정합니다. <br />기업의 인재상에 맞춰 내용을 튜닝할 준비를 합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-5">
                <Label htmlFor="title" className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">자기소개서 관리 제목 <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="예: 2026 현대건설 상반기 플랜트 시공직무"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-2xl h-16 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 pl-6 text-xl font-black"
                />
                <p className="text-xs text-slate-400 ml-2 italic">※ 나중에 목록에서 식별하기 쉬운 이름으로 정해주세요.</p>
              </div>

              <div className="space-y-5">
                <Label htmlFor="company" className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">지원 기업명</Label>
                <Input
                  id="company"
                  placeholder="예: 현대건설"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="rounded-2xl h-16 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 pl-6 text-lg text-slate-900"
                />
              </div>

              <div className="space-y-5">
                <Label htmlFor="position" className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">지원 직무</Label>
                <Input
                  id="position"
                  placeholder="예: 토목 시공 / BIM 설계"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="rounded-2xl h-16 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 pl-6 text-lg text-slate-900"
                />
              </div>

              <div className="space-y-5">
                <Label className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">현재 작성 상태</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
                >
                  <SelectTrigger className="rounded-2xl h-16 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 pl-6 text-lg text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    <SelectItem value="draft" className="h-12 text-base">초안 작성 중</SelectItem>
                    <SelectItem value="completed" className="h-12 text-base">작성 완료 (제출 전)</SelectItem>
                    <SelectItem value="submitted" className="h-12 text-base">제출 완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-8 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-5">
              <SparklesIcon className="w-8 h-8 text-primary mt-1" />
              <div>
                <h4 className="text-lg font-black text-primary tracking-tight">Tip: 다음 단계 안내</h4>
                <p className="text-base text-slate-600 mt-2 leading-relaxed">
                  [다음 단계]를 누르면 지금까지 입력한 <span className="text-slate-900">기본 이력, 키워드, 기업 정보</span>를 바탕으로 전체 내용을 조립할 수 있는 강력한 편집기가 나타납니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex flex-col lg:flex-row gap-10 flex-1 h-full min-h-[600px]">
            {/* Main Editor */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                  <Label className="text-3xl font-black text-slate-900 tracking-tight">Step 4. 최종 자기소개서 완성</Label>
                  <p className="text-lg text-slate-500 mt-1">준비된 재료들을 연결하여 나만의 문장을 완성하세요.</p>
                </div>

                <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600 font-mono">
                    {form.content.length} 자
                  </p>
                </div>
              </div>
              <textarea
                id="content"
                className="w-full h-full min-h-[550px] px-10 py-10 text-xl bg-slate-50 border-none rounded-[3rem] focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed shadow-inner text-slate-900"
                placeholder="여기에 내용을 작성하세요..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            {/* Remind Sidebar */}
            <div className="w-full lg:w-96 space-y-6 text-left">
              <div className="sticky top-8 space-y-6">
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl">
                  <h4 className="flex items-center gap-2 text-slate-400 font-black mb-4 uppercase tracking-widest text-[10px]">
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                    Target Info
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">지원 기업</p>
                      <p className="text-xl font-black tracking-tight">{form.company || "미지정"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">지원 직무</p>
                      <p className="text-lg font-bold text-slate-200 tracking-tight">{form.position || "미지정"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    입력된 경험 소스
                  </h4>
                  
                  {/* Keywords */}
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">핵심 키워드</p>
                    <div className="flex flex-wrap gap-2">
                      {form.keywords.split(',').filter(k => k.trim()).map((k, i) => (
                        <Badge key={i} className="bg-slate-100 text-slate-700 border-none px-3 py-1 rounded-lg">
                          {k.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experiences */}
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">등록된 경험 ({experiences.length})</p>
                    <div className="space-y-4">
                      {experiences.map((exp) => (
                        <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                          <p className="text-sm font-black text-slate-900 leading-tight">{exp.title}</p>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2">{exp.keyAction}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{EXPERIENCE_GUIDES[exp.type].title}</p>
                        </div>
                      ))}
                      {experiences.length === 0 && (
                        <p className="text-sm text-slate-400 italic">등록된 경험이 없습니다.</p>
                      )}
                    </div>
                  </div>

                  {/* Major Courses */}
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">주요 수강 과목</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{form.majorCourses || "정보 없음"}</p>
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem]">
                  <p className="text-sm text-indigo-900 font-bold leading-relaxed">
                    💡 작성 팁: 오른쪽의 경험 카드에서 하나를 골라 <span className="text-indigo-600">성취 과정</span>을 중심으로 풀어내 보세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/60">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? () => navigate("/cover-letters") : prevStep}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {currentStep === 1 ? "취소 후 목록으로" : "이전 단계"}
          </Button>
          
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button onClick={nextStep} className="gap-2 px-8 h-11 rounded-xl shadow-sm transition-all active:scale-95">
                다음 단계로 이동
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isPending} className="gap-2 px-10 h-11 rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <SaveIcon className="w-4 h-4" />
                {isPending ? "저장 중..." : "작성 완료 및 저장"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
