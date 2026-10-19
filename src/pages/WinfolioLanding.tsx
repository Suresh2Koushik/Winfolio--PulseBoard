import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, Briefcase, Download, FileSpreadsheet, FileText, LockKeyhole, PenLine, Sparkles, Sprout, TrendingUp,
} from "lucide-react";
import { BrandVariant, WinfolioLogo } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

/**
 * Winfolio marketing page. Copy is limited to what the product does today:
 * every claim here is covered by the app's tests (see docs/LAUNCH_CHECKLIST.md).
 *
 * Class sets per visual direction are written out in full so Tailwind sees them.
 */
const THEMES = {
  pastel: {
    page: "bg-[#FAFAFC] text-[#0B0B12]",
    surface: "bg-white border-[#EEEEF3]",
    muted: "text-[#4A4A57]",
    subtle: "text-[#5A5A66]",
    primary: "bg-[#0B0B12] text-white hover:bg-[#26263A]",
    link: "text-[#4A4A57] hover:text-[#0B0B12]",
    textLink: "text-[#5B21B6] hover:text-[#3B0F86]",
    focus: "focus-visible:ring-[#5B21B6]",
    tints: [
      { bg: "bg-[#DCEBFF]", ink: "text-[#1E40AF]" },
      { bg: "bg-[#ECE6FF]", ink: "text-[#5B21B6]" },
      { bg: "bg-[#FFE1EC]", ink: "text-[#9D174D]" },
    ],
    band: "bg-[#0B0B12] text-white",
    bandMuted: "text-[#C9C9D6]",
    bandButton: "bg-white text-[#0B0B12] hover:bg-[#ECE6FF]",
    accent: "text-[#5B21B6]",
    divider: "border-[#EEEEF3]",
    sample: "bg-[#F1F1F6] text-[#4A4A57]",
  },
  forest: {
    page: "bg-[#F7F7F2] text-[#16241B]",
    surface: "bg-white border-[#E3E5DC]",
    muted: "text-[#45524A]",
    subtle: "text-[#55615A]",
    primary: "bg-[#24583C] text-white hover:bg-[#1C4730]",
    link: "text-[#45524A] hover:text-[#16241B]",
    textLink: "text-[#24583C] hover:text-[#163A27]",
    focus: "focus-visible:ring-[#24583C]",
    tints: [
      { bg: "bg-[#E4F0E5]", ink: "text-[#24583C]" },
      { bg: "bg-[#FBF0DC]", ink: "text-[#8A5A12]" },
      { bg: "bg-[#E8EEF7]", ink: "text-[#2F4A6E]" },
    ],
    band: "bg-[#24583C] text-white",
    bandMuted: "text-[#D3E6D6]",
    bandButton: "bg-[#E9B96E] text-[#16241B] hover:bg-[#F1CB8E]",
    accent: "text-[#24583C]",
    divider: "border-[#E3E5DC]",
    sample: "bg-[#EFF1EA] text-[#45524A]",
  },
} as const;

const HABITS = [
  { icon: PenLine, title: "Capture", benefit: "Nothing worth mentioning gets lost.", body: "Log a win in under a minute. Add the outcome in your own words; no forced metrics." },
  { icon: BookOpen, title: "Reflect", benefit: "You see how you're growing.", body: "Once a week, note what went well, what was hard and what's next." },
  { icon: FileText, title: "Showcase", benefit: "You walk in prepared.", body: "Pick a month, a quarter or any date range, and download your wins with their impact, plus your weekly reflections." },
];

const MOMENTS = [
  { icon: Briefcase, title: "When appraisal season arrives", body: "Your wins and reflections are already there for whatever period your review covers, so you spend your time on the conversation instead of reconstructing the year." },
  { icon: Sprout, title: "When you want to see your growth", body: "Look back across weeks and quarters at the projects, problems and lessons that show how your work has grown." },
  { icon: TrendingUp, title: "When a new opportunity comes along", body: "Pull concrete examples for promotion discussions, career conversations and interviews from a record you already have." },
];

const TRUST = [
  { icon: LockKeyhole, title: "Private to your account", body: "Only you can read your journal. Not other members, and not Winfolio's in-app admins: it's enforced on our servers, not just hidden in the app." },
  { icon: Download, title: "Yours to take with you", body: "Export your wins to Excel, or download a review PDF with your wins, their impact and your reflections, whenever you want." },
  { icon: FileSpreadsheet, title: "Bring your history", body: "Already keep a spreadsheet? Import it with our template; rows are checked before they're saved." },
];

// Staggered entrance; skipped when the user prefers reduced motion.
const reveal = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both";

