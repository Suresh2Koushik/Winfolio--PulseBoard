import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarRange, Check, FileText, PenLine, ShieldCheck } from "lucide-react";
import { BrandVariant, HeroIllustration, WinfolioLogo } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

/**
 * Class sets per visual direction. Written out in full so Tailwind can see every
 * class at build time.
 */
const THEMES = {
  pastel: {
    page: "bg-[#FAFAFC] text-[#0B0B12]",
    surface: "bg-white border-[#EEEEF3]",
    muted: "text-[#4A4A57]",
    subtle: "text-[#5A5A66]",
    primary: "bg-[#0B0B12] text-white hover:bg-[#26263A]",
    secondary: "bg-white text-[#0B0B12] border-[#DADAE3] hover:border-[#0B0B12]",
    link: "text-[#4A4A57] hover:text-[#0B0B12]",
    focus: "focus-visible:ring-[#5B21B6]",
    tints: [
      { bg: "bg-[#DCEBFF]", ink: "text-[#1E40AF]" },
      { bg: "bg-[#ECE6FF]", ink: "text-[#5B21B6]" },
      { bg: "bg-[#FFE1EC]", ink: "text-[#9D174D]" },
      { bg: "bg-[#F1F1F6]", ink: "text-[#0B0B12]" },
    ],
    band: "bg-[#0B0B12] text-white",
    bandMuted: "text-[#C9C9D6]",
    bandButton: "bg-white text-[#0B0B12] hover:bg-[#ECE6FF]",
    check: "text-[#5B21B6]",
    divider: "border-[#EEEEF3]",
  },
  forest: {
    page: "bg-[#F7F7F2] text-[#16241B]",
    surface: "bg-white border-[#E3E5DC]",
    muted: "text-[#45524A]",
    subtle: "text-[#55615A]",
    primary: "bg-[#24583C] text-white hover:bg-[#1C4730]",
    secondary: "bg-white text-[#16241B] border-[#D5DAD0] hover:border-[#24583C]",
    link: "text-[#45524A] hover:text-[#16241B]",
    focus: "focus-visible:ring-[#24583C]",
    tints: [
      { bg: "bg-[#E4F0E5]", ink: "text-[#24583C]" },
      { bg: "bg-[#FBF0DC]", ink: "text-[#8A5A12]" },
      { bg: "bg-[#E8EEF7]", ink: "text-[#2F4A6E]" },
      { bg: "bg-[#EFF1EA]", ink: "text-[#16241B]" },
    ],
    band: "bg-[#24583C] text-white",
    bandMuted: "text-[#D3E6D6]",
    bandButton: "bg-[#E9B96E] text-[#16241B] hover:bg-[#F1CB8E]",
    check: "text-[#24583C]",
    divider: "border-[#E3E5DC]",
  },
} as const;

const PROBLEMS = [
  "The small but meaningful wins from months ago are forgotten.",
  "You remember tasks you finished, but not the outcome or impact.",
  "Finding concrete examples for a performance review takes days.",
  "Your growth in skills and responsibility goes unrecorded.",
  "Updating a resume means rebuilding your achievements from scratch.",
];

const STEPS = [
  { title: "Capture", lead: "Record your wins", body: "Log what you did and why it mattered in under a minute, with an outcome and evidence if you have it." },
  { title: "Reflect", lead: "See your progress", body: "Each week, note what went well, what was challenging, what you learned and what's next." },
  { title: "Showcase", lead: "Prepare your review", body: "Pick a review period and export a summary built only from what you actually recorded." },
];

const FEATURES = [
  { icon: PenLine, title: "Quick win capture", body: "Category suggestions tuned to your role, impact notes, and attachments for evidence." },
  { icon: BookOpen, title: "Weekly reflections", body: "A short, guided look back at your week that builds a habit instead of a chore." },
  { icon: FileText, title: "Review preparation", body: "Bring a period's wins together and download a clean, review-ready PDF." },
  { icon: CalendarRange, title: "Your work over time", body: "See your achievements by week, by quarter and by category, and track your goals." },
];

const FAQ = [
  { q: "Who can see what I log?", a: "Only you. Your journal is private to your account; you choose what to share by exporting it." },
  { q: "Does my company need to use Winfolio?", a: "No. Winfolio is your personal record. Use it on your own and bring the output to any review or career conversation." },
  { q: "Can I bring my existing tracker?", a: "Yes. Download the Excel template, add your rows and import them. You can export everything back out at any time." },
  { q: "Is there a version for teams?", a: "Team features for managers are planned for a later release. Winfolio starts with you." },
];

// Staggered entrance; motion-safe so it's skipped when the user prefers reduced motion.
const reveal = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both";

