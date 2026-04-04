import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckSquareIcon,
  FileTextIcon,
  MessageSquareIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: coverLetters = [] } = trpc.coverLetter.list.useQuery();
  const { data: interviews = [] } = trpc.interview.list.useQuery();
  const { data: resumes = [] } = trpc.resume.list.useQuery();
  const { data: schedules = [] } = trpc.schedule.list.useQuery();
  const { data: bookmarks = [] } = trpc.bookmark.list.useQuery();
  const { data: checklist = [] } = trpc.checklist.list.useQuery();

  const now = Date.now();
  const upcomingSchedules = useMemo(
    () => schedules.filter((s) => s.scheduledAt > now && !s.isCompleted).slice(0, 3),
    [schedules, now]
  );

  const checklistProgress = useMemo(() => {
    if (checklist.length === 0) return 0;
    return Math.round((checklist.filter((c) => c.isCompleted).length / checklist.length) * 100);
  }, [checklist]);

  const stats = [
    { label: "자기소개서", value: coverLetters.length, icon: FileTextIcon, href: "/cover-letters", color: "text-blue-600 bg-blue-50" },
    { label: "면접 질문", value: interviews.length, icon: MessageSquareIcon, href: "/interview", color: "text-purple-600 bg-purple-50" },
    { label: "이력서", value: resumes.length, icon: BriefcaseIcon, href: "/resumes", color: "text-emerald-600 bg-emerald-50" },
    { label: "기업 북마크", value: bookmarks.length, icon: BookmarkIcon, href: "/bookmarks", color: "text-rose-600 bg-rose-50" },
  ];

  const scheduleTypeLabel: Record<string, string> = {
    application: "지원",
    document: "서류",
    interview: "면접",
    test: "시험",
    other: "기타",
  };

  const scheduleTypeColor: Record<string, string> = {
    application: "bg-blue-100 text-blue-700",
    document: "bg-purple-100 text-purple-700",
    interview: "bg-orange-100 text-orange-700",
    test: "bg-red-100 text-red-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          안녕하세요, <span className="text-primary">{user?.name ?? "사용자"}</span>님
        </h1>
        <p className="text-muted-foreground mt-1">오늘도 취업 준비를 함께 해요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.href)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist Progress */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquareIcon className="w-5 h-5 text-teal-600" />
              <h2 className="font-semibold text-foreground">취업 준비 진행률</h2>
            </div>
            <button
              onClick={() => navigate("/checklist")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              보기 <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-foreground">{checklistProgress}%</span>
            <span className="text-muted-foreground text-sm mb-1">
              {checklist.filter((c) => c.isCompleted).length} / {checklist.length} 완료
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${checklistProgress}%`,
                background: "linear-gradient(90deg, oklch(0.28 0.07 250), oklch(0.72 0.12 75))",
              }}
            />
          </div>
          {checklist.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              체크리스트를 추가해 취업 준비를 시작하세요.
            </p>
          )}
        </div>

        {/* Upcoming Schedules */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-foreground">다가오는 일정</h2>
            </div>
            <button
              onClick={() => navigate("/schedules")}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          {upcomingSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
              <button
                onClick={() => navigate("/schedules")}
                className="mt-3 text-sm text-primary hover:underline"
              >
                일정 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${scheduleTypeColor[schedule.type]}`}>
                    {scheduleTypeLabel[schedule.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{schedule.title}</p>
                    {schedule.company && (
                      <p className="text-xs text-muted-foreground truncate">{schedule.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(schedule.scheduledAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUpIcon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">빠른 시작</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "자기소개서 작성", href: "/cover-letters/new", icon: FileTextIcon, desc: "새 자기소개서 시작" },
              { label: "면접 질문 추가", href: "/interview", icon: MessageSquareIcon, desc: "예상 질문 준비" },
              { label: "이력서 작성", href: "/resumes/new", icon: BriefcaseIcon, desc: "새 이력서 만들기" },
              { label: "일정 등록", href: "/schedules", icon: CalendarIcon, desc: "면접·마감일 관리" },
              { label: "기업 저장", href: "/bookmarks", icon: BookmarkIcon, desc: "관심 기업 북마크" },
              { label: "체크리스트", href: "/checklist", icon: CheckSquareIcon, desc: "준비 현황 확인" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
