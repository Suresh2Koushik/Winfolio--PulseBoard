import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BarChart3,
  Target,
  CheckCircle2,
  Sparkles,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Search,
  Bell,
  Menu,
  X,
  Shield,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Check-Ins", icon: CheckCircle2, path: "/check-ins" },
  { label: "Goals", icon: Target, path: "/goals" },
  { label: "Manager", icon: Users, path: "/manager", roles: ["manager", "admin"] },
  { label: "Reviews", icon: Sparkles, path: "/dashboard?tab=review" },
  { label: "Admin", icon: Shield, path: "/admin", roles: ["admin"] },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // On mount, check saved preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
    } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center
        bg-muted/50 hover:bg-muted transition-all duration-300
        hover:scale-105 active:scale-95"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className={`h-4 w-4 absolute transition-all duration-500 ${dark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon className={`h-4 w-4 absolute transition-all duration-500 ${dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"}`} />
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, userRole, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const isActive = (path: string) => {
    if (path.includes("?")) return location.pathname + location.search === path;
    return location.pathname === path;
  };

  const initials = userProfile?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen flex bg-background">
      {/* ───── Desktop Sidebar ───── */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40
          border-r border-border/50 bg-card/80 backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-border/50 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                PulseBoard
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Performance Intelligence</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path.split("?")[0])}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5
                  transition-all duration-200 group relative
                  ${active
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                  ${collapsed ? "justify-center px-0" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "text-primary" : "group-hover:scale-110"}`} />
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-border/50 space-y-2">
          <ThemeToggle />
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2
              text-muted-foreground hover:text-foreground hover:bg-muted/50
              transition-all duration-200 text-sm"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ───── Mobile Overlay ───── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ───── Mobile Sidebar ───── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[280px]
          bg-card border-r border-border/50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gradient">PulseBoard</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{userProfile?.fullName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path.split("?")[0])}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3
                  transition-all duration-200
                  ${active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5
              text-destructive hover:bg-destructive/10 transition-all text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ───── Main Content Area ───── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div>
              <h2 className="text-lg font-semibold">
                {filteredNav.find((n) => isActive(n.path))?.label || "PulseBoard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl
              bg-muted/50 hover:bg-muted text-muted-foreground text-sm
              transition-all duration-200 border border-border/50">
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-muted rounded-xl transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* Desktop theme toggle */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
