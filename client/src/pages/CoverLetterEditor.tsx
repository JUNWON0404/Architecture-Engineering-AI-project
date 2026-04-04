import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
  id?: number;
}

export default function CoverLetterEditor({ id }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const isEdit = !!id;

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
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        company: existing.company ?? "",
        position: existing.position ?? "",
        content: existing.content ?? "",
        status: existing.status,
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
      toast.error("제목을 입력해 주세요.");
      return;
    }
    if (isEdit) {
      updateMutation.mutate({ id: id!, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
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
          <p className="text-muted-foreground text-sm mt-0.5">나만의 자기소개서를 작성하세요.</p>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {isPending ? "저장 중..." : "저장하기"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="예: 삼성전자 소프트웨어 개발 직군 자기소개서"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">지원 기업</Label>
            <Input
              id="company"
              placeholder="예: 삼성전자"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">지원 직무</Label>
            <Input
              id="position"
              placeholder="예: 소프트웨어 개발"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>작성 상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">작성 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="submitted">제출됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">자기소개서 내용</Label>
          <textarea
            id="content"
            className="w-full min-h-[400px] px-3 py-3 text-sm bg-background border border-input rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground"
            placeholder="자기소개서 내용을 작성하세요...

예시:
1. 성장 과정 및 가치관
2. 지원 동기
3. 직무 관련 경험 및 역량
4. 입사 후 포부"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.content.length}자
          </p>
        </div>
      </div>
    </div>
  );
}
