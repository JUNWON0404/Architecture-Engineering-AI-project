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
  { href: "/dashboard", label: "Corporate HUB", icon: LayoutDashboardIcon },
  { href: "/my-cover-letters", label: "자기소개서", icon: FileTextIcon },
  { href: "/schedules", label: "취업 일정", icon: CalendarIcon },
  { href: "/scrapbook", label: "스크랩북", icon: BookmarkIcon },
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
      window.location.href = "/login";
    },
    onError: () => toast.error("로그아웃에 실패했습니다."),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-bold tracking-tight">Loading JobReady...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar - 정제된 고밀도 디자인 */}
      <aside
        className={cn(
          "flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
          "bg-sidebar border-r border-sidebar-border shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo 영역 - Bento 포인트 */}
        <div className={cn("flex items-center h-20 px-6 border-b border-sidebar-border", collapsed ? "justify-center" : "gap-4")}>
          <div className="w-10 h-10 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-lg shadow-sidebar-primary/10 shrink-0">
            <BriefcaseIcon className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-xl text-sidebar-primary tracking-tighter leading-none">JobReady</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Beta 1.0</span>
            </div>
          )}
        </div>

        {/* Navigation - 고밀도 아이템 */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {!collapsed && <p className="text-[10px] font-black text-sidebar-foreground/50 uppercase tracking-[0.2em] px-3 mb-4">Main Menu</p>}
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-200 cursor-pointer group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xl shadow-sidebar-primary/10"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0 h-14"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-sidebar-primary-foreground" : "opacity-60 group-hover:opacity-100")} />
                  {!collapsed && <span className="text-sm font-black tracking-tight">{label}</span>}
                  {isActive && !collapsed && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + Controls - 하단 정밀 배색 */}
        <div className="p-4 space-y-3 bg-sidebar/50 border-t border-sidebar-border">
          {!collapsed && (
            <Link href="/profile">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-sidebar border border-sidebar-border hover:border-indigo-400/50 transition-all cursor-pointer group shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center shrink-0 border border-sidebar-border group-hover:bg-indigo-500/10 transition-colors">
                  <UserIcon className="w-5 h-5 text-sidebar-foreground group-hover:text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-sidebar-foreground truncate">{user?.name ?? "사용자"}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate font-bold uppercase tracking-tighter">{user?.email?.split('@')[0] ?? ""}</p>
                </div>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center flex-1 h-11 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all shadow-sm"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                <span className="text-xs font-bold">Collapse</span>
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center w-12 h-11 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all shadow-sm mx-auto mt-2"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => logoutMutation.mutate()}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sidebar-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all text-xs font-black",
              collapsed && "justify-center"
            )}
          >
            <LogOutIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-background transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