interface Props {
  variant: BrandVariant;
  /** Show the bar that switches between the two directions (comparison routes only). */
  showPreviewSwitch?: boolean;
}

export default function WinfolioLanding({ variant, showPreviewSwitch = false }: Props) {
  const t = THEMES[variant];
  const other = variant === "pastel" ? "forest" : "pastel";
  const button = cn(
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]",
    t.focus,
  );
  const sampleLabel = cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", t.sample);

  return (
    <div className={cn("min-h-screen font-['Plus_Jakarta_Sans',system-ui,sans-serif]", t.page)}>
      {showPreviewSwitch && (
        <div className="bg-[#16161D] px-4 py-2 text-center text-sm text-white">
          Preview: {variant === "pastel" ? "Version 1 · Pastel mix" : "Version 2 · Forest green"}
          {" · "}
          <Link to={`/preview/${other}`} className="font-semibold underline underline-offset-4 hover:no-underline">
            Switch to {other === "pastel" ? "Version 1 · Pastel mix" : "Version 2 · Forest green"}
          </Link>
        </div>
      )}

      <header className={cn("border-b", t.surface)}>
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className={cn("rounded-lg focus-visible:outline-none focus-visible:ring-2", t.focus)}>
            <WinfolioLogo variant={variant} />
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
            <a href="#in-action" className={cn("hidden sm:inline", t.link)}>How it works</a>
            <a href="#privacy" className={cn("hidden sm:inline", t.link)}>Privacy</a>
            <Link to="/auth" className={cn("font-bold", t.link)}>Sign in</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 01 Hero: the outcome, one primary action, and what the product looks like */}
        <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
            <p className={cn("text-sm font-bold uppercase tracking-[0.12em]", t.accent, reveal)}>Your personal work journal</p>
            <h1 className={cn("text-[clamp(2.4rem,5.5vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.035em]", reveal)} style={{ animationDelay: "80ms" }}>
              Never scramble to remember your impact again.
            </h1>
            <p className={cn("max-w-xl text-lg leading-relaxed", t.muted, reveal)} style={{ animationDelay: "160ms" }}>
              Capture the work you do, the problems you solve and the difference you make.
              When review season arrives, your achievements are already there.
            </p>
            <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", reveal)} style={{ animationDelay: "240ms" }}>
              <Link to="/auth" className={cn(button, t.primary, "hover:-translate-y-0.5 hover:shadow-lg")}>
                Start your work journal <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className={cn("text-sm font-semibold", t.subtle)}>Every win deserves a place.</span>
            </div>
          </div>

          {/* Product preview built from the real data model, clearly marked as an example */}
          <div className={cn("flex min-w-0 flex-[1_1_420px] flex-col gap-4", reveal)} style={{ animationDelay: "200ms" }} aria-label="Example of a logged win and a review summary">
            <div className={cn("rounded-3xl border p-6 shadow-[0_24px_48px_-28px_rgba(11,11,18,0.35)]", t.surface)}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-bold">A win worth remembering</span>
                <span className={sampleLabel}>Example</span>
              </div>
              <p className="text-lg font-extrabold leading-snug">Improved the customer onboarding process</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className={cn("rounded-full px-2.5 py-1", t.tints[0].bg, t.tints[0].ink)}>Process Improvement</span>
                <span className={cn("rounded-full px-2.5 py-1", t.tints[2].bg, t.tints[2].ink)}>Done</span>
              </div>
              <div className={cn("mt-4 rounded-2xl p-4", t.tints[1].bg)}>
                <p className={cn("text-xs font-bold uppercase tracking-wider", t.tints[1].ink)}>Impact</p>
                <p className="mt-1 text-[15px] leading-relaxed">New customers reached their first project faster, and setup questions to support dropped.</p>
              </div>
            </div>
            <div className={cn("flex items-center gap-4 rounded-3xl p-5", t.band)}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">Ready for your review</p>
                <p className={cn("text-sm", t.bandMuted)}>Your wins, their impact and your reflections for any period, as a PDF.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 02 The problem, told as a short story */}
        <section className={cn("border-y", t.surface)}>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 md:py-24">
            <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Every day, you do more than you realise.
            </h2>
            <p className={cn("text-lg leading-relaxed md:text-xl", t.muted)}>
              You solve problems, help teammates, finish projects, and find better ways to work. But as one day
              turns into another, those little wins are easy to forget.
            </p>
            <p className="text-lg leading-relaxed md:text-xl">Then comes the question:</p>
            <blockquote className={cn("rounded-3xl px-6 py-5 text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold leading-snug tracking-tight md:px-8", t.tints[1].bg)}>
              “What have you achieved this year?”
            </blockquote>
            <p className={cn("text-lg leading-relaxed md:text-xl", t.muted)}>
              Suddenly, you're trying to remember months of hard work.
            </p>
            <p className="text-lg font-semibold leading-relaxed md:text-xl">
              Winfolio helps you keep track of your wins as they happen, so when the time comes to talk about
              your work, your story is already there.
            </p>
          </div>
        </section>

        {/* 03 See it in action: one win becoming review evidence */}
        <section id="in-action" className="mx-auto flex max-w-6xl scroll-mt-6 flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">From everyday work to review-ready evidence</h2>
            <p className={cn("text-lg", t.muted)}>Three small habits. Here's what each one looks like.</p>
          </div>
          <ol className="grid gap-5 lg:grid-cols-3">
            {HABITS.map(({ icon: Icon, title, benefit, body }, i) => (
              <li key={title} className={cn("flex flex-col gap-4 rounded-3xl border p-6", t.surface)}>
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", t.tints[i].bg)}>
                    <Icon className={cn("h-5 w-5", t.tints[i].ink)} aria-hidden="true" />
                  </span>
                  <span className={cn("text-sm font-bold", t.subtle)}>Step {i + 1}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-extrabold">{title}</h3>
                  <p className={cn("font-semibold", t.tints[i].ink)}>{benefit}</p>
                </div>
                <p className={cn("leading-relaxed", t.muted)}>{body}</p>

                {/* Example of what this step produces */}
                <div className={cn("mt-auto rounded-2xl p-4 text-sm", t.tints[i].bg)}>
                  <span className={cn(sampleLabel, "bg-white/70")}>Example</span>
                  {i === 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <p className="font-bold">Fixed the checkout timeout for large orders</p>
                      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", t.tints[i].ink)}>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Suggested category: Problem Solving
                      </p>
                    </div>
                  )}
                  {i === 1 && (
                    <dl className="mt-3 flex flex-col gap-2">
                      <div><dt className="text-xs font-bold uppercase tracking-wider opacity-80">What went well</dt><dd className="font-semibold">Shipped the checkout fix ahead of the sale.</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-wider opacity-80">What's next</dt><dd className="font-semibold">Add monitoring so it can't regress.</dd></div>
                    </dl>
                  )}
                  {i === 2 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <p className="font-bold">Q4 review · 9 wins · 6 reflections</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">Problem Solving (4)</p>
                        <p className="font-semibold">Fixed the checkout timeout</p>
                        <p className="text-[13px]">Impact: no failed checkouts during the sale</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className={cn("text-sm", t.subtle)}>Examples use sample data. Your summary contains only what you've recorded.</p>
        </section>

        {/* 04 Moments that matter (replaces a generic FAQ) */}
        <section className={cn("border-y", t.surface)}>
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
              Built for the moments your work needs to speak for itself
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {MOMENTS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="flex flex-col gap-3">
                  <Icon className={cn("h-6 w-6", t.tints[i].ink)} aria-hidden="true" />
                  <h3 className="text-lg font-extrabold">{title}</h3>
                  <p className={cn("leading-relaxed", t.muted)}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 Trust and privacy: only what the implementation guarantees */}
        <section id="privacy" className="mx-auto flex max-w-6xl scroll-mt-6 flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Your record, under your control</h2>
            <p className={cn("text-lg", t.muted)}>What you log about your work can be sensitive. Here's how Winfolio treats it.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, body }) => (
              <div key={title} className={cn("flex flex-col gap-3 rounded-3xl border p-6", t.surface)}>
                <Icon className={cn("h-6 w-6", t.accent)} aria-hidden="true" />
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className={cn("leading-relaxed", t.muted)}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 06 Final call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className={cn("flex flex-wrap items-center justify-between gap-6 rounded-[28px] px-8 py-12 md:px-12", t.band)}>
            <div className="flex max-w-xl flex-col gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">Start with today's win.</h2>
              <p className={t.bandMuted}>By your next review, you'll be glad you did.</p>
            </div>
            <Link to="/auth" className={cn(button, t.bandButton, "hover:-translate-y-0.5")}>
              Start your work journal
            </Link>
          </div>
        </section>
      </main>

      <footer className={cn("border-t", t.surface)}>
        <div className={cn("mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6", t.subtle)}>
          <WinfolioLogo variant={variant} className="text-current" />
          <span>© {new Date().getFullYear()} Winfolio · Every win deserves a place.</span>
        </div>
      </footer>
    </div>
  );
}
