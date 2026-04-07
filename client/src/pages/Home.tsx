import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { DESIRED_JOB_ROLES_STORAGE_KEY, REPRESENTATIVE_JOB_ROLES } from "@shared/const";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  House,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Plus,
  Target,
  User,
  Users2,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const CUSTOM_ROLE_MAX_LEN = 40;

/** 메인 홈에서 바로 이동할 수 있는 취업 준비 영역 (AppLayout 사이드바와 동일 경로) */
const MAIN_HUB_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "홈", Icon: House },
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/cover-letters", label: "자기소개서", Icon: FileText },
  { href: "/interview", label: "면접 질문", Icon: MessageSquare },
  { href: "/resumes", label: "이력서", Icon: Briefcase },
  { href: "/schedules", label: "취업 일정", Icon: Calendar },
  { href: "/bookmarks", label: "기업 북마크", Icon: Bookmark },
  { href: "/checklist", label: "체크리스트", Icon: CheckSquare },
  { href: "/profile", label: "프로필", Icon: User },
];

function navItemActive(href: string, location: string): boolean {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(`${href}/`);
}

function parseStoredJobRoles(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

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
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [desiredRoles, setDesiredRoles] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStoredJobRoles(localStorage.getItem(DESIRED_JOB_ROLES_STORAGE_KEY));
  });
  const [customRoleInput, setCustomRoleInput] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(DESIRED_JOB_ROLES_STORAGE_KEY, JSON.stringify(desiredRoles));
    } catch {
      /* 저장소 불가 시 무시 */
    }
  }, [desiredRoles]);

  function toggleRepresentativeRole(label: string) {
    setDesiredRoles((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]
    );
  }

  function addCustomRole() {
    const trimmed = customRoleInput.trim().slice(0, CUSTOM_ROLE_MAX_LEN);
    if (!trimmed) return;
    setDesiredRoles((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomRoleInput("");
  }

  function removeRole(label: string) {
    setDesiredRoles((prev) => prev.filter((r) => r !== label));
  }

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
      {/* 메인 허브: 브랜딩 + 전역 네비 (취업 준비의 시작점) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">JobReady · 메인</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                취업 준비는 여기서 시작
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base max-w-2xl">
                <span className="font-medium text-slate-800">1) 희망 직무</span>를 정하고,{" "}
                <span className="font-medium text-slate-800">2) 건설 기업·채용</span> 정보를 살펴보세요.
                아래 메뉴에서 서류·일정·북마크 등 다른 준비 화면으로 바로 갈 수 있습니다.
              </p>
              {desiredRoles.length > 0 && (
                <p className="text-sm text-indigo-700 font-medium mt-2">
                  희망 직무 {desiredRoles.length}개 선택됨
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-slate-300">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  회원가입
                </Button>
              </Link>
            </div>
          </div>

          <nav
            className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
            aria-label="취업 준비 메뉴"
          >
            {MAIN_HUB_NAV.map(({ href, label, Icon }) => {
              const active = navItemActive(href, location);
              return (
                <Link key={href} href={href}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200"
                        : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/90"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 희망 직무 선택 */}
        <Card
          className={`mb-8 border-slate-200 bg-white shadow-sm ${
            desiredRoles.length === 0 ? "ring-2 ring-indigo-200/80" : ""
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded">1</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">먼저</span>
            </div>
            <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
              <Target className="w-5 h-5 text-indigo-600" />
              희망 직무 선택
            </CardTitle>
            <CardDescription className="text-slate-600">
              먼저 가고 싶은 직무 방향을 골라 주세요. 여러 개 선택할 수 있고, 목록에 없으면 아래에서 직접 추가할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">대표 직무</p>
              <div className="flex flex-wrap gap-2">
                {REPRESENTATIVE_JOB_ROLES.map((role) => {
                  const selected = desiredRoles.includes(role);
                  return (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className={
                        selected
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }
                      onClick={() => toggleRepresentativeRole(role)}
                    >
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">직접 추가</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="예: 친환경 인증 컨설팅"
                  value={customRoleInput}
                  maxLength={CUSTOM_ROLE_MAX_LEN}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomRole();
                    }
                  }}
                  className="sm:max-w-md border-slate-300"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={addCustomRole}
                  disabled={!customRoleInput.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">최대 {CUSTOM_ROLE_MAX_LEN}자</p>
            </div>

            {desiredRoles.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">선택한 직무</p>
                <div className="flex flex-wrap gap-2">
                  {desiredRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-1 text-sm"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        className="rounded-full p-0.5 hover:bg-indigo-200/80 text-indigo-800"
                        aria-label={`${role} 제거`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {desiredRoles.length === 0 && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                직무를 하나 이상 선택하거나 추가하면, 이후 맞춤 기능(공고 연결 등)을 붙이기 쉬워집니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 검색 바 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded">2</span>
          <h2 className="text-lg font-semibold text-slate-900">건설 기업·채용 찾기</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          회사명·분야로 검색한 뒤 카드에서 채용공고를 열 수 있습니다.
        </p>
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