export default function WinfolioLanding({ variant }: { variant: BrandVariant }) {
  const t = THEMES[variant];
  const other = variant === "pastel" ? "forest" : "pastel";
  const button = cn(
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]",
    t.focus,
  );

  return (
    <div className={cn("min-h-screen font-['Plus_Jakarta_Sans',system-ui,sans-serif]", t.page)}>
      {/* Preview switcher: only on the comparison routes */}
      <div className="bg-[#16161D] px-4 py-2 text-center text-sm text-white">
        Preview: {variant === "pastel" ? "Version 1 · Pastel mix" : "Version 2 · Forest green"}
        {" · "}
        <Link to={`/preview/${other}`} className="font-semibold underline underline-offset-4 hover:no-underline">
          Switch to {other === "pastel" ? "Version 1 · Pastel mix" : "Version 2 · Forest green"}
        </Link>
      </div>

      <header className={cn("border-b", t.surface)}>
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className={cn("rounded-lg focus-visible:outline-none focus-visible:ring-2", t.focus)}>
            <WinfolioLogo variant={variant} />
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
            <a href="#how" className={cn("hidden sm:inline", t.link)}>How it works</a>
            <a href="#features" className={cn("hidden sm:inline", t.link)}>Features</a>
            <a href="#faq" className={cn("hidden sm:inline", t.link)}>FAQ</a>
            <Link to="/auth" className="font-bold">Sign in</Link>
            <Link to="/auth" className={cn(button, "min-h-[44px] px-5 text-[15px]", t.primary)}>Get started free</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
            <div className={cn("flex flex-wrap gap-2 text-[13px] font-bold", reveal)}>
              {STEPS.map((step, i) => (
                <span key={step.title} className={cn("rounded-full px-3 py-1.5", t.tints[i].bg, t.tints[i].ink)}>{step.title}</span>
              ))}
            </div>
            <h1 className={cn("text-[clamp(2.4rem,5.5vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.035em]", reveal)} style={{ animationDelay: "80ms" }}>
              Your work deserves to be remembered.
            </h1>
            <p className={cn("max-w-xl text-lg leading-relaxed", t.muted, reveal)} style={{ animationDelay: "160ms" }}>
              You've solved problems, shipped projects, helped teammates and made things better.
              Winfolio helps you capture those wins as they happen, reflect on your growth, and walk
              into every performance review with evidence of your impact.
            </p>
            <div className={cn("flex flex-wrap gap-3", reveal)} style={{ animationDelay: "240ms" }}>
              <Link to="/auth" className={cn(button, t.primary, "hover:-translate-y-0.5 hover:shadow-lg")}>
                Start your work journal <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#how" className={cn(button, "border", t.secondary)}>See how it works</a>
            </div>
            <p className={cn("flex items-center gap-2 text-sm", t.subtle, reveal)} style={{ animationDelay: "320ms" }}>
              <ShieldCheck className={cn("h-4 w-4", t.check)} aria-hidden="true" />
              Private by default. Only you can see what you log.
            </p>
          </div>
          <div className={cn("min-w-0 flex-[1_1_420px]", reveal)} style={{ animationDelay: "200ms" }}>
            <HeroIllustration variant={variant} className="mx-auto h-auto w-full max-w-[520px]" />
          </div>
        </section>

        {/* Problem */}
        <section className={cn("border-y", t.surface)}>
          <div className="mx-auto flex max-w-6xl flex-wrap gap-10 px-4 py-16 sm:px-6 md:py-20">
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Great work is easy to forget.</h2>
              <p className={cn("text-lg leading-relaxed", t.muted)}>
                Most people do good work all year, then struggle to explain their impact when appraisal season arrives.
                Winfolio turns that stressful year-end scramble into a simple habit.
              </p>
            </div>
            <ul className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
              {PROBLEMS.map((problem) => (
                <li key={problem} className="flex items-start gap-3 text-[16px] leading-relaxed">
                  <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", t.tints[0].bg)}>
                    <Check className={cn("h-3.5 w-3.5", t.tints[0].ink)} aria-hidden="true" />
                  </span>
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto flex max-w-6xl scroll-mt-6 flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Three small habits. One strong review.</h2>
            <p className={cn("text-lg", t.muted)}>A minute here and there adds up to a record nobody can argue with.</p>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className={cn("flex flex-col gap-3 rounded-3xl p-7 transition-transform duration-200 motion-safe:hover:-translate-y-1", t.tints[i].bg)}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-white font-extrabold", t.tints[i].ink)}>{i + 1}</span>
                <h3 className="text-xl font-extrabold">{step.title}</h3>
                <p className={cn("text-sm font-bold uppercase tracking-wider", t.tints[i].ink)}>{step.lead}</p>
                <p className="leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section id="features" className={cn("scroll-mt-6 border-y", t.surface)}>
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Everything you need, nothing you don't</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className={cn("flex flex-col gap-3 rounded-2xl border p-6 transition-shadow duration-200 hover:shadow-md", t.surface)}>
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", t.tints[i % 3].bg)}>
                    <Icon className={cn("h-5 w-5", t.tints[i % 3].ink)} aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-extrabold">{title}</h3>
                  <p className={cn("leading-relaxed", t.muted)}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promise */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-20">
          <p className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-tight tracking-tight">
            “You do the work. Winfolio helps you remember its value.”
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className={cn("scroll-mt-6 border-t", t.surface)}>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Questions</h2>
            <dl className="flex flex-col">
              {FAQ.map(({ q, a }) => (
                <div key={q} className={cn("flex flex-col gap-2 border-b py-5", t.divider)}>
                  <dt className="text-[17px] font-extrabold">{q}</dt>
                  <dd className={cn("leading-relaxed", t.muted)}>{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className={cn("flex flex-wrap items-center justify-between gap-6 rounded-[28px] px-8 py-12 md:px-12", t.band)}>
            <div className="flex max-w-xl flex-col gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">Every win deserves a place.</h2>
              <p className={t.bandMuted}>Start your work journal today. Setup takes two minutes.</p>
            </div>
            <Link to="/auth" className={cn(button, t.bandButton, "hover:-translate-y-0.5")}>
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <footer className={cn("border-t", t.surface)}>
        <div className={cn("mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6", t.subtle)}>
          <WinfolioLogo variant={variant} className="text-[#0B0B12]" />
          <span>© {new Date().getFullYear()} Winfolio · Every win deserves a place.</span>
        </div>
      </footer>
    </div>
  );
}
