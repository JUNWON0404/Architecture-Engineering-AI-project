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
  SunIcon,
  MoonIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboardIcon },
  { href: "/cover-letters", label: "자기소개서", icon: FileTextIcon },
  { href: "/interview", label: "면접 질문", icon: MessageSquareIcon },
  { href: "/resumes", label: "이력서", icon: BriefcaseIcon },
  { href: "/schedules", label: "취업 일정", icon: CalendarIcon },
  { href: "/checklist", label: "체크리스트", icon: CheckSquareIcon },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  const { user, loading } = useAuth({
    redirectOnUnauthenticated: true,
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed ? "justify-center" : "gap-3")}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm">
                <BriefcaseIcon className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-sidebar-foreground tracking-tight">JobReady</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm">
              <BriefcaseIcon className="w-4 h-4 text-sidebar-primary-foreground" />
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
                      ? "bg-sidebar-accent text-sidebar-primary font-bold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-sidebar-border p-3 space-y-2 bg-sidebar/50">
          {!collapsed && (
            <Link href="/profile">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/60 cursor-pointer transition-colors border border-transparent hover:border-sidebar-border/50">
                <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0 border border-sidebar-primary/20">
                  <UserIcon className="w-4 h-4 text-sidebar-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-sidebar-foreground truncate">{user?.name ?? "사용자"}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate font-medium">{user?.email ?? ""}</p>
                </div>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleTheme?.()}
              className={cn(
                "flex items-center justify-center flex-1 h-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors",
                collapsed && "px-0"
              )}
              title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
            >
              {theme === "light" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center flex-1 h-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-full h-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors mt-2"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => logoutMutation.mutate()}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors text-xs font-medium",
              collapsed && "justify-center"
            )}
          >
            <LogOutIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
