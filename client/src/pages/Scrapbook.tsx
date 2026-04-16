import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  Newspaper,
  X,
  ExternalLink,
  Trash2,
  Building2,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Scrapbook() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Queries
  const { data: allScraps = [], isLoading } = trpc.newsScrap.list.useQuery(undefined, { enabled: !!user });
  const { data: companies = [] } = trpc.company.list.useQuery(undefined);

  // Mutations
  const deleteMutation = trpc.newsScrap.delete.useMutation({
    onSuccess: () => {
      utils.newsScrap.list.invalidate();
      toast.success("스크랩이 삭제되었습니다.");
    }
  });

  // 데이터 분류
  const companyGroupedScraps = useMemo(() => {
    const grouped = new Map<number, any[]>();
    allScraps.forEach(scrap => {
      if (scrap.companyId) {
        const list = grouped.get(scrap.companyId) || [];
        list.push(scrap);
        grouped.set(scrap.companyId, list);
      }
    });
    return Array.from(grouped.entries()).map(([companyId, scraps]) => ({
      company: companies.find(c => c.id === companyId),
      scraps
    }));
  }, [allScraps, companies]);

  const industryScraps = useMemo(() => 
    allScraps.filter(s => s.companyId === null), 
  [allScraps]);

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-400">스크랩북을 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10 text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-left">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-2xl h-12 w-12 bg-white border border-slate-200 shadow-sm"><ArrowLeft className="w-5 h-5" /></Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 text-left">
                <div className="w-1.5 h-7 bg-blue-600 rounded-full" />
                Scrap <span className="text-blue-600">BOOK</span>
              </h1>
              <p className="text-slate-500 font-medium text-left">수집한 기업 동향과 업계 핫뉴스를 관리하세요.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
          {/* 기업별 스크랩 섹션 */}
          <div className="lg:col-span-8 space-y-8 text-left">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              기업별 뉴스 스크랩
            </h3>
            
            {companyGroupedScraps.length === 0 ? (
              <div className="p-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-bold text-left">
                스크랩한 기업 뉴스가 없습니다.
              </div>
            ) : (
              <div className="grid gap-6 text-left">
                {companyGroupedScraps.map(({ company, scraps }) => (
                  <Card key={company?.id} className="rounded-[2.5rem] border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all text-left">
                    <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 font-bold text-blue-600 text-left shadow-sm">
                          {company?.name[0]}
                        </div>
                        <CardTitle className="text-xl font-black text-slate-900">{company?.name}</CardTitle>
                      </div>
                      <Badge className="bg-blue-100 text-blue-600 border-none font-bold px-3 py-1 rounded-lg text-xs">{scraps.length}개의 스크랩</Badge>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4 text-left">
                      {scraps.map(scrap => (
                        <div key={scrap.id} className="flex items-center justify-between group p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 text-left">
                          <a href={scrap.link} target="_blank" rel="noreferrer" className="flex-1 min-w-0 pr-4 text-left">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors text-left">{scrap.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-left">
                              <span className="text-[10px] text-slate-400 font-bold">{scrap.source}</span>
                              <span className="text-[10px] text-slate-300 font-medium">•</span>
                              <span className="text-[10px] text-slate-400 font-medium">{scrap.pubDate}</span>
                            </div>
                          </a>
                          <div className="flex items-center gap-2 text-left">
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"><a href={scrap.link} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: scrap.id })} className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 일반 핫뉴스 스크랩 섹션 */}
          <div className="lg:col-span-4 space-y-8 text-left">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              업계 전체 동향
            </h3>
            <div className="space-y-4 text-left">
              {industryScraps.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 font-bold text-xs text-left">
                  스크랩한 핫뉴스가 없습니다.
                </div>
              ) : (
                industryScraps.map(scrap => (
                  <Card key={scrap.id} className="rounded-3xl border-slate-200 bg-white hover:border-blue-200 transition-all group overflow-hidden text-left">
                    <CardContent className="p-6 relative text-left">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: scrap.id })} className="absolute top-4 right-4 h-7 w-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></Button>
                      <a href={scrap.link} target="_blank" rel="noreferrer" className="space-y-3 block text-left">
                        <Badge className="bg-red-50 text-red-600 text-[9px] font-black border-none px-2 py-0.5">HOT</Badge>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors text-left">{scrap.title}</h4>
                        <div className="flex items-center gap-2 text-left">
                          <span className="text-[10px] text-slate-400 font-bold">{scrap.source}</span>
                          <span className="text-[10px] text-slate-300 font-medium">•</span>
                          <span className="text-[10px] text-slate-400 font-medium">{scrap.pubDate}</span>
                        </div>
                      </a>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
