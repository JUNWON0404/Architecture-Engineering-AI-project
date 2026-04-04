import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
  id?: number;
}

export default function ResumeEditor({ id }: Props) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const isEdit = !!id;

  const { data: existing } = trpc.resume.get.useQuery(
    { id: id! },
    { enabled: isEdit }
  );

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        content: existing.content ?? "",
      });
    }
  }, [existing]);

  const createMutation = trpc.resume.create.useMutation({
    onSuccess: () => {
      toast.success("이력서가 저장되었습니다.");
      utils.resume.list.invalidate();
      navigate("/resumes");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const updateMutation = trpc.resume.update.useMutation({
    onSuccess: () => {
      toast.success("이력서가 수정되었습니다.");
      utils.resume.list.invalidate();
      navigate("/resumes");
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
          onClick={() => navigate("/resumes")}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "이력서 수정" : "새 이력서 작성"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">이력서를 작성하세요.</p>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          <SaveIcon className="w-4 h-4" />
          {isPending ? "저장 중..." : "저장하기"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">이력서 제목 *</Label>
          <Input
            id="title"
            placeholder="예: 2026년 상반기 기술직 이력서"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">이력서 내용</Label>
          <textarea
            id="content"
            className="w-full min-h-[500px] px-3 py-3 text-sm bg-background border border-input rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground"
            placeholder="이력서 내용을 작성하세요...

예시:
[기본 정보]
이름: 
연락처: 
이메일: 

[학력]
대학교 / 학과 / 졸업년월

[경력]
회사명 / 직급 / 근무기간
- 주요 업무 및 성과

[자격증]
자격증명 / 취득일

[기술 스택]
언어, 프레임워크 등"
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
