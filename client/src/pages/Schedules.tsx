import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, PlusIcon, Trash2Icon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";

const typeLabel: Record<string, string> = {
  application: "지원",
  document: "서류",
  interview: "면접",
  test: "시험",
  other: "기타",
};

const typeColor: Record<string, string> = {
  application: "bg-blue-100 text-blue-700 border-blue-200",
  document: "bg-purple-100 text-purple-700 border-purple-200",
  interview: "bg-orange-100 text-orange-700 border-orange-200",
  test: "bg-red-100 text-red-700 border-red-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

interface FormState {
  title: string;
  company: string;
  type: "application" | "document" | "interview" | "test" | "other";
  scheduledAt: string;
  description: string;
}

const defaultForm: FormState = {
  title: "",
  company: "",
  type: "other",
  scheduledAt: new Date().toISOString().split("T")[0],
  description: "",
};

export default function Schedules() {
  const utils = trpc.useUtils();
  const { data: schedules = [], isLoading } = trpc.schedule.list.useQuery();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const createMutation = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success("일정이 추가되었습니다.");
      utils.schedule.list.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("추가에 실패했습니다."),
  });

  const deleteMutation = trpc.schedule.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.schedule.list.cancel();
      const prev = utils.schedule.list.getData();
      utils.schedule.list.setData(undefined, (old: any) => old?.filter((s: any) => s.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.schedule.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => utils.schedule.list.invalidate(),
    onSuccess: () => toast.success("삭제되었습니다."),
  });

  const toggleCompleteMutation = trpc.schedule.update.useMutation({
    onSuccess: () => utils.schedule.list.invalidate(),
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("일정 제목을 입력해 주세요.");
      return;
    }
    const timestamp = new Date(form.scheduledAt).getTime();
    createMutation.mutate({
      title: form.title,
      company: form.company || undefined,
      type: form.type,
      scheduledAt: timestamp,
      description: form.description || undefined,
    });
  };

  const monthSchedules = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return schedules.filter((s) => {
      const d = new Date(s.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [schedules, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, () => null);

  const getSchedulesForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split("T")[0];
    return monthSchedules.filter((s) => new Date(s.scheduledAt).toISOString().split("T")[0] === dateStr);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">취업 일정 관리</h1>
          <p className="text-muted-foreground mt-1">지원, 면접, 마감일을 한눈에 관리하세요.</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setDialogOpen(true); }} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          일정 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              {currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-1 text-xs overflow-hidden transition-colors ${
                    isToday ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`font-medium mb-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {daySchedules.slice(0, 2).map((s) => (
                      <div key={s.id} className={`px-1 py-0.5 rounded text-white text-xs truncate ${typeColor[s.type].split(" ")[0]}`}>
                        {s.title}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-muted-foreground text-xs">+{daySchedules.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">다가오는 일정</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : schedules.filter((s) => s.scheduledAt > Date.now() && !s.isCompleted).length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules
                .filter((s) => s.scheduledAt > Date.now() && !s.isCompleted)
                .sort((a, b) => a.scheduledAt - b.scheduledAt)
                .slice(0, 5)
                .map((schedule) => (
                  <div key={schedule.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap flex-shrink-0 border ${typeColor[schedule.type]}`}>
                      {typeLabel[schedule.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{schedule.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(schedule.scheduledAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate({ id: schedule.id })}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2Icon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>일정 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                placeholder="예: 삼성전자 1차 면접"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>기업명</Label>
              <Input
                placeholder="예: 삼성전자"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as FormState["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">지원</SelectItem>
                    <SelectItem value="document">서류</SelectItem>
                    <SelectItem value="interview">면접</SelectItem>
                    <SelectItem value="test">시험</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>날짜</Label>
                <Input
                  type="date"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
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
