import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboardIcon },
  { href: "/cover-letters", label: "자기소개서", icon: FileTextIcon },
  { href: "/interview", label: "면접 질문", icon: MessageSquareIcon },
  { href: "/resumes", label: "이력서", icon: BriefcaseIcon },
  { href: "/schedules", label: "취업 일정", icon: CalendarIcon },
  { href: "/bookmarks", label: "기업 북마크", icon: BookmarkIcon },
  { href: "/checklist", label: "체크리스트", icon: CheckSquareIcon },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // 개발 환경에서는 인증 체크 스킵 (기능 개발 용이)
  const isDev = import.meta.env.DEV;
  
  // useAuth: 사용자 정보 조회 및 인증 상태 확인
  // 개발환경에서는 redirectOnUnauthenticated를 false로 설정하여 인증 없이도 접근 가능
  const { user, loading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: !isDev,
    redirectPath: "/login",
  });
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => toast.error("로그아웃에 실패했습니다."),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 개발 환경에서는 인증 없이도 계속 진행
  if (!isAuthenticated && !isDev) {
    const loginUrl = getLoginUrl();
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">이 페이지를 이용하려면 로그인해 주세요.</p>
          {loginUrl ? (
            <a
              href={loginUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              로그인하기
            </a>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              홈으로
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
          "bg-[var(--sidebar)] text-[var(--sidebar-foreground)]",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-[var(--sidebar-border)]", collapsed ? "justify-center" : "gap-3")}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-primary)] flex items-center justify-center">
                <BriefcaseIcon className="w-4 h-4 text-[var(--sidebar-primary-foreground)]" />
              </div>
              <span className="font-bold text-lg text-[var(--sidebar-foreground)] tracking-tight">JobReady</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-primary)] flex items-center justify-center">
              <BriefcaseIcon className="w-4 h-4 text-[var(--sidebar-primary-foreground)]" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer group",
                    isActive
                      ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)]"
                      : "text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)]/60 hover:text-[var(--sidebar-foreground)]",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-[var(--sidebar-primary)]")} />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-[var(--sidebar-border)] p-3 space-y-2">
          {!collapsed && (
            <Link href="/profile">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--sidebar-accent)]/60 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[var(--sidebar-primary)]/20 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-[var(--sidebar-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--sidebar-foreground)] truncate">{user?.name ?? "사용자"}</p>
                  <p className="text-xs text-[var(--sidebar-foreground)]/50 truncate">{user?.email ?? ""}</p>
                </div>
              </div>
            </Link>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[var(--sidebar-foreground)]/60 hover:text-destructive hover:bg-destructive/10 transition-colors text-sm",
              collapsed && "justify-center"
            )}
          >
            <LogOutIcon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>로그아웃</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 rounded-lg text-[var(--sidebar-foreground)]/40 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/40 transition-colors"
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
