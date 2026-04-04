import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookmarkIcon, PlusIcon, Trash2Icon, EditIcon, ExternalLinkIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

const statusLabel: Record<string, string> = {
  interested: "관심",
  applied: "지원함",
  interview: "면접 중",
  offer: "제안 받음",
  rejected: "불합격",
};

const statusColor: Record<string, string> = {
  interested: "bg-blue-100 text-blue-700 border-blue-200",
  applied: "bg-purple-100 text-purple-700 border-purple-200",
  interview: "bg-orange-100 text-orange-700 border-orange-200",
  offer: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

interface FormState {
  companyName: string;
  industry: string;
  position: string;
  jobUrl: string;
  deadline: string;
  notes: string;
  status: "interested" | "applied" | "interview" | "offer" | "rejected";
}

const defaultForm: FormState = {
  companyName: "",
  industry: "",
  position: "",
  jobUrl: "",
  deadline: "",
  notes: "",
  status: "interested",
};

export default function Bookmarks() {
  const utils = trpc.useUtils();
  const { data: bookmarks = [], isLoading } = trpc.bookmark.list.useQuery();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const filtered = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchSearch =
        !search ||
        b.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (b.industry ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bookmarks, search, filterStatus]);

  const createMutation = trpc.bookmark.create.useMutation({
    onSuccess: () => {
      toast.success("북마크가 추가되었습니다.");
      utils.bookmark.list.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("추가에 실패했습니다."),
  });

  const updateMutation = trpc.bookmark.update.useMutation({
    onSuccess: () => {
      toast.success("북마크가 수정되었습니다.");
      utils.bookmark.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = trpc.bookmark.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.bookmark.list.cancel();
      const prev = utils.bookmark.list.getData();
      utils.bookmark.list.setData(undefined, (old) => old?.filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.bookmark.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => utils.bookmark.list.invalidate(),
    onSuccess: () => toast.success("삭제되었습니다."),
  });

  const openEdit = (b: (typeof bookmarks)[0]) => {
    setEditingId(b.id);
    setForm({
      companyName: b.companyName,
      industry: b.industry ?? "",
      position: b.position ?? "",
      jobUrl: b.jobUrl ?? "",
      deadline: b.deadline ? new Date(b.deadline).toISOString().split("T")[0] : "",
      notes: b.notes ?? "",
      status: b.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.companyName.trim()) {
      toast.error("기업명을 입력해 주세요.");
      return;
    }
    const deadline = form.deadline ? new Date(form.deadline).getTime() : undefined;
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        companyName: form.companyName,
        industry: form.industry || undefined,
        position: form.position || undefined,
        jobUrl: form.jobUrl || undefined,
        deadline,
        notes: form.notes || undefined,
        status: form.status,
      });
    } else {
      createMutation.mutate({
        companyName: form.companyName,
        industry: form.industry || undefined,
        position: form.position || undefined,
        jobUrl: form.jobUrl || undefined,
        deadline,
        notes: form.notes || undefined,
        status: form.status,
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">기업 북마크</h1>
          <p className="text-muted-foreground mt-1">관심 기업과 채용 공고를 저장하고 관리하세요.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); }} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          기업 추가
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="기업명 또는 산업 검색..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="interested">관심</SelectItem>
            <SelectItem value="applied">지원함</SelectItem>
            <SelectItem value="interview">면접 중</SelectItem>
            <SelectItem value="offer">제안 받음</SelectItem>
            <SelectItem value="rejected">불합격</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <BookmarkIcon className="w-10 h-10 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {bookmarks.length === 0 ? "아직 북마크한 기업이 없습니다" : "검색 결과가 없습니다"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            {bookmarks.length === 0 ? "관심 기업을 추가해 보세요." : "다른 검색어를 입력해 보세요."}
          </p>
          {bookmarks.length === 0 && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <PlusIcon className="w-4 h-4" />
              기업 추가하기
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((bookmark) => (
            <div key={bookmark.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor[bookmark.status]}`}>
                  {statusLabel[bookmark.status]}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(bookmark)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: bookmark.id })}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{bookmark.companyName}</h3>
              <div className="space-y-1 mb-3">
                {bookmark.industry && (
                  <p className="text-sm text-muted-foreground">{bookmark.industry}</p>
                )}
                {bookmark.position && (
                  <p className="text-sm text-muted-foreground">{bookmark.position}</p>
                )}
              </div>
              {bookmark.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{bookmark.notes}</p>
              )}
              <div className="flex items-center justify-between">
                {bookmark.deadline && (
                  <p className="text-xs text-muted-foreground/60">
                    마감: {new Date(bookmark.deadline).toLocaleDateString("ko-KR")}
                  </p>
                )}
                {bookmark.jobUrl && (
                  <a
                    href={bookmark.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    공고 보기 <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "기업 정보 수정" : "기업 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>기업명 *</Label>
              <Input
                placeholder="예: 카카오"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>산업</Label>
                <Input
                  placeholder="예: IT"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>직무</Label>
                <Input
                  placeholder="예: 백엔드"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>채용공고 URL</Label>
              <Input
                placeholder="https://..."
                value={form.jobUrl}
                onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>마감일</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FormState["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">관심</SelectItem>
                    <SelectItem value="applied">지원함</SelectItem>
                    <SelectItem value="interview">면접 중</SelectItem>
                    <SelectItem value="offer">제안 받음</SelectItem>
                    <SelectItem value="rejected">불합격</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="추가 정보..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "수정하기" : "추가하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
