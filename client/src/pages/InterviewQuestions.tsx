import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  MessageSquareIcon,
  PlusIcon,
  Trash2Icon,
  EditIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import type { InterviewQuestion } from "@shared/types";

const difficultyLabel: Record<string, string> = { easy: "쉬움", medium: "보통", hard: "어려움" };
const difficultyColor: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const categories = ["인성", "직무", "경험", "상황", "기술", "기타"];

interface FormState {
  question: string;
  answer: string;
  category: string;
  company: string;
  position: string;
  difficulty: "easy" | "medium" | "hard";
}

const defaultForm: FormState = {
  question: "",
  answer: "",
  category: "",
  company: "",
  position: "",
  difficulty: "medium",
};

export default function InterviewQuestions() {
  const utils = trpc.useUtils();
  const { data: questions = [], isLoading } = trpc.interview.list.useQuery();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const filtered = useMemo(() => {
    return questions.filter((q: InterviewQuestion) => {
      const matchSearch =
        !search ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        (q.company ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "all" || q.category === filterCategory;
      const matchDiff = filterDifficulty === "all" || q.difficulty === filterDifficulty;
      return matchSearch && matchCategory && matchDiff;
    });
  }, [questions, search, filterCategory, filterDifficulty]);

  const createMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      toast.success("면접 질문이 추가되었습니다.");
      utils.interview.list.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("추가에 실패했습니다."),
  });

  const updateMutation = trpc.interview.update.useMutation({
    onSuccess: () => {
      toast.success("면접 질문이 수정되었습니다.");
      utils.interview.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = trpc.interview.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.interview.list.cancel();
      const prev = utils.interview.list.getData();
      utils.interview.list.setData(undefined, (old: InterviewQuestion[] | undefined) => old?.filter((q: InterviewQuestion) => q.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.interview.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => utils.interview.list.invalidate(),
    onSuccess: () => toast.success("삭제되었습니다."),
  });

  const handleSubmit = () => {
    if (!form.question.trim()) {
      toast.error("질문을 입력해 주세요.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...form,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (q: InterviewQuestion) => {
    setEditingId(q.id);
    setForm({
      question: q.question,
      answer: q.answer || "",
      category: q.category || "",
      company: q.company || "",
      position: q.position || "",
      difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">면접 질문 관리</h1>
          <p className="text-muted-foreground mt-1">예상 질문을 리스트업하고 답변을 준비하세요.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); }} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          질문 추가
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="질문 또는 기업 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger>
            <SelectValue placeholder="난이도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 난이도</SelectItem>
            <SelectItem value="easy">쉬움</SelectItem>
            <SelectItem value="medium">보통</SelectItem>
            <SelectItem value="hard">어려움</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i: number) => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <MessageSquareIcon className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">질문이 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">새로운 면접 질문을 추가해 보세요.</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            질문 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q: InterviewQuestion) => (
            <div
              key={q.id}
              className={`bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all ${
                expandedId === q.id ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <div
                className="p-5 cursor-pointer flex items-start justify-between gap-4"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {q.category && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {q.category}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[q.difficulty] || ""}`}>
                        {difficultyLabel[q.difficulty] || q.difficulty}
                      </span>
                    )}
                    {q.company && (
                      <span className="text-xs font-medium text-muted-foreground">@{q.company}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{q.question}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(q); }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: q.id }); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-muted-foreground">
                    {expandedId === q.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </div>
                </div>
              </div>
              
              {expandedId === q.id && (
                <div className="px-5 pb-5 pt-0">
                  <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">예상 답변</p>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {q.answer || "아직 답변이 작성되지 않았습니다."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>면접 질문 {editingId ? "수정" : "추가"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>면접 질문 *</Label>
              <Input
                placeholder="예: 우리 회사를 지원한 동기는 무엇인가요?"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={form.category} onValueChange={(v: string) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>난이도</Label>
              <Select value={form.difficulty} onValueChange={(v: any) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">쉬움</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="hard">어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>지원 기업</Label>
              <Input
                placeholder="기업명"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>지원 직무</Label>
              <Input
                placeholder="직무명"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>예상 답변</Label>
              <textarea
                className="w-full h-40 px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="면접에서 답변할 내용을 미리 작성해 보세요."
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "수정하기" : "추가하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
