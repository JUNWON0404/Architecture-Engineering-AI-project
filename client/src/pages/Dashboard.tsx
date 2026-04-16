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
  Filter,
  Globe,
  ExternalLink,
  Clock,
  X,
  Target,
  Calendar,
  House,
  Newspaper,
  Sparkles as SparklesIcon,
  BookmarkCheckIcon,
  StickyNoteIcon,
  SaveIcon,
  ZapIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo, useState, useEffect } from "react";
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
import { toast } from "sonner";
import type { Company, NewsScrap } from "@shared/types";

function CompanyLogo({ company, size = "md" }: { company: any; size?: "sm" | "md" | "lg" }) {
  const [error, setError] = useState(false);
  const sizeClasses = { sm: "w-8 h-8 rounded-lg", md: "w-12 h-12 rounded-xl", lg: "w-20 h-20 md:w-28 md:h-24 rounded-3xl" };
  const getLogoUrl = (c: any) => {
    if (c.thumbnail) return c.thumbnail;
    if (!c.website) return null;
    try {
      const domain = new URL(c.website).hostname.replace('www.', '');
      return `https://logo.clearbit.com/${domain}?size=128&format=png`;
    } catch { return null; }
  };
  const imgSrc = getLogoUrl(company);
  if (error || !imgSrc) return <div className={cn(sizeClasses[size], "bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200")}><Building2 className="w-1/2 h-1/2 text-slate-400" /></div>;
  return <div className={cn(sizeClasses[size], "bg-white flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm")}><img src={imgSrc} alt={company.name} className="w-full h-full object-contain p-1.5" onError={() => setError(true)} /></div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "name" | "recent">("rank");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [memoContent, setMemoContent] = useState("");
  const [incruitTab, setIncruitTab] = useState<"occupation" | "open" | "industry">("occupation");

  // Queries
  const { data: summary } = trpc.dashboard.getSummary.useQuery(undefined, { enabled: !!user });
  const { data: companies = [], isLoading: companiesLoading } = trpc.company.list.useQuery({ location: locationFilter === "all" ? null : locationFilter, sortBy });
  const { data: bookmarks = [] } = trpc.bookmark.list.useQuery(undefined, { enabled: !!user });
  const { data: selectedCompanyDetail } = trpc.company.get.useQuery({ id: selectedCompany?.id || 0 }, { enabled: !!selectedCompany });
  const { data: jobPostings = [], isLoading: jobPostingsLoading } = trpc.company.jobPostings.useQuery({ companyId: selectedCompany?.id || 0 }, { enabled: !!selectedCompany });
  const { data: news = [], isLoading: newsLoading } = trpc.news.list.useQuery({ companyName: selectedCompany?.name || "" }, { enabled: !!selectedCompany });
  const { data: globalNews = [], isLoading: globalNewsLoading } = trpc.news.list.useQuery({ companyName: "건설" }, { enabled: true });
  const { data: incruitNews = [], isLoading: incruitLoading } = trpc.incruit.list.useQuery({ type: incruitTab });
  const { data: coverLettersBrief = [], isLoading: coverLettersLoading } = trpc.coverLetter.listBrief.useQuery(undefined, { enabled: !!user });
  
  // Scraps
  const { data: allScraps = [] } = trpc.newsScrap.list.useQuery(undefined, { enabled: !!user });
  const globalScraps = useMemo(() => allScraps.filter((s: any) => s.companyId === null), [allScraps]);
  const currentCompanyScraps = useMemo(() => allScraps.filter((s: any) => s.companyId === selectedCompany?.id), [allScraps, selectedCompany]);
  
  // Note
  const { data: companyNote } = trpc.companyNote.get.useQuery({ companyId: selectedCompany?.id || 0 }, { enabled: !!selectedCompany });
  const { data: companyCoverLetters = [], refetch: refetchCompanyCoverLetters } = trpc.company.coverLetters.useQuery(
    { companyName: selectedCompany?.name || "" },
    { enabled: !!selectedCompany }
  );
  const { data: masterCoverLetter } = trpc.coverLetter.getMaster.useQuery(undefined, { enabled: !!selectedCompany });
  const cloneMutation = trpc.coverLetter.clone.useMutation({
    onSuccess: (data) => {
      refetchCompanyCoverLetters();
      toast.success(`${selectedCompany?.name} 자소서가 생성되었습니다.`);
      setIsDetailOpen(false);
      navigate(`/cover-letters?id=${data.id}`);
    },
    onError: () => toast.error("자소서 생성에 실패했습니다."),
  });

  useEffect(() => {
    if (companyNote) setMemoContent(companyNote.content);
    else setMemoContent("");
  }, [companyNote]);

  // Mutations
  const toggleBookmark = trpc.bookmark.create.useMutation({ onSuccess: () => { utils.bookmark.list.invalidate(); toast.success("기업이 북마크되었습니다."); } });
  const removeBookmark = trpc.bookmark.delete.useMutation({ onSuccess: () => { utils.bookmark.list.invalidate(); toast.success("북마크가 해제되었습니다."); } });
  const scrapMutation = trpc.newsScrap.create.useMutation({ onSuccess: () => { utils.newsScrap.list.invalidate(); toast.success("뉴스가 스크랩되었습니다."); } });
  const unscrapMutation = trpc.newsScrap.delete.useMutation({ onSuccess: () => { utils.newsScrap.list.invalidate(); toast.success("스크랩이 해제되었습니다."); } });
  const upsertNote = trpc.companyNote.upsert.useMutation({ onSuccess: () => { utils.companyNote.get.invalidate(); toast.success("메모가 저장되었습니다."); } });

  const isBookmarked = (companyName: string) => bookmarks.some((b: any) => b.companyName?.trim() === companyName?.trim());
  const isScrapped = (link: string) => allScraps.some((s: any) => s.link === link);

  const handleScrap = (e: React.MouseEvent, item: any, companyId: number | null) => {
    e.preventDefault(); e.stopPropagation();
    const existing = allScraps.find((s: any) => s.link === item.link);
    if (existing) unscrapMutation.mutate({ id: existing.id });
    else scrapMutation.mutate({ title: item.title, link: item.link, source: item.source, pubDate: item.pubDate, companyId });
  };

  const filteredCompanies = useMemo(() => {
    let result = [...companies] as any[];
    if (showOnlyBookmarks) result = result.filter((c: any) => isBookmarked(c.name));
    const searchLower = search.toLowerCase().trim();
    if (searchLower) result = result.filter((c: any) => c.name.toLowerCase().includes(searchLower) || c.sector.toLowerCase().includes(searchLower) || (c.brand && c.brand.toLowerCase().includes(searchLower)));
    return result;
  }, [companies, search, showOnlyBookmarks, bookmarks]);

  const handleBookmarkAction = (e: React.MouseEvent, company: any) => {
    e.stopPropagation();
    const existing = bookmarks.find((b: any) => b.companyName === company.name);
    if (existing) removeBookmark.mutate({ id: existing.id });
    else toggleBookmark.mutate({ companyName: company.name });
  };

  const handleCompanyClick = (company: any) => { setSelectedCompany(company); setIsDetailOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12 text-left">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-4 text-left">
            <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
            Corporate <span className="text-indigo-600 dark:text-indigo-400">HUB</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg text-left">실시간 기업 공고와 나만의 취업 타임라인을 확인하세요.</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 rounded-[2.5rem] bg-card border-border hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate("/cover-letters")}>
            <CardContent className="p-6">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 w-fit rounded-2xl mb-4 group-hover:bg-indigo-600 transition-colors text-left"><FileTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" /></div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-left">Documents</p>
              <div className="flex items-baseline gap-2 text-left"><span className="text-4xl font-black text-foreground">{summary?.counts.coverLetters || 0}</span><span className="text-sm font-bold text-muted-foreground">건</span></div>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 rounded-[2.5rem] bg-card border-border hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate("/schedules")}>
            <CardContent className="p-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 w-fit rounded-2xl mb-4 group-hover:bg-emerald-600 transition-colors text-left"><CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" /></div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-left">Schedule</p>
              <div className="flex items-baseline gap-2 text-left"><span className="text-4xl font-black text-foreground">{summary?.upcomingSchedules.length || 0}</span><span className="text-sm font-bold text-muted-foreground">개</span></div>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 rounded-[2.5rem] bg-card border-border hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate("/scrapbook")}>
            <CardContent className="p-6">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 w-fit rounded-2xl mb-4 group-hover:bg-amber-600 transition-colors text-left"><BookmarkIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" /></div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-left">Scrapbook</p>
              <div className="flex items-baseline gap-2 text-left"><span className="text-4xl font-black text-foreground">{allScraps.length || 0}</span><span className="text-sm font-bold text-muted-foreground">건</span></div>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 rounded-[2.5rem] bg-slate-900 dark:bg-indigo-950/50 border-none shadow-xl group cursor-pointer" onClick={() => navigate("/my-cover-letters")}>
            <CardContent className="p-6 text-left">
              <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4 group-hover:bg-indigo-600 transition-colors"><FileTextIcon className="w-6 h-6 text-indigo-400 group-hover:text-white" /></div>
              <p className="text-[11px] font-black text-indigo-400/80 uppercase tracking-widest mb-1">My Cover Letters</p>
              <h3 className="text-xl font-bold text-white leading-tight">자기소개서<br/>목록 보기</h3>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-2 h-7 bg-indigo-600 rounded-full" /> 
                Top Companies
              </h3>
              
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-[400px]">
                <div className="pl-3"><Filter className="w-4 h-4 text-slate-300" /></div>
                <Input 
                  placeholder="기업명, 브랜드 검색..." 
                  className="border-none bg-transparent h-9 text-sm focus-visible:ring-0 font-medium" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
                <Button 
                  size="sm"
                  variant="ghost" 
                  onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
                  className={cn(
                    "h-9 px-3 rounded-xl font-bold transition-all gap-1.5 shrink-0",
                    showOnlyBookmarks 
                      ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm" 
                      : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  <BookmarkIcon className={cn("w-3.5 h-3.5", showOnlyBookmarks && "fill-current")} />
                  <span className="text-xs">관심기업</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {companiesLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />) : filteredCompanies.map((company: any) => (
                <Card key={company.id} className={cn("rounded-[2.5rem] border-slate-200 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1", selectedCompany?.id === company.id ? "ring-2 ring-blue-600" : "bg-white")} onClick={() => handleCompanyClick(company)}>
                  <CardContent className="p-8 flex items-center gap-8 text-left">
                    <CompanyLogo company={company} size="md" />
                    <div className="flex-1 space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{company.name}</h3>
                        <button onClick={(e) => handleBookmarkAction(e, company)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isBookmarked(company.name) ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-300")}><BookmarkIcon className={cn("w-5 h-5", isBookmarked(company.name) && "fill-current")} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-left">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">#{company.sector}</Badge>
                        {company.brand && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">#{company.brand}</Badge>}
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">#시공능력_{company.rank}위</Badge>
                        <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">#{company.location?.split(" ")[0]}</Badge>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-2.5 py-1 rounded-lg text-[10px]">#{company.hiringSeason || "상시"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10 text-left">
            {/* Incruit Hiring Alert */}
            <section className="space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><div className="w-2 h-6 bg-orange-500 rounded-full shadow-sm animate-pulse" /><ZapIcon className="w-5 h-5 text-orange-500" />Hiring Alert</h3>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-left">
                {[["occupation", "직종"], ["open", "공채"], ["industry", "업종"]].map(([key, label]) => (
                  <button key={key} onClick={() => setIncruitTab(key as any)} className={cn("flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all", incruitTab === key ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>{label}</button>
                ))}
              </div>
              <div className="space-y-3 text-left">
                {incruitLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) : incruitNews.map((job: any, i: number) => (
                  <a key={i} href={job.link} target="_blank" rel="noopener noreferrer" className="block bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:border-orange-100 transition-all group text-left">
                    <span className="text-[10px] font-black text-orange-500 text-left">{job.company}</span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors mt-1 text-left">{job.title}</h4>
                  </a>
                ))}
              </div>
            </section>
            
            <section className="space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><div className="w-2 h-6 bg-red-500 rounded-full animate-pulse" /><Newspaper className="w-5 h-5 text-slate-400" />Hot News</h3>
              <div className="space-y-4 text-left">
                {globalNewsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />) : globalNews.map((item: any, i: number) => (
                  <div key={i} className="block bg-white border border-slate-200 rounded-[2rem] p-5 hover:shadow-md transition-all group relative text-left">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between text-left">
                        <div className="flex items-center gap-2"><Badge className="bg-red-50 text-red-600 text-[8px] font-black border-none px-2 py-0.5">HOT</Badge><span className="text-[10px] text-slate-400 font-bold">{item.pubDate}</span></div>
                        <button onClick={(e) => handleScrap(e, item, null)} className={cn("p-1.5 rounded-lg transition-all", isScrapped(item.link) ? "bg-blue-50 text-blue-600" : "text-slate-300 hover:bg-slate-50")}><BookmarkIcon className={cn("w-4 h-4", isScrapped(item.link) && "fill-current")} /></button>
                      </div>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-left">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug text-left">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 text-left">{item.source}</p>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* 자소서 현황 */}
        <div className="space-y-6 text-left">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-2 h-7 bg-emerald-600 rounded-full" />
            자소서 현황
            <button onClick={() => navigate("/my-cover-letters")} className="ml-auto text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1"><ArrowRightIcon className="w-3.5 h-3.5" />전체 보기</button>
          </h3>
          {(() => {
            const nonMaster = coverLettersBrief.filter((cl: any) => !cl.isMaster);
            const drafts = nonMaster.filter((cl: any) => cl.status === "draft");
            const completed = nonMaster.filter((cl: any) => cl.status === "completed" || cl.status === "submitted");
            const bookmarkedWithoutCL = bookmarks.filter((b: any) => !nonMaster.some((cl: any) => cl.company?.trim() === b.companyName?.trim()));
            const cols = [
              { label: "작성 전", color: "slate", items: bookmarkedWithoutCL, render: (b: any) => ({ id: b.id, title: b.companyName, sub: "관심 기업", status: null, link: null }) },
              { label: "작성 중", color: "amber", items: drafts, render: (cl: any) => ({ id: cl.id, title: cl.company || cl.title, sub: cl.position || "직무 미지정", status: "draft", link: `/cover-letters?id=${cl.id}` }) },
              { label: "완료", color: "emerald", items: completed, render: (cl: any) => ({ id: cl.id, title: cl.company || cl.title, sub: cl.position || "직무 미지정", status: cl.status, link: `/cover-letters?id=${cl.id}` }) },
            ];
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cols.map(({ label, color, items, render }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-5 rounded-full", color === "slate" ? "bg-slate-300" : color === "amber" ? "bg-amber-400" : "bg-emerald-500")} />
                      <span className="font-black text-slate-700 text-sm">{label}</span>
                      <span className={cn("ml-auto text-xs font-black px-2 py-0.5 rounded-full", color === "slate" ? "bg-slate-100 text-slate-500" : color === "amber" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {coverLettersLoading ? <Skeleton className="h-14 w-full rounded-xl" /> : items.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-xl">없음</div>
                      ) : items.slice(0, 5).map((item: any) => {
                        const r = render(item);
                        return r.link ? (
                          <div key={r.id} onClick={() => navigate(r.link!)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                            <div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{r.title}</p><p className="text-[10px] text-slate-400 font-medium">{r.sub}</p></div>
                          </div>
                        ) : (
                          <div key={r.id} className="flex items-center p-3 rounded-xl">
                            <div className="min-w-0"><p className="text-sm font-bold text-slate-600 truncate">{r.title}</p><p className="text-[10px] text-slate-400 font-medium">{r.sub}</p></div>
                          </div>
                        );
                      })}
                      {items.length > 5 && <p className="text-center text-[10px] text-slate-400 font-bold">+{items.length - 5}건 더</p>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 border-none shadow-2xl rounded-[3.5rem] overflow-y-auto bg-white scrollbar-hide text-left">
          {selectedCompany && (
            <div className="min-h-full pb-20 text-left">
              <div className="px-16 pt-16 flex items-start justify-between text-left">
                <div className="flex items-center gap-8 text-left">
                  <CompanyLogo company={selectedCompany} size="lg" />
                  <div className="space-y-3 text-left">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight text-left">{selectedCompany.name}</h2>
                    <div className="flex items-center gap-6 text-slate-400 font-bold text-sm text-left">
                      <div className="flex items-center gap-2 text-left"><MapPin className="w-4 h-4" />{selectedCompany.location}</div>
                      {selectedCompany.website && <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors text-left"><Globe className="w-4 h-4" />공식 홈페이지</a>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 text-left">
                  <Button variant="outline" className={cn("h-12 rounded-2xl border-2 font-black px-6 transition-all", isBookmarked(selectedCompany.name) ? "bg-amber-50 border-amber-200 text-amber-600" : "hover:bg-slate-50")} onClick={(e) => handleBookmarkAction(e, selectedCompany)}>
                    <BookmarkIcon className={cn("w-4 h-4 mr-2", isBookmarked(selectedCompany.name) && "fill-current")} />
                    관심 기업 {isBookmarked(selectedCompany.name) ? "해제" : "등록"}
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => setIsDetailOpen(false)}><X className="w-6 h-6" /></Button>
                </div>
              </div>

              <div className="px-16 mt-10 text-left">
                <div className="flex items-center gap-12 py-6 border-y border-slate-100 text-left">
                  {[{l:"Rank",v:`${selectedCompany.rank}위`},{l:"Revenue",v:selectedCompany.revenue},{l:"Salary",v:selectedCompany.salaryGuide},{l:"Employees",v:selectedCompany.employees},{l:"Established",v:`${selectedCompany.established}년`}].map((s,i)=>(
                    <div key={i} className="flex flex-col gap-1 text-left"><span className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-left">{s.l}</span><span className="text-sm font-bold text-slate-700 text-left">{s.v || "미공개"}</span></div>
                  ))}
                </div>
              </div>

              <div className="px-16 mt-12 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 text-left">
                  <div className="lg:col-span-8 space-y-12 text-left">
                    <section className="text-left">
                      <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 text-left"><FileTextIcon className="w-5 h-5 text-blue-600" />기업 리포트</h4>
                      <p className="text-[16px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 text-left">{selectedCompanyDetail?.description || "기업 연구 데이터를 불러오는 중입니다..."}</p>
                    </section>

                    <section className="text-left">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-3"><FileTextIcon className="w-5 h-5 text-emerald-600" />이 기업 자기소개서</h4>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold"
                          disabled={cloneMutation.isPending || !masterCoverLetter}
                          onClick={() => masterCoverLetter && cloneMutation.mutate({ masterId: masterCoverLetter.id, companyName: selectedCompany.name })}
                        >
                          <SparklesIcon className="w-4 h-4" />
                          {cloneMutation.isPending ? "생성 중..." : "새로 작성"}
                        </Button>
                      </div>
                      {companyCoverLetters.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                          아직 작성된 자소서가 없습니다.<br />마스터 자소서를 기반으로 새로 작성해보세요.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {companyCoverLetters.map((cl: any) => (
                            <div
                              key={cl.id}
                              onClick={() => { setIsDetailOpen(false); navigate(`/cover-letters`); }}
                              className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                            >
                              <div className="space-y-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{cl.title}</p>
                                <p className="text-xs text-slate-400">{cl.position || "직무 미지정"} · {new Date(cl.updatedAt).toLocaleDateString("ko-KR")}</p>
                              </div>
                              <Badge className={cn("shrink-0 ml-3 font-bold border rounded-lg text-xs", cl.status === "completed" ? "bg-green-100 text-green-700 border-green-200" : cl.status === "submitted" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-yellow-100 text-yellow-700 border-yellow-200")}>
                                {cl.status === "completed" ? "완료" : cl.status === "submitted" ? "제출됨" : "작성 중"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="text-left">
                      <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 text-left"><BriefcaseIcon className="w-5 h-5 text-indigo-600" />진행 중인 채용 공고 탐색</h4>
                      <div className="grid gap-4 text-left">
                        {jobPostingsLoading ? <Skeleton className="h-32 w-full rounded-3xl" /> : jobPostings.length === 0 ? <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-bold text-left">진행 중인 공고가 없습니다.</div> : jobPostings.map((p: any) => (
                          <div key={p.id} className="p-6 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group flex items-center justify-between text-left">
                            <div className="space-y-2 text-left"><Badge className="bg-slate-100 text-slate-500 font-bold border-none text-left">{p.position}</Badge><h5 className="text-lg font-bold text-slate-900 text-left">{p.title}</h5><p className="text-xs text-slate-400 font-medium text-left">마감일: {p.deadline ? new Date(p.deadline).toLocaleDateString("ko-KR") : "상시채용"}</p></div>
                            <Button variant="ghost" className="group-hover:bg-blue-600 group-hover:text-white rounded-xl text-left">상세보기</Button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="lg:col-span-4 space-y-12 text-left">
                    {currentCompanyScraps.length > 0 && (
                      <section className="text-left">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 text-left"><BookmarkCheckIcon className="w-5 h-5 text-blue-600" />이 기업의 스크랩 뉴스</h4>
                        <div className="space-y-3 text-left">
                          {currentCompanyScraps.map((scrap: any) => (
                            <div key={scrap.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl relative group text-left">
                              <button onClick={() => unscrapMutation.mutate({ id: scrap.id })} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"><X className="w-3 h-3" /></button>
                              <a href={scrap.link} target="_blank" rel="noreferrer" className="block space-y-1 text-left"><span className="text-[9px] font-black text-blue-500 uppercase text-left">{scrap.source}</span><h4 className="text-xs font-bold text-slate-800 line-clamp-1 text-left">{scrap.title}</h4></a>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="text-left">
                      <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 text-left"><Newspaper className="w-5 h-5 text-slate-400" />실시간 기업 동향</h4>
                      <div className="space-y-4 text-left">
                        {newsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />) : news.map((item: any, i: number) => (
                          <div key={i} className="block p-5 border border-slate-100 rounded-3xl hover:shadow-md transition-all group relative text-left">
                            <button onClick={(e) => handleScrap(e, item, selectedCompany.id)} className={cn("absolute top-4 right-4 p-1.5 rounded-lg transition-all", isScrapped(item.link) ? "bg-blue-50 text-blue-600" : "text-slate-300 hover:bg-slate-50")}><BookmarkIcon className={cn("w-3.5 h-3.5", isScrapped(item.link) && "fill-current")} /></button>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="space-y-2 block text-left"><span className="text-[10px] text-blue-600 font-bold uppercase text-left">{item.source} • {item.pubDate}</span><h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-left">{item.title}</h5></a>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="text-left">
                      <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 text-left"><StickyNoteIcon className="w-5 h-5 text-amber-500" />나의 기업 연구 메모장</h4>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-[2.5rem] p-8 space-y-4 text-left">
                        <textarea className="w-full h-40 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-300 resize-none font-medium leading-relaxed text-left" placeholder="이 기업에 대해 메모하고 싶은 내용을 자유롭게 적으세요..." value={memoContent} onChange={(e) => setMemoContent(e.target.value)} />
                        <div className="flex justify-end text-left"><Button size="sm" className="bg-amber-500 hover:bg-amber-600 rounded-xl gap-2" onClick={() => upsertNote.mutate({ companyId: selectedCompany.id, content: memoContent })} disabled={upsertNote.isPending}><SaveIcon className="w-4 h-4" />{upsertNote.isPending ? "저장 중..." : "메모 저장"}</Button></div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
