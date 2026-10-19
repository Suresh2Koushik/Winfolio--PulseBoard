import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { WinfolioMark } from "@/components/brand/Brand";
import { TEAMS_ENABLED } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  
  Target,
  CheckCircle2,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
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
  ...(TEAMS_ENABLED ? [{ label: "Manager", icon: Users, path: "/manager", roles: ["manager", "admin"] }] : []),
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Reflections", icon: CheckCircle2, path: "/check-ins" },
  { label: "Goals", icon: Target, path: "/goals" },
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
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
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

  // "/dashboard?tab=review" is its own nav item, so the plain Dashboard item
  // should not also light up while the Reviews tab is open.
  const isActive = (path: string) => {
    const [pathname, search] = path.split("?");
    if (location.pathname !== pathname) return false;
    const tab = new URLSearchParams(location.search).get("tab");
    if (search) return tab === new URLSearchParams(search).get("tab");
    return pathname !== "/dashboard" || tab !== "review";
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
          <WinfolioMark variant="pastel" className="w-9 h-9 shrink-0" />
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-lg font-extrabold tracking-tight leading-tight">Winfolio</p>
              <p className="text-[11px] text-muted-foreground font-medium">Every win deserves a place.</p>
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
                onClick={() => navigate(item.path)}
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
            <WinfolioMark variant="pastel" className="w-9 h-9" />
            <p className="text-lg font-extrabold tracking-tight">Winfolio</p>
          </div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="p-2 hover:bg-muted rounded-lg">
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
                onClick={() => navigate(item.path)}
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
              aria-label="Open navigation"
              className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div>
              <h2 className="text-lg font-semibold">
                {filteredNav.find((n) => isActive(n.path))?.label || "Winfolio"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
