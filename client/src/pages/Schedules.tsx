import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, PlusIcon, Trash2Icon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, Clock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@shared/types";

const typeLabel: Record<string, string> = {
  application: "지원",
  document: "서류",
  interview: "면접",
  test: "시험",
  other: "기타",
};

const typeColor: Record<string, string> = {
  application: "bg-blue-50 text-blue-600 border-blue-100",
  document: "bg-purple-50 text-purple-600 border-purple-100",
  interview: "bg-orange-50 text-orange-600 border-orange-100",
  test: "bg-red-50 text-red-600 border-red-100",
  other: "bg-slate-50 text-slate-600 border-slate-100",
};

const typePoint: Record<string, string> = {
  application: "bg-blue-500",
  document: "bg-purple-500",
  interview: "bg-orange-500",
  test: "bg-red-500",
  other: "bg-slate-400",
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
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-slate-50/30 text-left">
      {/* Bento Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-7 bg-indigo-600 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Time Line</h1>
          </div>
          <p className="text-slate-500 font-medium text-lg">성공적인 취업을 위한 철저한 일정 관리.</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setDialogOpen(true); }} className="gap-2 h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-lg">
          <PlusIcon className="w-5 h-5" />
          일정 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-900">
                {currentDate.toLocaleDateString("en-US", { month: "long" })}
                <span className="text-indigo-600 ml-2">{currentDate.getFullYear()}</span>
              </h2>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-slate-900"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-xs font-black bg-white shadow-sm rounded-lg transition-all text-slate-900"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-slate-900"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day} className="text-center text-[10px] font-black text-slate-400 py-2 tracking-widest">
                {day}
              </div>
            ))}
            
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-slate-50/30 rounded-2xl" />
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
                  className={cn(
                    "aspect-square rounded-2xl border p-2 text-left overflow-hidden transition-all cursor-pointer group/cell",
                    isToday 
                      ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10 shadow-inner" 
                      : "border-slate-100 hover:border-indigo-400 hover:bg-slate-50/50 shadow-sm bg-white"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-xs font-black",
                      isToday ? "text-indigo-600" : "text-slate-400 group-hover/cell:text-slate-900"
                    )}>
                      {day}
                    </span>
                    <PlusIcon className="w-3 h-3 text-indigo-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 2).map((s: Schedule) => (
                      <div key={s.id} className={cn(
                        "px-1.5 py-0.5 rounded-md text-[9px] truncate font-black flex items-center gap-1 border",
                        typeColor[s.type] || "bg-slate-50"
                      )}>
                        <div className={cn("w-1 h-1 rounded-full shrink-0", typePoint[s.type])} />
                        {s.title}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-slate-400 text-[8px] font-black pl-1">+{daySchedules.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
              Upcoming
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i: number) => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)}
              </div>
            ) : (schedules as Schedule[]).filter((s: Schedule) => s.scheduledAt > Date.now() && !s.isCompleted).length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-black text-slate-400">일정이 없습니다.</p>
                <p className="text-[10px] text-slate-300 mt-1 font-bold">날짜를 클릭하여 추가하세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(schedules as Schedule[])
                  .filter((s: Schedule) => s.scheduledAt > Date.now() && !s.isCompleted)
                  .sort((a: Schedule, b: Schedule) => a.scheduledAt - b.scheduledAt)
                  .slice(0, 8)
                  .map((schedule: Schedule) => (
                    <div 
                      key={schedule.id} 
                      onClick={() => handleEditClick(schedule)}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group cursor-pointer bg-white shadow-sm"
                    >
                      <div className={cn("w-1 h-8 rounded-full shrink-0", typePoint[schedule.type])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 truncate">{schedule.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <p className="text-[10px] text-slate-400 font-black">
                            {new Date(schedule.scheduledAt).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric', weekday: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: schedule.id }); }}
                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
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
        <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden bg-white">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {editingId ? "일정 수정" : "새 일정 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">일정 제목 *</Label>
              <Input
                placeholder="어떤 일정인가요?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl h-12 bg-slate-100 border-none px-4 text-sm font-bold text-slate-900"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">유형</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as FormState["type"] })}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-100 border-none px-4 text-sm font-bold text-slate-900"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="other">기타/개인</SelectItem>
                    <SelectItem value="application">지원</SelectItem>
                    <SelectItem value="document">서류</SelectItem>
                    <SelectItem value="interview">면접</SelectItem>
                    <SelectItem value="test">시험</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">날짜</Label>
                <Input
                  type="date"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="rounded-xl h-12 bg-slate-100 border-none px-4 text-sm font-bold text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">기업/장소 (선택)</Label>
              <div className="relative">
                <Input
                  placeholder="현대건설, 강남역 등"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="rounded-xl h-12 bg-slate-100 border-none pl-10 text-sm font-bold text-slate-900"
                />
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">상세 메모</Label>
              <textarea
                className="w-full h-24 px-4 py-3 text-sm bg-slate-100 border-none rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-900"
                placeholder="상세 내용을 입력하세요..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold text-slate-500">취소</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl h-12 px-8 bg-slate-900 hover:bg-black text-white font-black shadow-lg flex-1">
              {editingId ? "수정하기" : "일정 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
