import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLogWin } from "@/contexts/LogWinContext";
import { UserMenu } from "@/components/UserMenu";
import { WinfolioMark } from "@/components/brand/Brand";
import { TEAMS_ENABLED } from "@/lib/features";
import { cn } from "@/lib/utils";
import { BookOpen, FileText, Home, Menu, Plus, Settings, Shield, Sparkles, Target, Users, X } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

const MAIN_NAV: NavItem[] = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Wins", icon: Sparkles, path: "/wins" },
  { label: "Reflections", icon: BookOpen, path: "/reflections" },
  { label: "Goals", icon: Target, path: "/goals" },
  { label: "Reviews", icon: FileText, path: "/reviews" },
  ...(TEAMS_ENABLED ? [{ label: "Team", icon: Users, path: "/manager", roles: ["manager", "admin"] }] : []),
  { label: "Admin", icon: Shield, path: "/admin", roles: ["admin"] },
];

function NavItems({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      {items.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) => cn(
            "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors",
            isActive ? "bg-pastel-violet text-pastel-violet-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { userRole } = useAuth();
  const openLogWin = useLogWin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  // Close the mobile menu when the page changes.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Keep the closed drawer out of the tab order (React 18 has no typed `inert` prop).
  useEffect(() => {
    if (drawerRef.current) drawerRef.current.inert = !mobileOpen;
  }, [mobileOpen]);

  const nav = MAIN_NAV.filter((item) => !item.roles || item.roles.includes(userRole));
  const settings: NavItem[] = [{ label: "Settings", icon: Settings, path: "/settings" }];

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <NavLink to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 rounded-xl px-1">
        <WinfolioMark variant="pastel" className="h-9 w-9 shrink-0" />
        <span className="text-lg font-extrabold tracking-tight">Winfolio</span>
      </NavLink>

      <button
        type="button"
        onClick={() => { onNavigate?.(); openLogWin(); }}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-foreground bg-foreground px-4 font-bold text-background shadow-[3px_3px_0_hsl(var(--pastel-violet-ink)/0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Log a win
      </button>

      <nav aria-label="Main" className="flex flex-col gap-1">
        <NavItems items={nav} onNavigate={onNavigate} />
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <NavItems items={settings} onNavigate={onNavigate} />
        <div className="flex items-center gap-2 border-t pt-3">
          <UserMenu />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r bg-card lg:block">
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <aside
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-card transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-4 rounded-lg p-2 hover:bg-muted"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {sidebar(() => setMobileOpen(false))}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[248px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-muted">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <WinfolioMark variant="pastel" className="h-7 w-7" />
            <span className="font-extrabold tracking-tight">Winfolio</span>
          </NavLink>
          <button
            type="button"
            onClick={() => openLogWin()}
            aria-label="Log a win"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
