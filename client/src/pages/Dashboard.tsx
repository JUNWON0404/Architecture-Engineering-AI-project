import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckSquareIcon,
  FileTextIcon,
  MessageSquareIcon,
  Building2,
  MapPin,
  Users2,
  ArrowUpDown,
  Filter,
  Globe,
  ExternalLink,
  Clock,
  X,
  Target,
  Calendar,
  House,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * 프리미엄 기업 로고 컴포넌트
 */
function CompanyLogo({ company, size = "md" }: { company: any; size?: "sm" | "md" | "lg" }) {
  const [error, setError] = useState(false);
  
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-12 h-12 rounded-xl",
    lg: "w-20 h-20 md:w-28 md:h-24 rounded-3xl",
  };

  const getLogoUrl = (c: any) => {
    if (c.thumbnail) return c.thumbnail;
    if (!c.website) return null;
    try {
      const domain = new URL(c.website).hostname.replace('www.', '');
      return `https://logo.clearbit.com/${domain}?size=128&format=png`;
    } catch {
      return null;
    }
  };

  const imgSrc = getLogoUrl(company);

  if (error || !imgSrc) {
    return (
      <div className={cn(sizeClasses[size], "bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative overflow-hidden")}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        <Building2 className="w-1/2 h-1/2 text-slate-400 relative z-10" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={cn(sizeClasses[size], "bg-white flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm")}>
      <img 
        src={imgSrc} 
        alt={company.name} 
        className="w-full h-full object-contain p-1.5"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // 1. UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "recent">("rank");
  const [location, setLocation] = useState<string>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  // 2. Data Queries
  // 기업 목록 경량화
  const { data: companies = [], isLoading: companiesLoading } = trpc.company.list.useQuery({ 
    sortBy, 
    location: location === "all" ? undefined : location 
  });

  // 통합 요약 데이터 (성능 최적화)
  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.getSummary.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  // 선택된 회사 상세 정보
  const { data: selectedCompanyDetail } = trpc.company.get.useQuery(
    { id: selectedCompanyId || 0 },
    { enabled: !!selectedCompanyId }
  );
  
  // 선택된 회사의 채용공고
  const { data: jobPostings = [], isLoading: jobPostingsLoading } = trpc.company.jobPostings.useQuery(
    { companyId: selectedCompanyId || 0 },
    { enabled: !!selectedCompanyId }
  );

  // 3. Mutations
  const createBookmark = trpc.bookmark.create.useMutation({
    onSuccess: () => {
      utils.dashboard.getSummary.invalidate();
      toast.success("기업 북마크에 등록되었습니다.");
    }
  });
  
  const deleteBookmark = trpc.bookmark.delete.useMutation({
    onSuccess: () => {
      utils.dashboard.getSummary.invalidate();
      toast.success("북마크가 해제되었습니다.");
    }
  });

  const updateChecklist = trpc.checklist.update.useMutation({
    onSuccess: () => utils.dashboard.getSummary.invalidate()
  });

  // 마스터 기반 자소서 복제 mutation
  const { data: masterLetter } = trpc.coverLetter.getMaster.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
  const cloneMutation = trpc.coverLetter.clone.useMutation({
    onSuccess: (newLetter) => {
      toast.success(`맞춤형 자소서 초안이 생성되었습니다.`);
      navigate(`/cover-letters/${newLetter.id}`);
    },
    onError: (err) => toast.error(err.message || "자소서 생성 실패")
  });

  // 4. Computed Values
  const selectedCompany = useMemo(
    () => companies.find((c: any) => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  const isBookmarked = useMemo(() => {
    if (!selectedCompany || !summary) return false;
    // 북마크 상태는 통합 쿼리에서 가져오거나 별도 처리 (여기서는 단순하게 id 매칭)
    return false; // TODO: summary 데이터 구조에 북마크 리스트 포함 시 구현
  }, [summary, selectedCompany]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.sector && c.sector.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [companies, searchTerm]);

  const checklistProgress = summary?.checklist.progress || 0;
  const upcomingSchedules = summary?.upcomingSchedules || [];
  const checklistItems = summary?.checklist.items || [];

  const stats = [
    { label: "자기소개서", value: summary?.counts.coverLetters || 0, icon: FileTextIcon, href: "/cover-letters", color: "text-blue-600 bg-blue-50" },
    { label: "이력서", value: summary?.counts.resumes || 0, icon: BriefcaseIcon, href: "/resumes", color: "text-emerald-600 bg-emerald-50" },
    { label: "기업 북마크", value: summary?.counts.bookmarks || 0, icon: BookmarkIcon, href: "/bookmarks", color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="w-full bg-slate-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              반가워요, <span className="text-primary">{user?.name?.split(' ')[0] ?? "도전자"}</span>님
            </h1>
            <p className="text-slate-500 mt-3 text-lg font-bold">오늘의 추천 채용 공고와 일정을 확인하세요.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/checklist")} variant="outline" className="rounded-2xl font-black border-slate-200">
              <CheckSquareIcon className="w-4 h-4 mr-2" /> 할 일 관리
            </Button>
            <Button onClick={() => navigate("/cover-letters")} className="rounded-2xl font-black shadow-lg shadow-primary/20">
              <FileTextIcon className="w-4 h-4 mr-2" /> 새 자소서 작성
            </Button>
          </div>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column (Main) */}
          <div className="lg:col-span-9 space-y-8">
            {/* Quick Stats (Premium UI) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {stats.map((stat, i) => (
                <button
                  key={i}
                  onClick={() => navigate(stat.href)}
                  className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-1 text-left">
                    <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                      {summaryLoading ? <Skeleton className="h-10 w-12" /> : stat.value}
                    </div>
                    <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                </button>
              ))}
            </div>

            {/* Companies Explorer */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="기업명 또는 주요 분야 검색..."
                    className="pl-11 border-none bg-transparent h-12 font-bold focus-visible:ring-0 text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="w-32 md:w-40 h-10 border-none bg-slate-50 rounded-xl font-black text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-2" />
                      <SelectValue placeholder="전체 지역" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      <SelectItem value="all">전체 지역</SelectItem>
                      <SelectItem value="서울">서울</SelectItem>
                      <SelectItem value="인천">인천</SelectItem>
                      <SelectItem value="경기">경기</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-32 md:w-40 h-10 border-none bg-slate-50 rounded-xl font-black text-xs text-slate-600">
                      <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                      <SelectValue placeholder="정렬" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      <SelectItem value="rank">시평 순위</SelectItem>
                      <SelectItem value="name">이름순</SelectItem>
                      <SelectItem value="recent">최근 업데이트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {companiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCompanies.map((company: any) => (
                    <Card 
                      key={company.id} 
                      className="group relative bg-white hover:bg-slate-50/50 transition-all duration-300 border-slate-200 shadow-sm overflow-hidden cursor-pointer rounded-2xl flex flex-col hover:shadow-md border-l-4 hover:border-l-primary"
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <div className="p-6 flex flex-col space-y-5">
                        {/* Top Row: Type & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-3.5 bg-primary rounded-full" />
                            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                              {company.rank <= 100 ? "종합건설업" : "전문건설업"}
                            </span>
                          </div>
                          {company.jobPostingsCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[11px] font-black text-emerald-700">채용중</span>
                            </div>
                          )}
                        </div>

                        {/* Middle: Logo & Name */}
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:border-primary/30 transition-colors">
                            <CompanyLogo company={company} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors tracking-tight leading-tight break-keep">
                              {company.name}
                            </h3>
                          </div>
                        </div>

                        {/* Bottom: Sectors */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {company.sector?.split(',').slice(0, 3).map((s: string, idx: number) => (
                            <span key={idx} className="text-[11px] font-bold text-slate-500 whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Progress Widget */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-slate-900 tracking-tight">전체 진행률</h2>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black h-6">Goal</Badge>
              </div>
              
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - checklistProgress / 100)} className="text-primary transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{checklistProgress}%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status</span>
                </div>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200">
                    <div className="w-5 h-5 rounded-lg border-2 border-primary/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 truncate flex-1">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Widget */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16" />
              <div className="relative z-10">
                <h2 className="font-black mb-8 flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-primary" /> 다가오는 일정
                </h2>
                <div className="space-y-5">
                  {upcomingSchedules.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-6 border border-dashed border-white/10 rounded-2xl">일정이 없습니다.</p>
                  ) : upcomingSchedules.map((s: any) => (
                    <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-full uppercase text-primary tracking-wider">{s.type}</span>
                        <span className="text-[10px] font-bold text-slate-500">{new Date(s.scheduledAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="text-sm font-black text-slate-100 truncate">{s.title}</div>
                      {s.company && <div className="text-[10px] font-bold text-slate-500">{s.company}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Detail Modal */}
        <Dialog open={!!selectedCompanyId} onOpenChange={(open) => !open && setSelectedCompanyId(null)}>
          <DialogContent className="max-w-5xl w-[calc(100%-2rem)] p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white flex flex-col max-h-[92vh]">
            {selectedCompany && (
              <>
                <div className="relative h-48 md:h-64 bg-slate-900 p-8 md:p-12 flex items-end shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 opacity-90" />
                  <button onClick={() => setSelectedCompanyId(null)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-20">
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="relative z-10 flex items-center gap-8 md:gap-10 w-full">
                    <CompanyLogo company={selectedCompany} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-primary/20 text-primary-foreground border-none font-black h-7 px-4">TOP {selectedCompany.rank}</Badge>
                        {selectedCompany.brand && (
                          <span className="text-teal-300 font-black text-sm bg-teal-500/20 px-3 py-1 rounded-xl">{selectedCompany.brand}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <DialogTitle className="text-4xl md:text-6xl font-black text-white tracking-tighter truncate">{selectedCompany.name}</DialogTitle>
                        <div className="flex items-center gap-3">
                          <Button 
                            onClick={() => masterLetter && cloneMutation.mutate({ masterId: masterLetter.id, companyName: selectedCompany.name })}
                            disabled={cloneMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black h-12 px-6 shadow-lg shadow-indigo-900/20 gap-2 transition-all active:scale-95"
                          >
                            <SparklesIcon className={cn("w-4 h-4", cloneMutation.isPending && "animate-spin")} />
                            {cloneMutation.isPending ? "생성 중..." : "맞춤 자소서 만들기"}
                          </Button>
                          <button onClick={() => {}} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-yellow-400 transition-all">
                            <BookmarkIcon className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 overflow-y-auto bg-slate-50/30">
                  <div className="p-8 md:p-12 lg:p-14 space-y-12">
                    {/* Stats Summary Section */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                      {[
                        { label: "대표 브랜드", value: selectedCompany.brand || "정보 없음", icon: House, color: "text-indigo-600 bg-indigo-50" },
                        { label: "주요 분야", value: selectedCompany.sector?.split(',')[0], icon: Target, color: "text-blue-600 bg-blue-50" },
                        { label: "본사 위치", value: selectedCompany.location?.split(' ')[0], icon: MapPin, color: "text-rose-600 bg-rose-50" },
                        { label: "채용 시기", value: selectedCompany.hiringSeason || "상시", icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
                        { label: "초봉 가이드", value: selectedCompany.salaryGuide || "정보 없음", icon: BriefcaseIcon, color: "text-orange-600 bg-orange-50" },
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start gap-3 group hover:shadow-md transition-all">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:scale-105 transition-transform`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0 w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-8 space-y-14">
                        <section className="space-y-10 text-left">
                          <div className="relative group">
                            <div className="absolute -left-6 top-0 w-1 h-full bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">Corporate Analysis Report</h4>
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                              <p className="text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                                {selectedCompanyDetail?.description || "기업 정보를 불러오는 중입니다..."}
                              </p>
                              
                              <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                                  <Users2 className="w-4 h-4 text-indigo-500" />
                                  <div className="text-left">
                                    <p className="text-[9px] text-slate-400 font-black uppercase">Employees</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedCompany.employees || "미공개"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl">
                                  <Clock className="w-4 h-4 text-emerald-500" />
                                  <div className="text-left">
                                    <p className="text-[9px] text-slate-400 font-black uppercase">History</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedCompany.established}년 설립</p>
                                  </div>
                                </div>
                                {selectedCompany.website && (
                                  <Button variant="outline" className="h-14 rounded-2xl font-black border-slate-200 px-8" onClick={() => window.open(selectedCompany.website, "_blank")}>
                                    <Globe className="w-4 h-4 mr-2" /> 공식 홈페이지
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-8">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                              <div className="w-2 h-6 bg-blue-600 rounded-full shadow-sm" /> 진행 중인 공고
                            </h4>
                          </div>
                          <div className="grid gap-4">
                            {jobPostingsLoading ? <Skeleton className="h-32 w-full rounded-2xl" /> : jobPostings.length === 0 ? (
                              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                                <BriefcaseIcon className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">현재 진행 중인 공고가 없습니다.</p>
                              </div>
                            ) : jobPostings.map((job: any) => (
                              <div key={job.id} className="p-8 rounded-[2rem] bg-white border border-slate-200 hover:border-primary hover:shadow-xl transition-all group relative text-left">
                                <div className="flex justify-between items-start mb-6">
                                  <div>
                                    <h5 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{job.title}</h5>
                                    <p className="text-sm font-bold text-slate-500 mt-2">{job.position}</p>
                                  </div>
                                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black uppercase tracking-widest text-[9px]">Live</Badge>
                                </div>
                                <div className="flex flex-wrap gap-6 text-[11px] font-bold text-slate-400">
                                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location}</div>
                                  <div className="flex items-center gap-2 text-emerald-600"><BriefcaseIcon className="w-4 h-4" /> {job.salary}</div>
                                  <div className="flex items-center gap-2 text-orange-600"><Clock className="w-4 h-4" /> D-{Math.ceil((job.deadline - Date.now()) / (1000 * 60 * 60 * 24))}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                              <div className="w-1.5 h-5 bg-indigo-600 rounded-full" /> 한국건설신문 뉴스
                            </h4>
                            <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-400 uppercase tracking-widest">RSS LIVE</Badge>
                          </div>
                          <NewsSection companyName={selectedCompany.name} />
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed pt-4 border-t border-slate-100">
                            ※ 해당 뉴스는 한국건설신문(conslove.co.kr)의 실시간 검색 결과를 바탕으로 제공됩니다.
                          </p>
                        </section>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function NewsSection({ companyName }: { companyName: string }) {
  const { data: news = [], isLoading } = trpc.news.list.useQuery({ companyName }, { enabled: !!companyName, staleTime: 1000 * 60 * 5 });
  
  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-3 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );

  if (news.length === 0) return (
    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      <MessageSquareIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
      <p className="text-[11px] text-slate-400 font-bold">관련 뉴스가 없습니다.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {news.map((item, idx) => (
        <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="group block space-y-2">
          <h5 className="text-[13px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{item.title}</h5>
          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            <span>{item.source}</span>
            <div className="w-0.5 h-0.5 rounded-full bg-slate-200" />
            <span>{item.pubDate}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
