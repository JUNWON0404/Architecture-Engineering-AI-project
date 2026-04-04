import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Building2, MapPin, Users2, Briefcase, X } from "lucide-react";

interface Company {
  id: number;
  name: string;
  sector: string;
  established?: number;
  employees?: string;
  revenue?: string;
  location?: string;
  website?: string;
  description?: string;
  thumbnail?: string;
  jobPostingsCount?: number;
}

interface JobPosting {
  id: number;
  companyId: number;
  title: string;
  position: string;
  description?: string;
  requiredMajors?: string;
  salary?: string;
  location?: string;
  deadline?: number;
  postedAt: number;
  isActive: number;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // tRPC useQuery 훅 사용
  const { data: companies = [], isLoading: loading, error } = trpc.company.list.useQuery();
  
  // 선택된 회사의 채용공고 조회
  const { data: jobPostings = [], isLoading: jobsLoading } = trpc.company.jobPostings.useQuery(
    { companyId: selectedCompanyId || 0 },
    { enabled: !!selectedCompanyId }
  );

  const filteredCompanies = (companies as Company[]).filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompany = (companies as Company[]).find((c) => c.id === selectedCompanyId);

  if (error) {
    console.error("[Home] tRPC error:", error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">🏢 건설 기업 채용 정보</h1>
          <p className="text-slate-600">관심 있는 건설 기업의 채용 공고를 한 곳에서 확인하세요</p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 검색 바 */}
        <div className="mb-8">
          <Input
            placeholder="회사명 또는 분야로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300"
          />
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="bg-white border-slate-200 animate-pulse">
                <CardHeader className="pb-3 bg-gradient-to-r from-slate-200 to-slate-100 h-20" />
                <CardContent className="space-y-3 pt-6">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-10 bg-slate-200 rounded mt-6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="bg-white border-slate-200 text-center py-16">
            <CardContent>
              <p className="text-lg text-slate-600 mb-4">검색 결과가 없습니다.</p>
              <Button 
                variant="outline"
                onClick={() => setSearchTerm("")}
              >
                검색 초기화
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card 
                key={company.id} 
                className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default border-slate-200"
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        {company.name}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-600">
                        {company.sector}
                      </CardDescription>
                    </div>
                    {(company.jobPostingsCount ?? 0) > 0 && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {company.jobPostingsCount} 공고
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* 회사 정보 */}
                  {company.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{company.location}</span>
                    </div>
                  )}

                  {company.employees && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users2 className="w-4 h-4 text-slate-400" />
                      <span>{company.employees}</span>
                    </div>
                  )}

                  {company.description && (
                    <p className="text-sm text-slate-700 line-clamp-2 mt-3">
                      {company.description}
                    </p>
                  )}

                  {(company.established || company.revenue) && (
                    <div className="pt-2 space-y-1 text-xs text-slate-500">
                      {company.established && (
                        <p>
                          <span className="font-medium">설립:</span> {company.established}년
                        </p>
                      )}
                      {company.revenue && (
                        <p>
                          <span className="font-medium">매출:</span> {company.revenue}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-slate-600 hover:bg-slate-100"
                    >
                      상세보기
                    </Button>
                    <Button 
                      size="sm" 
                      className={`flex-1 ${(company.jobPostingsCount ?? 0) > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                      disabled={(company.jobPostingsCount ?? 0) === 0}
                      onClick={() => (company.jobPostingsCount ?? 0) > 0 && setSelectedCompanyId(company.id)}
                      title={(company.jobPostingsCount ?? 0) === 0 ? '등록된 채용공고가 없습니다' : `${company.jobPostingsCount}개의 채용공고`}
                    >
                      <Briefcase className="w-4 h-4 mr-1" />
                      채용공고 ({company.jobPostingsCount ?? 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 채용공고 모달 */}
        {selectedCompanyId && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white border-0 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2 text-slate-900">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    {selectedCompany.name}
                  </CardTitle>
                  <CardDescription className="mt-2 text-slate-600">{selectedCompany.sector}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedCompanyId(null)}
                  className="text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-6 text-slate-900 p-6">
                {/* 회사 기본정보 */}
                <div className="space-y-2 pb-4 border-b border-slate-200">
                  {selectedCompany.location && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{selectedCompany.location}</span>
                    </div>
                  )}
                  {selectedCompany.employees && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users2 className="w-4 h-4 text-slate-500" />
                      <span>{selectedCompany.employees}</span>
                    </div>
                  )}
                  {selectedCompany.description && (
                    <p className="text-slate-700 mt-3">{selectedCompany.description}</p>
                  )}
                </div>

                {/* 채용공고 리스트 */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    채용공고 ({jobPostings.length})
                  </h3>

                  {jobsLoading ? (
                    <div className="text-center py-6 text-slate-500">로딩 중...</div>
                  ) : (jobPostings as JobPosting[]).length === 0 ? (
                    <div className="text-center py-6 text-slate-500">등록된 채용공고가 없습니다.</div>
                  ) : (
                    <div className="space-y-3">
                      {(jobPostings as JobPosting[]).map((job) => (
                        <div key={job.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-base text-slate-900">{job.title}</h4>
                              <p className="text-sm text-slate-600">{job.position}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded font-medium ${job.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {job.isActive ? '활성' : '마감'}
                            </span>
                          </div>

                          {job.description && (
                            <p className="text-sm text-slate-700 mb-3 line-clamp-2">{job.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                            {job.salary && (
                              <div>
                                <span className="font-medium text-slate-900">연봉:</span> {job.salary}
                              </div>
                            )}
                            {job.location && (
                              <div>
                                <span className="font-medium text-slate-900">근무지:</span> {job.location}
                              </div>
                            )}
                          </div>

                          {job.requiredMajors && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-sm font-medium text-slate-900 mb-2">요구 전공:</p>
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(job.requiredMajors).map((major: string, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                    {major}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 통계 */}
        {!loading && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {companies.length}
                  </div>
                  <p className="text-sm text-slate-600">등록된 기업</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {(companies as Company[]).filter((c) => c.sector === "건설").length}
                  </div>
                  <p className="text-sm text-slate-600">건설 기업</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {(companies as Company[]).reduce((sum, c) => sum + (c.jobPostingsCount ?? 0), 0)}
                  </div>
                  <p className="text-sm text-slate-600">활성 채용공고</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

