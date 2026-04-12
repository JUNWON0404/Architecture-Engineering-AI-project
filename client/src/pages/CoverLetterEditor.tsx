import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftIcon, SaveIcon, ChevronRightIcon, ChevronLeftIcon, CheckCircle2Icon, CopyIcon, SparklesIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  id?: number;
}

type Step = 1 | 2 | 3 | 4;

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
    // 1단계: 세분화된 기본 정보
    major: "",          // 전공
    gpa: "",            // 학점
    certifications: "", // 자격증
    languageSkills: "", // 어학 성적
    experience: "",     // 주요 경력/인턴
    activities: "",     // 대외활동/수상
    majorCourses: "",   // 주요 수강 과목
    // 2단계용
    keywords: "",   
    keyStory: "",
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
        experience: (master as any).experience ?? "", 
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
              <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-600 text-sm font-black uppercase tracking-widest mb-2">
                <SparklesIcon className="w-4 h-4" />
                Step 1. 브레인스토밍
              </div>
              <Label className="text-4xl md:text-5xl font-black text-slate-900 block tracking-tighter">
                나만의 <span className="text-indigo-600 italic">필살기</span>를 던져보세요
              </Label>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                떠오르는 <span className="text-slate-900">#키워드</span>와 <span className="text-slate-900">#에피소드</span>만 나열해도 <br /> 건설사 맞춤형 문장의 훌륭한 재료가 됩니다.
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
              {/* 학력 및 전공 */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">학력 및 기본 스펙</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">전공 및 학점</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="전공 (예: 건축공학)" 
                          value={form.major}
                          onChange={(e) => setForm({ ...form, major: e.target.value })}
                          className="rounded-2xl h-16 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all pl-6 text-xl text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="relative w-32">
                        <Input 
                          placeholder="학점" 
                          value={form.gpa}
                          onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                          className="rounded-2xl h-16 text-center bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all font-mono text-2xl text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">주요 수강 과목 (전공 심화)</Label>
                    <Input 
                      placeholder="예: 구조역학, 건축시공학, 건설관리(CM)" 
                      value={form.majorCourses}
                      onChange={(e) => setForm({ ...form, majorCourses: e.target.value })}
                      className="rounded-2xl h-16 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all pl-6 text-xl text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="flex flex-wrap gap-2 px-1">
                      {["#전공심화", "#실무연계", "#수석수료", "#설계A+"].map(t => (
                        <button key={t} onClick={() => setForm(prev => ({ ...prev, majorCourses: prev.majorCourses ? `${prev.majorCourses}, ${t}` : t }))} className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-100 transition-all shadow-sm">{t} +</button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">자격증 및 어학</Label>
                    <Input 
                      placeholder="#건축기사 #토익900 #CAD #BIM #컴활1급" 
                      value={form.certifications}
                      onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      className="rounded-2xl h-16 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all pl-6 text-xl text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* 경험 및 활동 */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">경험 및 활동 키워드</h3>
                </div>
                
                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">인턴 / 프로젝트 / 대외활동</Label>
                    <textarea 
                      placeholder="#삼성건설인턴 #BIM프로젝트 #현장실습 #해외봉사" 
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="w-full min-h-[220px] rounded-[2rem] bg-slate-100 border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all p-8 text-xl text-slate-900 placeholder:text-slate-400 resize-none outline-none leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-3">
                      {[
                        "3개월간 현장 실습하며 도면 검토 역량을 키웠습니다.",
                        "BIM 프로젝트를 통해 설계 효율을 15% 개선했습니다.",
                        "현장 안전 관리 보조를 수행하며 0건의 사고를 기록했습니다."
                      ].map((s, i) => (
                        <button key={i} onClick={() => setForm(prev => ({ ...prev, experience: prev.experience ? `${prev.experience}\n- ${s}` : s }))} className="text-xs text-left text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-4 rounded-2xl border border-emerald-200 transition-all shadow-sm">"{s}" +</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-500 uppercase tracking-widest px-1">강점 및 가치관 (Soft Skills)</Label>
                    <Input 
                      placeholder="#협업전문가 #공기단축 #안전제일 #해결사" 
                      value={form.activities}
                      onChange={(e) => setForm({ ...form, activities: e.target.value })}
                      className="rounded-2xl h-16 bg-slate-100 border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all pl-6 text-xl text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="flex flex-wrap gap-3 pt-1">
                      {["#철저한안전", "#원활한소통", "#끝까지완수", "#데이터기반", "#정직한현장"].map(t => (
                        <button key={t} onClick={() => setForm(prev => ({ ...prev, activities: prev.activities ? `${prev.activities}, ${t}` : t }))} className="text-xs text-slate-700 bg-slate-200 hover:bg-slate-300 px-5 py-2.5 rounded-xl border border-slate-300 transition-all shadow-sm">{t} +</button>
                      ))}
                    </div>
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
          <div className="space-y-8 flex-1">
            <div className="space-y-4 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
              <div>
                <Label className="text-3xl font-black text-slate-900 tracking-tight">Step 4. 최종 자기소개서 완성</Label>
                <p className="text-lg text-slate-500 mt-1">재료들이 모두 준비되었습니다. 내용을 멋지게 구성해 보세요.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-3 border-primary/30 text-primary hover:bg-primary/5 h-14 px-8 rounded-2xl font-black text-base shadow-sm"
                  onClick={() => generateMutation.mutate(form)}
                  disabled={generateMutation.isPending}
                >
                  <SparklesIcon className={`w-5 h-5 ${generateMutation.isPending ? 'animate-pulse' : ''}`} />
                  {generateMutation.isPending ? "AI 분석 및 작성 중..." : "AI 초안 생성"}
                </Button>
                <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600 font-mono">
                    {form.content.length} 자
                  </p>
                </div>
              </div>
            </div>
            <textarea
              id="content"
              className="w-full min-h-[550px] px-10 py-10 text-xl bg-slate-50 border-none rounded-[3rem] focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed shadow-inner text-slate-900"
              placeholder="여기에 내용을 작성하세요..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
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
