import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { differenceInCalendarDays, endOfWeek, format, isWithinInterval, parseISO, startOfMonth, startOfQuarter, startOfWeek } from "date-fns";
import { ArrowRight, BookOpen, Check, FileText, Lightbulb, Plus, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useGoals } from "@/hooks/useGoals";
import { useFeedback } from "@/hooks/useFeedback";
import { useLogWin } from "@/contexts/LogWinContext";
import { TEAMS_ENABLED } from "@/lib/features";
import { buildReview, periodOptions } from "@/lib/review";
import { Mascot } from "@/components/landing/Mascot";
import { EmptyState, ListSkeleton, Page, StatTile, WinRow } from "@/components/app/ui";
import { FeedbackCard, ActionItemList } from "@/components/FeedbackComponents";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Old dashboard tabs now live on their own pages.
const LEGACY_TABS: Record<string, string> = {
  review: "/reviews",
  settings: "/settings",
  activities: "/wins",
  weekly: "/wins?view=week",
  categories: "/wins?view=category",
  quarter: "/wins?view=quarter",
};

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const { activities, loading: loadingWins } = useActivities();
  const { checkIns, loading: loadingReflections } = useCheckIns();
  const { goals, loading: loadingGoals } = useGoals();
  const { feedback, actionItems, acknowledgeFeedback, updateActionItemStatus } = useFeedback();
  const openLogWin = useLogWin();

  useEffect(() => {
    const target = LEGACY_TABS[searchParams.get("tab") ?? ""];
    if (target) navigate(target, { replace: true });
  }, [searchParams, navigate]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const quarter = periodOptions(now).quarter[0];

  const stats = useMemo(() => {
    const thisWeek = activities.filter((a) => isWithinInterval(parseISO(a.date), { start: weekStart, end: weekEnd })).length;
    const review = buildReview(activities, checkIns, quarter);
    const reflectionsThisMonth = checkIns.filter((c) => parseISO(c.weekStart) >= startOfMonth(now)).length;
    const reflectedThisWeek = checkIns.some((c) => isWithinInterval(parseISO(c.weekStart), { start: weekStart, end: weekEnd }));
    return { thisWeek, review, reflectionsThisMonth, reflectedThisWeek };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, checkIns]);

  // Gentle, on-brand nudges based on real data (at most two).
  const nudges = useMemo(() => {
    const list: { key: string; icon: typeof BookOpen; text: string; to: string; cta: string }[] = [];
    const day = now.getDay(); // 0 Sun … 6 Sat
    if (!stats.reflectedThisWeek && (day === 0 || day >= 4)) {
      list.push({ key: "reflect", icon: BookOpen, text: "Take a moment to reflect on your week.", to: "/reflections", cta: "Write a reflection" });
    }
    const soon = goals
      .filter((g) => g.status !== "completed")
      .map((g) => ({ g, days: differenceInCalendarDays(parseISO(g.endDate), now) }))
      .filter(({ days }) => days >= 0 && days <= 7)
      .sort((a, b) => a.days - b.days)[0];
    if (soon) {
      list.push({
        key: "goal", icon: Target,
        text: `"${soon.g.title}" wraps up ${soon.days === 0 ? "today" : soon.days === 1 ? "tomorrow" : `in ${soon.days} days`}. A good moment to update its progress.`,
        to: "/goals", cta: "Open goals",
      });
    }
    const missingImpact = stats.review.wins.length - stats.review.withImpact;
    if (missingImpact > 0) {
      list.push({
        key: "impact", icon: Lightbulb,
        text: `${missingImpact} of your wins this quarter ${missingImpact === 1 ? "has" : "have"} no impact noted. Adding what changed makes them stronger evidence.`,
        to: "/wins", cta: "Review wins",
      });
    }
    return list.slice(0, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, stats]);

  const setup = [
    { done: activities.length > 0, label: "Log your first win" },
    { done: checkIns.length > 0, label: "Write a weekly reflection" },
    { done: goals.length > 0, label: "Set a goal" },
  ];
  const setupDone = setup.filter((s) => s.done).length;
  const loading = loadingWins || loadingReflections || loadingGoals;
  const firstName = userProfile?.fullName?.split(" ")[0];
  const activeGoals = goals.filter((g) => g.status !== "completed");

  return (
    <Page>
      <header className="space-y-1">
        <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold tracking-[-0.02em]">
          {greeting(now)}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {loading ? "Getting your week together…" : stats.thisWeek > 0
            ? `You've logged ${stats.thisWeek} win${stats.thisWeek === 1 ? "" : "s"} this week. Look at you go.`
            : "No wins logged yet this week. What went well today?"}
        </p>
      </header>

      {/* Primary action */}
      <section className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border-2 border-foreground bg-foreground px-6 py-5 text-background dark:border-pastel-violet dark:bg-pastel-violet dark:text-foreground">
        <div className="space-y-1">
          <p className="text-xl font-extrabold">Got a win? Save it while it's fresh.</p>
          <p className="text-sm text-background/75 dark:text-muted-foreground">A couple of sentences will do.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openLogWin()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-background px-6 font-bold text-foreground transition-transform dark:bg-foreground dark:text-background hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Log a win
          </button>
          <Mascot className="hidden h-20 w-16 sm:block" />
        </div>
      </section>

      {/* First-run checklist */}
      {!loading && setupDone < setup.length && (
        <section aria-labelledby="setup-heading" className="flex flex-col gap-3 rounded-2xl bg-pastel-violet p-5 md:flex-row md:items-center md:gap-6">
          <div className="min-w-[180px] space-y-2">
            <h2 id="setup-heading" className="font-extrabold">Get set up · {setupDone} of {setup.length}</h2>
            <Progress value={(setupDone / setup.length) * 100} className="h-2 bg-background/70" aria-label={`${setupDone} of ${setup.length} setup steps done`} />
          </div>
          <ul className="flex flex-wrap gap-2">
            {setup.map(({ done, label }, i) => (
              <li key={label}>
                {done ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-sm text-muted-foreground line-through">
                    <Check className="h-4 w-4 text-success" aria-hidden="true" /> {label}
                  </span>
                ) : i === 0 ? (
                  <button type="button" onClick={() => openLogWin()} className="rounded-full bg-foreground px-3 py-1.5 text-sm font-bold text-background">{label}</button>
                ) : (
                  <Link to={i === 1 ? "/reflections" : "/goals"} className="inline-block rounded-full border-2 border-foreground bg-background px-3 py-1 text-sm font-bold">{label}</Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Real numbers only */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile tint="blue" label="Wins this week" value={stats.thisWeek} note={`Week of ${format(weekStart, "MMM d")}`} />
          <StatTile tint="violet" label={`Wins in ${quarter.label}`} value={stats.review.wins.length} note="So far this quarter" />
          <StatTile tint="pink" label="With impact noted" value={stats.review.wins.length ? `${stats.review.withImpact} of ${stats.review.wins.length}` : "—"} note={`Wins in ${quarter.label}`} />
          <StatTile tint="ink" label="Reflections" value={stats.reflectionsThisMonth} note={`In ${format(now, "MMMM")}`} />
        </div>
      )}

      {nudges.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {nudges.map(({ key, icon: Icon, text, to, cta }) => (
            <li key={key} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pastel-blue text-pastel-blue-ink"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="space-y-1">
                <p className="text-sm">{text}</p>
                <Link to={to} className="text-sm font-bold text-accent hover:underline">{cta}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Recent wins */}
        <section aria-labelledby="recent-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-extrabold">Recent wins</h2>
            {activities.length > 0 && <Link to="/wins" className="text-sm font-bold text-accent hover:underline">See all</Link>}
          </div>
          {loadingWins ? (
            <ListSkeleton rows={3} />
          ) : activities.length === 0 ? (
            <EmptyState
              title="Your story starts with your first win."
              body="Fixed something? Helped someone? Made a thing a little better? That counts."
              action={<button type="button" onClick={() => openLogWin()} className="mt-1 rounded-full bg-foreground px-5 py-2.5 font-bold text-background">Save your first win</button>}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {activities.slice(0, 5).map((win) => <WinRow key={win.id} win={win} onEdit={openLogWin} />)}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* Review preparation */}
          <section aria-labelledby="review-heading" className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pastel-pink text-pastel-pink-ink"><FileText className="h-5 w-5" aria-hidden="true" /></span>
              <h2 id="review-heading" className="font-extrabold leading-tight">Prepare my performance review</h2>
            </div>
            {loading ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : (
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted p-2"><dt className="text-xs text-muted-foreground">Wins</dt><dd className="text-xl font-extrabold">{stats.review.wins.length}</dd></div>
                <div className="rounded-xl bg-muted p-2"><dt className="text-xs text-muted-foreground">With impact</dt><dd className="text-xl font-extrabold">{stats.review.withImpact}</dd></div>
                <div className="rounded-xl bg-muted p-2"><dt className="text-xs text-muted-foreground">Reflections</dt><dd className="text-xl font-extrabold">{stats.review.reflections.length}</dd></div>
              </dl>
            )}
            <p className="text-sm text-muted-foreground">Everything you've recorded in {quarter.label}, ready to turn into a summary and PDF.</p>
            <Link to="/reviews" className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-foreground font-bold transition-colors hover:bg-muted">
              Prepare review <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          {/* Goals, only when there are some */}
          {activeGoals.length > 0 && (
            <section aria-labelledby="goals-heading" className="space-y-4 rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 id="goals-heading" className="font-extrabold">Goals</h2>
                <Link to="/goals" className="text-sm font-bold text-accent hover:underline">All goals</Link>
              </div>
              <ul className="space-y-4">
                {activeGoals.slice(0, 3).map((g) => (
                  <li key={g.id} className="space-y-1.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate font-semibold">{g.title}</span>
                      <span className={cn("shrink-0", g.status === "at_risk" || g.status === "behind" ? "font-bold text-pastel-pink-ink" : "text-muted-foreground")}>
                        {g.status === "at_risk" ? "At risk · " : g.status === "behind" ? "Behind · " : ""}{g.progress}%
                      </span>
                    </div>
                    <Progress value={g.progress} className="h-2" aria-label={`${g.title}: ${g.progress}%`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Team features (v2) */}
          {TEAMS_ENABLED && (feedback.length > 0 || actionItems.length > 0) && (
            <section className="space-y-3 rounded-2xl border bg-card p-5">
              <h2 className="font-extrabold">From your manager</h2>
              {[...feedback].sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged)).slice(0, 2).map((item) => (
                <FeedbackCard key={item.id} feedback={item} onAcknowledge={acknowledgeFeedback} />
              ))}
              {actionItems.length > 0 && <ActionItemList items={actionItems} onUpdateStatus={updateActionItemStatus} />}
            </section>
          )}
        </div>
      </div>
    </Page>
  );
}
