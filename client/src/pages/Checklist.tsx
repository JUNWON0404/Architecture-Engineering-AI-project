import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckSquareIcon, PlusIcon, Trash2Icon, GripVerticalIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import type { ChecklistItem } from "@shared/types";

const categories = ["기본 준비", "서류 작성", "면접 준비", "최종 확인", "기타"];

interface FormState {
  title: string;
  description: string;
  category: string;
}

const defaultForm: FormState = {
  title: "",
  description: "",
  category: "",
};

export default function Checklist() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.checklist.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item: ChecklistItem) => filterCategory === "all" || item.category === filterCategory);
  }, [items, filterCategory]);

  const completedCount = items.filter((i: ChecklistItem) => i.isCompleted).length;
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  const createMutation = trpc.checklist.create.useMutation({
    onSuccess: () => {
      toast.success("항목이 추가되었습니다.");
      utils.checklist.list.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("추가에 실패했습니다."),
  });

  const updateMutation = trpc.checklist.update.useMutation({
    onSuccess: () => utils.checklist.list.invalidate(),
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  const deleteMutation = trpc.checklist.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.checklist.list.cancel();
      const prev = utils.checklist.list.getData();
      utils.checklist.list.setData(undefined, (old: ChecklistItem[] | undefined) => old?.filter((i: ChecklistItem) => i.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.checklist.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => utils.checklist.list.invalidate(),
    onSuccess: () => toast.success("삭제되었습니다."),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("항목명을 입력해 주세요.");
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      category: form.category || undefined,
    });
  };

  const toggleComplete = (id: number, isCompleted: boolean | null) => {
    updateMutation.mutate({ id, isCompleted: !isCompleted });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">취업 준비 체크리스트</h1>
          <p className="text-muted-foreground mt-1">단계별 취업 준비 항목을 체크하며 진행하세요.</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setDialogOpen(true); }} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          항목 추가
        </Button>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">전체 진행률</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{progress}%</span>
              <span className="text-sm text-muted-foreground">({completedCount}/{items.length})</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, oklch(0.28 0.07 250), oklch(0.72 0.12 75))",
            }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 ({items.length})</SelectItem>
            {categories.map((c: string) => {
              const count = items.filter((i: ChecklistItem) => i.category === c).length;
              return <SelectItem key={c} value={c}>{c} ({count})</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i: number) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <CheckSquareIcon className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {items.length === 0 ? "아직 항목이 없습니다" : "선택한 카테고리에 항목이 없습니다"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {items.length === 0 ? "취업 준비 항목을 추가해 보세요." : "다른 카테고리를 선택해 보세요."}
          </p>
          {items.length === 0 && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <PlusIcon className="w-4 h-4" />
              항목 추가하기
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: ChecklistItem) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-sm hover:border-primary/30 transition-all group"
            >
              <button
                onClick={() => toggleComplete(item.id, !!item.isCompleted)}
                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  item.isCompleted
                    ? "bg-primary border-primary"
                    : "border-border hover:border-primary"
                }`}
              >
                {item.isCompleted && (
                  <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.category && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {item.category}
                    </span>
                  )}
                </div>
                <h3 className={`font-medium transition-all ${item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className={`text-sm mt-1 transition-all ${item.isCompleted ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>체크리스트 항목 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>항목명 *</Label>
              <Input
                placeholder="예: 자기소개서 작성하기"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={form.category || "none"} onValueChange={(v) => setForm({ ...form, category: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="추가 설명..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              추가하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
