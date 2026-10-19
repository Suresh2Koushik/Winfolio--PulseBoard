import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, Briefcase, Download, LockKeyhole, MessageCircle, PartyPopper, PenLine, Sprout,
} from "lucide-react";
import { BrandVariant, HeroIllustration, WinfolioLogo } from "@/components/brand/Brand";
import { cn } from "@/lib/utils";

/**
 * Winfolio marketing page. Product claims are limited to what the app does today
 * and are covered by its tests (see docs/LAUNCH_CHECKLIST.md).
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

// Emoji are part of the voice but decorative: hidden from screen readers.
const Emoji = ({ children }: { children: string }) => <span aria-hidden="true">{children}</span>;

const WEEK = [
  { day: "Monday", text: "fixed a problem that's been annoying everyone for weeks." },
  { day: "Tuesday", text: "helped a teammate get unstuck." },
  { day: "Wednesday", text: "figured out a better way to do something." },
];

const HABITS = [
  {
    icon: PenLine, emoji: "✍️", title: "Catch the win",
    body: "Something went well? Write it down. Something was harder than expected? That counts too. A couple of sentences will do.",
  },
  {
    icon: BookOpen, emoji: "🌱", title: "Check in with yourself",
    body: "Take a few minutes each week to reflect on what went well, what was tricky, and what you'd like to tackle next. Think of it as a debrief with yourself, minus the meeting invite.",
  },
  {
    icon: PartyPopper, emoji: "🎉", title: "Look at you go",
    body: "Pick a date range and turn your recorded wins and reflections into a review-ready summary. No archaeological expedition through Slack required.",
  },
];

const WHY = [
  { icon: Briefcase, lead: "Performance review coming up?", rest: "You've got examples." },
  { icon: Sprout, lead: "Wondering whether you're growing?", rest: "Look back at the work you've done." },
  { icon: MessageCircle, lead: "Someone asks what you've been working on?", rest: "For once, you don't have to say, “Oh, a bit of everything.”" },
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
  const h2 = "text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.025em]";

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
            <a href="#how" className={cn("hidden sm:inline", t.link)}>How it works</a>
            <a href="#privacy" className={cn("hidden sm:inline", t.link)}>Privacy</a>
            <Link to="/auth" className={cn("font-bold", t.link)}>Sign in</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
            <p className={cn("text-sm font-bold uppercase tracking-[0.12em]", t.accent, reveal)}>Your personal work journal</p>
            <h1 className={cn("text-[clamp(2.4rem,5.5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em]", reveal)} style={{ animationDelay: "80ms" }}>
              You did a lot this week. Your brain disagrees. <Emoji>🫠</Emoji>
            </h1>
            <div className={cn("flex max-w-xl flex-col gap-4 text-lg leading-relaxed", t.muted, reveal)} style={{ animationDelay: "160ms" }}>
              <p>Fixed that annoying bug? Helped a teammate? Somehow survived six meetings that could've been emails?</p>
              <p className={cn("font-semibold", t.accent)}>Those count as wins, by the way.</p>
              <p>But a week later, they're buried under 37 new tasks and a suspicious number of unread messages.</p>
              <p>
                <span className="font-semibold text-current">Winfolio gives your work wins a home.</span> Jot them down as they happen,
                add what changed, and get on with your day.
              </p>
              <p>
                No big write-up. No humblebragging practice. No staring at a blank page three months later wondering
                what you've been doing with your life.
              </p>
            </div>
            <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3 pt-1", reveal)} style={{ animationDelay: "240ms" }}>
              <Link to="/auth" className={cn(button, t.primary, "hover:-translate-y-0.5 hover:shadow-lg")}>
                Save your first win <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className={cn("text-sm font-semibold", t.subtle)}>Takes a moment now. Future you says thanks. <Emoji>💚</Emoji></span>
            </div>
          </div>
          <div className={cn("min-w-0 flex-[1_1_380px]", reveal)} style={{ animationDelay: "200ms" }}>
            <HeroIllustration variant={variant} className="mx-auto h-auto w-full max-w-[500px]" />
          </div>
        </section>

        {/* 01 The problem */}
        <section className={cn("border-y", t.surface)}>
          <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6 md:py-24">
            <h2 className={h2}>Work happened. Where did the memories go?</h2>
            <ol className="flex flex-col gap-3">
              {WEEK.map(({ day, text }, i) => (
                <li key={day} className={cn("flex flex-col gap-1 rounded-2xl px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4", t.tints[i].bg)}>
                  <span className={cn("w-28 shrink-0 text-sm font-extrabold uppercase tracking-wider", t.tints[i].ink)}>{day}</span>
                  <span className="text-lg">{text}</span>
                </li>
              ))}
              <li className={cn("flex flex-col gap-1 rounded-2xl px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4", t.band)}>
                <span className={cn("w-28 shrink-0 text-sm font-extrabold uppercase tracking-wider", t.bandMuted)}>Friday</span>
                <span className="text-lg font-bold">“What did I even do this week?”</span>
              </li>
            </ol>
            <div className="flex flex-col gap-3 text-lg leading-relaxed md:text-xl">
              <p className={t.muted}>Your work doesn't disappear. Your memory just has other priorities.</p>
              <p className="font-semibold">Winfolio helps you keep the receipts before your brain clears its cache.</p>
            </div>
          </div>
        </section>

        {/* 02 How it works */}
        <section id="how" className="mx-auto flex max-w-6xl scroll-mt-6 flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <h2 className={cn(h2, "max-w-2xl")}>Three tiny habits. One less thing to panic about.</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {HABITS.map(({ icon: Icon, emoji, title, body }, i) => (
              <li key={title} className={cn("flex flex-col gap-4 rounded-3xl border p-7 transition-transform duration-200 motion-safe:hover:-translate-y-1", t.surface)}>
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", t.tints[i].bg)}>
                    <Icon className={cn("h-5 w-5", t.tints[i].ink)} aria-hidden="true" />
                  </span>
                  <span className={cn("text-sm font-bold", t.subtle)}>{i + 1}</span>
                </div>
                <h3 className="text-xl font-extrabold">{title} <Emoji>{emoji}</Emoji></h3>
                <p className={cn("leading-relaxed", t.muted)}>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 03 Example win */}
        <section className={cn("border-y", t.surface)}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 py-16 sm:px-6 md:py-20">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
              <h2 className={h2}>Yes, that counts. And so does that.</h2>
              <p className={cn("text-lg leading-relaxed", t.muted)}>
                See? It doesn't have to be a company-wide launch or a dramatic promotion announcement.
                Making something work better is worth remembering, too.
              </p>
            </div>
            <div className={cn("min-w-0 flex-[1_1_420px] rounded-3xl border p-6 shadow-[0_24px_48px_-28px_rgba(11,11,18,0.35)]", t.surface)} aria-label="Example of a saved win">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className={cn("text-xs font-bold uppercase tracking-wider", t.subtle)}>Category · Process improvement</span>
                <span className={sampleLabel}>Example</span>
              </div>
              <p className="text-xl font-extrabold leading-snug">Improved the customer onboarding process</p>
              <span className={cn("mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold", t.tints[0].bg, t.tints[0].ink)}>Done</span>
              <div className={cn("mt-4 rounded-2xl p-4", t.tints[1].bg)}>
                <p className={cn("text-xs font-bold uppercase tracking-wider", t.tints[1].ink)}>What changed?</p>
                <p className="mt-1 text-[15px] leading-relaxed">
                  New customers reached their first project faster, and setup questions to support dropped.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 04 Why it matters */}
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <h2 className={cn(h2, "max-w-3xl")}>For the days you need to remember what you're good at.</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {WHY.map(({ icon: Icon, lead, rest }, i) => (
              <div key={lead} className="flex flex-col gap-3">
                <Icon className={cn("h-6 w-6", t.tints[i].ink)} aria-hidden="true" />
                <p className="text-lg leading-relaxed">
                  <span className="font-extrabold">{lead}</span> <span className={t.muted}>{rest}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-lg font-semibold">Your wins, your reflections, your progress — all in one place.</p>
        </section>

        {/* 05 Privacy */}
        <section id="privacy" className={cn("scroll-mt-6 border-y", t.surface)}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 py-16 sm:px-6 md:py-20">
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
              <h2 className={h2}>Your work journal. Your business.</h2>
              <p className={cn("text-lg leading-relaxed", t.muted)}>Some work stories aren't meant for the group chat.</p>
              <p className="text-lg leading-relaxed">
                Your journal is private to your account, and you can export your wins whenever you need them.
              </p>
              <p className="text-lg font-semibold">Because your work history should be yours to keep.</p>
            </div>
            <ul className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
              <li className={cn("flex items-start gap-3 rounded-2xl p-4", t.tints[0].bg)}>
                <LockKeyhole className={cn("mt-0.5 h-5 w-5 shrink-0", t.tints[0].ink)} aria-hidden="true" />
                <span>Only you can read your journal. Other members and in-app admins can't; it's enforced on our servers.</span>
              </li>
              <li className={cn("flex items-start gap-3 rounded-2xl p-4", t.tints[1].bg)}>
                <Download className={cn("mt-0.5 h-5 w-5 shrink-0", t.tints[1].ink)} aria-hidden="true" />
                <span>Export your wins to Excel, or download a review PDF, any time.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className={cn("flex flex-wrap items-center justify-between gap-6 rounded-[28px] px-8 py-12 md:px-12", t.band)}>
            <div className="flex max-w-xl flex-col gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">Every win deserves a place.</h2>
              <p className={t.bandMuted}>Takes a moment now. Future you says thanks.</p>
            </div>
            <Link to="/auth" className={cn(button, t.bandButton, "hover:-translate-y-0.5")}>
              Save your first win <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
