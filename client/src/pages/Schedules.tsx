import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, PlusIcon, Trash2Icon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import type { Schedule } from "@shared/types";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    
    setEditingId(null);
    setForm({
      ...defaultForm,
      scheduledAt: dateStr,
      type: "other",
    });
    setDialogOpen(true);
  };

  const handleEditClick = (schedule: Schedule) => {
    const date = new Date(schedule.scheduledAt);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    
    setEditingId(schedule.id);
    setForm({
      title: schedule.title,
      company: schedule.company || "",
      type: schedule.type as FormState["type"],
      scheduledAt: dateStr,
      description: schedule.description || "",
    });
    setDialogOpen(true);
  };

  const createMutation = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success("일정이 추가되었습니다.");
      utils.schedule.list.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("추가에 실패했습니다."),
  });

  const updateMutation = trpc.schedule.update.useMutation({
    onSuccess: () => {
      toast.success("일정이 수정되었습니다.");
      utils.schedule.list.invalidate();
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = trpc.schedule.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.schedule.list.cancel();
      const prev = utils.schedule.list.getData();
      utils.schedule.list.setData(undefined, (old: Schedule[] | undefined) => old?.filter((s: Schedule) => s.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.schedule.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => utils.schedule.list.invalidate(),
    onSuccess: () => toast.success("삭제되었습니다."),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("일정 제목을 입력해 주세요.");
      return;
    }
    const timestamp = new Date(form.scheduledAt).getTime();
    
    const data = {
      title: form.title,
      company: form.company || undefined,
      type: form.type,
      scheduledAt: timestamp,
      description: form.description || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const monthSchedules = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return (schedules as Schedule[]).filter((s: Schedule) => {
      const d = new Date(s.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [schedules, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_: unknown, i: number) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, () => null);

  const getSchedulesForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return monthSchedules.filter((s: Schedule) => {
      const sd = new Date(s.scheduledAt);
      const sdStr = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}-${String(sd.getDate()).padStart(2, "0")}`;
      return sdStr === dateStr;
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">일정 관리</h1>
          <p className="text-muted-foreground mt-1">취업 일정부터 개인 일정까지 한눈에 관리하세요.</p>
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
            {days.map((day: number) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg border p-1 text-xs overflow-hidden transition-all cursor-pointer group/cell ${
                    isToday ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className={`flex justify-between items-center mb-0.5`}>
                    <span className={`font-medium ${isToday ? "text-primary font-bold" : "text-foreground opacity-60 group-hover/cell:opacity-100"}`}>
                      {day}
                    </span>
                    <PlusIcon className="w-3 h-3 text-primary opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-0.5">
                    {daySchedules.slice(0, 3).map((s: Schedule) => (
                      <div key={s.id} className={`px-1.5 py-0.5 rounded text-[11px] truncate border shadow-sm font-medium ${typeColor[s.type]?.split(" ").slice(0,2).join(" ") || "bg-gray-500"}`}>
                        {s.title}
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-muted-foreground text-[10px] pl-1 font-semibold">+{daySchedules.length - 3}개 더보기</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">예정된 일정</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i: number) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (schedules as Schedule[]).filter((s: Schedule) => s.scheduledAt > Date.now() && !s.isCompleted).length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">달력의 날짜를 클릭하여 추가해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(schedules as Schedule[])
                .filter((s: Schedule) => s.scheduledAt > Date.now() && !s.isCompleted)
                .sort((a: Schedule, b: Schedule) => a.scheduledAt - b.scheduledAt)
                .slice(0, 10)
                .map((schedule: Schedule) => (
                  <div 
                    key={schedule.id} 
                    onClick={() => handleEditClick(schedule)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group cursor-pointer"
                  >
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 border ${typeColor[schedule.type] || typeColor.other}`}>
                      {typeLabel[schedule.type] || typeLabel.other}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{schedule.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {new Date(schedule.scheduledAt).toLocaleDateString("ko-KR", { month: 'long', day: 'numeric', weekday: 'short' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: schedule.id }); }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingId(null);
          setForm(defaultForm);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "일정 수정" : `${form.scheduledAt} 일정 추가`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>일정 제목 *</Label>
              <Input
                placeholder="예: 삼성전자 면접, 토익 시험, 스터디 등"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as FormState["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="other">기타/개인</SelectItem>
                    <SelectItem value="application">지원</SelectItem>
                    <SelectItem value="document">서류</SelectItem>
                    <SelectItem value="interview">면접</SelectItem>
                    <SelectItem value="test">시험</SelectItem>
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
              <Label>기업/장소 (선택)</Label>
              <Input
                placeholder="예: 강남역 스터디룸, 현대건설 등"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="상세 내용을 적어주세요..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "수정하기" : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
