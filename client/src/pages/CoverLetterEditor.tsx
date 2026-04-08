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

export default function CoverLetterEditor({ id }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const isEdit = !!id;
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // 기존 이력서 목록 가져오기 (Step 1용)
  const { data: resumes = [] } = trpc.resume.list.useQuery();

  const { data: existing } = trpc.coverLetter.get.useQuery(
    { id: id! },
    { enabled: isEdit }
  );

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
    // 2단계용
    keywords: "",   
    keyStory: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        company: existing.company ?? "",
        position: existing.position ?? "",
        content: existing.content ?? "",
        status: existing.status,
        major: "",
        gpa: "",
        certifications: "",
        languageSkills: "",
        experience: "", 
        activities: "",
        keywords: "",
        keyStory: "",
      });
    }
  }, [existing]);

  const createMutation = trpc.coverLetter.create.useMutation({
    onSuccess: () => {
      toast.success("자기소개서가 저장되었습니다.");
      utils.coverLetter.list.invalidate();
      navigate("/cover-letters");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const updateMutation = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      toast.success("자기소개서가 수정되었습니다.");
      utils.coverLetter.list.invalidate();
      navigate("/cover-letters");
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("3단계에서 자기소개서 제목을 입력해 주세요.");
      setCurrentStep(3);
      return;
    }
    if (isEdit) {
      updateMutation.mutate({ id: id!, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !form.major.trim()) {
      toast.error("최소한 전공 정보는 입력해 주세요.");
      return;
    }
    if (currentStep === 2 && (!form.keywords.trim() || !form.keyStory.trim())) {
      toast.error("핵심 키워드와 스토리를 입력해 주세요.");
      return;
    }
    setCurrentStep((prev) => (prev + 1) as Step);
  };
  
  const prevStep = () => setCurrentStep((prev) => (prev - 1) as Step);

  const importResume = (content: string) => {
    setForm(prev => ({ ...prev, experience: content }));
    toast.success("이력서 내용을 경력 사항에 가져왔습니다.");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const steps = [
    { id: 1, title: "기본 이력" },
    { id: 2, title: "핵심 키워드" },
    { id: 3, title: "지원 기업" },
    { id: 4, title: "최종 편집" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/cover-letters")}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "자기소개서 수정" : "새 자기소개서 작성"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">데이터 기반의 맞춤형 자기소개서 작성</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 px-2">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep === s.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                    : currentStep > s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {currentStep > s.id ? <CheckCircle2Icon className="w-6 h-6" /> : s.id}
              </div>
              <span className={`text-xs font-medium ${currentStep === s.id ? "text-primary" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-4 transition-colors ${currentStep > s.id ? "bg-primary" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <Card className="p-6 md:p-8 border-border/50 shadow-sm min-h-[550px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-8 flex-1">
            <div className="space-y-2 text-center pb-4 border-b border-border/40">
              <Label className="text-2xl font-black flex items-center justify-center gap-2 text-primary">
                <SparklesIcon className="w-6 h-6" />
                Step 1. 브레인스토밍 (Brainstorming)
              </Label>
              <p className="text-sm text-muted-foreground font-medium">
                문장을 쓰지 마세요. 생각나는 <span className="text-foreground font-bold">#단어</span>와 <span className="text-foreground font-bold">#키워드</span>만 가볍게 던져보세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* 학력 & 스펙 키워드 */}
              <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/50">
                <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  학력 및 기본 스펙
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground ml-1">전공 및 학점</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="#건축공학" 
                        value={form.major}
                        onChange={(e) => setForm({ ...form, major: e.target.value })}
                        className="rounded-xl bg-background border-none shadow-sm focus:ring-2 focus:ring-primary/20"
                      />
                      <Input 
                        placeholder="#4.0" 
                        value={form.gpa}
                        onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                        className="w-24 rounded-xl text-center bg-background border-none shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground ml-1">어학 및 자격증</Label>
                    <Input 
                      placeholder="#토익900 #건축기사 #CAD마스터" 
                      value={form.certifications}
                      onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      className="rounded-xl bg-background border-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 경험 키워드 */}
              <div className="space-y-4 p-5 rounded-2xl bg-primary/[0.03] border border-primary/10">
                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/70 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  경험 및 활동 키워드
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground ml-1">주요 경험 (인턴/프로젝트)</Label>
                    <Input 
                      placeholder="#삼성건설인턴 #BIM설계프로젝트 #해외봉사" 
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="rounded-xl bg-background border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground ml-1">강점 및 기타 키워드</Label>
                    <Input 
                      placeholder="#협업능력 #현장중심 #꼼꼼한성격" 
                      value={form.activities}
                      onChange={(e) => setForm({ ...form, activities: e.target.value })}
                      className="rounded-xl bg-background border-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100/50 flex items-start gap-3">
              <div className="bg-yellow-400 text-white p-1 rounded-md text-[10px] font-bold mt-0.5">RULE</div>
              <p className="text-[11px] text-yellow-700 leading-relaxed">
                이곳은 자소서를 직접 쓰는 곳이 아닙니다. <br />
                <strong>핵심 단어</strong>만 나열해두면, 다음 단계에서 AI와 함께 문장으로 구체화할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <Label className="text-xl font-bold">Step 2. 핵심 키워드 & 스토리 뱅크</Label>
              <p className="text-sm text-muted-foreground">
                이 기업에서 나를 어떻게 기억하길 원하시나요? 핵심 키워드와 이를 뒷받침할 구체적인 에피소드를 연결하세요.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">나의 핵심 역량 키워드</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["#현장중심", "#데이터기반", "#협업전문가", "#공기단축", "#안전제일"].map(tag => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3 rounded-lg"
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
                  className="rounded-xl border-border/60"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  주요 성공/해결 에피소드 (STAR)
                  <span className="text-[10px] font-normal text-muted-foreground uppercase">최소 200자 이상 권장</span>
                </Label>
                <textarea
                  className="w-full min-h-[250px] px-4 py-4 text-sm bg-background border border-input rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
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
          <div className="space-y-8 flex-1">
            <div className="space-y-2">
              <Label className="text-xl font-bold">Step 3. 지원 기업 및 타겟 직무</Label>
              <p className="text-sm text-muted-foreground">
                이제 이 자소서를 제출할 곳을 명확히 설정합니다. 기업의 인재상에 맞춰 내용을 튜닝할 준비를 합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">자기소개서 관리 제목 <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="예: 2026 현대건설 상반기 플랜트 시공직무"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl h-12 text-base"
                />
                <p className="text-[11px] text-muted-foreground ml-1">나중에 목록에서 식별하기 쉬운 이름으로 정해주세요.</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="company" className="text-sm font-semibold">지원 기업명</Label>
                <div className="relative">
                  <Input
                    id="company"
                    placeholder="예: 현대건설"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="position" className="text-sm font-semibold">지원 직무</Label>
                <Input
                  id="position"
                  placeholder="예: 토목 시공 / BIM 설계"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">현재 작성 상태</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안 작성 중</SelectItem>
                    <SelectItem value="completed">작성 완료 (제출 전)</SelectItem>
                    <SelectItem value="submitted">제출 완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
              <SparklesIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-primary">Tip: 다음 단계 안내</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  [다음 단계]를 누르면 지금까지 입력한 <b>기본 이력, 키워드, 기업 정보</b>를 바탕으로 전체 내용을 조립할 수 있는 편집기가 나타납니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 flex-1">
            <div className="space-y-2 flex justify-between items-center">
              <div>
                <Label className="text-xl font-bold">Step 4. 최종 자기소개서 완성</Label>
                <p className="text-sm text-muted-foreground">재료들이 모두 준비되었습니다. 내용을 구성해 보세요.</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {form.content.length} 자
                </p>
              </div>
            </div>
            <textarea
              id="content"
              className="w-full min-h-[450px] px-4 py-4 text-sm bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed"
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
