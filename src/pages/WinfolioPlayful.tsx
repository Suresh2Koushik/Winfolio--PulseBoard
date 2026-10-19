import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Briefcase, Download, LockKeyhole, MessageCircle, PartyPopper, PenLine, ShieldCheck, Sprout } from "lucide-react";
import { WinfolioLogo } from "@/components/brand/Brand";
import { Mascot, MascotPose } from "@/components/landing/Mascot";
import { Confetti, DoodleArrow, PaperPlane, Squiggle, Star } from "@/components/landing/Effects";
import { useInViewOnce, usePrefersReducedMotion } from "@/components/landing/motion";
import { cn } from "@/lib/utils";
import "@/components/landing/playful.css";

/**
 * Winfolio landing page, Version 1 (pastel) with playful animations.
 * Product claims match what the app does today (see docs/LAUNCH_CHECKLIST.md).
 * Every animation has a still, finished state for prefers-reduced-motion.
 */

const INK = "#0B0B12";
const sticker = "rounded-2xl border-2 border-[#0B0B12] bg-white shadow-[4px_4px_0_#0B0B12]";
const doodleFont = "font-['Caveat',cursive]";
const button =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B21B6] focus-visible:ring-offset-2 active:scale-[0.97]";
const h2 = "text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.025em]";
const Emoji = ({ children }: { children: string }) => <span aria-hidden="true">{children}</span>;

// ---------------------------------------------------------------- hero
function HappyWin() {
  const reduced = usePrefersReducedMotion();
  // 0 note floats in · 1 check draws · 2 sparkles + celebration · 3 settled
  const [phase, setPhase] = useState(reduced ? 3 : 0);

  useEffect(() => {
    if (reduced) { setPhase(3); return; }
    const timers = [
      window.setTimeout(() => setPhase(1), 750),
      window.setTimeout(() => setPhase(2), 1150),
      window.setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  const stars: { pos: string; size: string; color: string; delay: string }[] = [
    { pos: "-top-6 -left-4", size: "h-8 w-8", color: "#FFD68A", delay: "0ms" },
    { pos: "-top-8 right-10", size: "h-6 w-6", color: "#9CC3FF", delay: "90ms" },
    { pos: "top-10 -right-6", size: "h-7 w-7", color: "#FFA8C8", delay: "160ms" },
    { pos: "-bottom-5 left-12", size: "h-5 w-5", color: "#C4B1FF", delay: "220ms" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[460px] pt-10" aria-label="A logged win being checked off">
      {/* a second, older win behind, for depth */}
      <div className={cn(sticker, "absolute left-10 right-2 top-0 rotate-[4deg] p-4 opacity-70")} aria-hidden="true">
        <p className="font-bold">Helped a teammate get unstuck</p>
        <p className="text-sm text-[#5A5A66]">Yesterday · Collaboration</p>
      </div>

      <div className={cn(sticker, "wf-float-in relative z-10 flex items-center gap-4 p-5")}>
        <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0" aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="#DCEBFF" stroke={INK} strokeWidth="2.5" />
          {phase >= 1 && (
            <path d="M11 20.5 L17.5 27 L29 14" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              className="wf-draw" style={{ "--len": 30 } as CSSProperties} />
          )}
        </svg>
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight">Fixed that annoying bug!</p>
          <p className="mt-0.5 text-sm text-[#5A5A66]">Today · Problem Solving</p>
        </div>
        {phase >= 2 && stars.map((s) => (
          <span key={s.pos} className={cn("wf-pop absolute", s.pos)} style={{ animationDelay: s.delay }}>
            <Star className={cn("wf-twinkle", s.size)} color={s.color} />
          </span>
        ))}
      </div>

      <div className="relative z-20 mt-3 flex items-end justify-end gap-2 pr-2">
        <div className={cn("mb-10 flex -rotate-6 flex-col items-end text-2xl leading-none", doodleFont)} aria-hidden="true">
          <DoodleArrow className="mb-1 h-10 w-14 rotate-180" />
          that counts!
        </div>
        <Mascot pose={phase === 2 ? "celebrate" : "idle"} className="h-32 w-28" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- problem
const WEEK = [
  { day: "Monday", text: "fixed a problem that's been annoying everyone for weeks.", bg: "bg-[#DCEBFF]", ink: "text-[#1E40AF]", sx: "-34px", sy: "14px", sr: "-7deg" },
  { day: "Tuesday", text: "helped a teammate get unstuck.", bg: "bg-[#ECE6FF]", ink: "text-[#5B21B6]", sx: "42px", sy: "-8px", sr: "6deg" },
  { day: "Wednesday", text: "figured out a better way to do something.", bg: "bg-[#FFE1EC]", ink: "text-[#9D174D]", sx: "-18px", sy: "10px", sr: "4deg" },
];

function ForgetfulWeek() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(ref);
  const reduced = usePrefersReducedMotion();
  const [organised, setOrganised] = useState(reduced);

  useEffect(() => {
    if (reduced) { setOrganised(true); return; }
    if (!inView) return;
    const timer = window.setTimeout(() => setOrganised(true), 1500);
    return () => window.clearTimeout(timer);
  }, [inView, reduced]);

  const visible = inView || reduced;
  const cardStyle = (i: number, sx: string, sy: string, sr: string): CSSProperties => ({
    "--sx": sx, "--sy": sy, "--sr": sr,
    opacity: visible ? 1 : 0,
    transform: organised ? "none" : `translate(${sx}, ${sy}) rotate(${sr})`,
    transition: reduced ? "none" : `opacity 400ms ease ${i * 140}ms, transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
  } as CSSProperties);

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "relative flex flex-col gap-3 rounded-3xl border-2 p-4 transition-all duration-500 sm:pl-12",
          organised ? "border-[#0B0B12] bg-white shadow-[6px_6px_0_#0B0B12]" : "border-transparent bg-transparent",
        )}
      >
        {/* journal spiral + tab, appear once things are organised */}
        <div className={cn("absolute left-3 top-6 bottom-6 hidden flex-col justify-between transition-opacity duration-500 sm:flex", organised ? "opacity-100" : "opacity-0")} aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => <span key={i} className="h-3.5 w-3.5 rounded-full border-2 border-[#0B0B12] bg-[#FAFAFC]" />)}
        </div>
        <span className={cn("absolute -top-4 right-6 rotate-3 rounded-full border-2 border-[#0B0B12] bg-[#C4B1FF] px-3 py-1 text-sm font-extrabold transition-all duration-500", organised ? "scale-100 opacity-100" : "scale-50 opacity-0")} aria-hidden="true">
          Winfolio
        </span>

        <ol className="flex flex-col gap-3">
          {WEEK.map(({ day, text, bg, ink, sx, sy, sr }, i) => (
            <li key={day} className={cn("flex flex-col gap-1 rounded-2xl px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4", bg)} style={cardStyle(i, sx, sy, sr)}>
              <span className={cn("w-28 shrink-0 text-sm font-extrabold uppercase tracking-wider", ink)}>{day}</span>
              <span className="text-lg">{text}</span>
            </li>
          ))}
          <li
            className={cn("flex flex-col gap-1 rounded-2xl bg-[#0B0B12] px-5 py-4 text-white sm:flex-row sm:items-baseline sm:gap-4", visible && !organised && "wf-wobble")}
            style={cardStyle(3, "26px", "-12px", "-5deg")}
          >
            <span className="w-28 shrink-0 text-sm font-extrabold uppercase tracking-wider text-[#C9C9D6]">Friday</span>
            <span className="text-lg font-bold">“What did I even do this week?”</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- example win
function TryItWin() {
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = useState(false);
  const [fire, setFire] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [pose, setPose] = useState<MascotPose>("idle");

  useEffect(() => {
    if (pose !== "celebrate") return;
    const timer = window.setTimeout(() => setPose("thumbs"), reduced ? 0 : 1800);
    return () => window.clearTimeout(timer);
  }, [pose, reduced]);

  const toggle = () => {
    const next = !done;
    setDone(next);
    if (next) {
      setFire((n) => n + 1);
      setBouncing(true);
      setPose("celebrate");
    } else {
      setPose("idle");
    }
  };

  return (
    <div className="group relative pt-16">
      {/* Mascot peeks over the card on hover/focus, and stays up once it's done */}
      <div
        className={cn(
          "absolute right-8 top-2 z-0 w-20 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          done ? "translate-y-0" : "translate-y-[30%] group-hover:translate-y-0 group-focus-within:translate-y-0",
        )}
      >
        <Mascot pose={pose} className="h-24 w-20" />
      </div>

      <div
        className={cn(sticker, "relative z-10 p-6", bouncing && "wf-bounce")}
        style={{ "--tilt": "-1deg", transform: "rotate(-1deg)" } as CSSProperties}
        onAnimationEnd={(e) => { if (e.target === e.currentTarget) setBouncing(false); }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A66]">Category · Process improvement</span>
          <span className="rounded-full bg-[#F1F1F6] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4A4A57]">Example</span>
        </div>
        <p className="text-xl font-extrabold leading-snug">Improved the customer onboarding process</p>

        <div className="relative mt-4 inline-flex">
          <button
            type="button"
            aria-pressed={done}
            onClick={toggle}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2.5 rounded-full border-2 border-[#0B0B12] px-4 font-bold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B21B6] focus-visible:ring-offset-2",
              done ? "bg-[#DCEBFF]" : "bg-white hover:bg-[#F4F4F8]",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="6" fill={done ? "#FFFFFF" : "#FFFFFF"} stroke={INK} strokeWidth="2.5" />
              {done && (
                <path key={fire} d="M6.5 12.5 L10.5 16.5 L17.5 8" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  className="wf-draw" style={{ "--len": 20 } as CSSProperties} />
              )}
            </svg>
            Done
          </button>
          <Confetti fire={fire} />
          {!done && (
            <span className={cn("pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 -rotate-3 whitespace-nowrap text-xl sm:block", doodleFont)} aria-hidden="true">
              ← go on, tap it
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-[#ECE6FF] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5B21B6]">What changed?</p>
          <p className="mt-1 text-[15px] leading-relaxed">New customers reached their first project faster, and setup questions to support dropped.</p>
        </div>

        <p aria-live="polite" className={cn("mt-3 min-h-[32px] text-2xl font-bold text-[#5B21B6]", doodleFont)}>
          {done ? "Look at you go!" : ""}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- final CTA
function FutureYouCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(ref, 0.5);
  const reduced = usePrefersReducedMotion();
  const [travel, setTravel] = useState(320);
  const [landed, setLanded] = useState(reduced);

  useEffect(() => {
    if (ref.current) setTravel(Math.min(ref.current.clientWidth * 0.55, 520));
  }, []);

  useEffect(() => {
    if (reduced) { setLanded(true); return; }
    if (!inView) return;
    const timer = window.setTimeout(() => setLanded(true), 1600);
    return () => window.clearTimeout(timer);
  }, [inView, reduced]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div ref={ref} className="relative flex flex-wrap items-center justify-between gap-8 rounded-[28px] border-2 border-[#0B0B12] bg-[#0B0B12] px-8 py-14 text-white md:px-12">
        <Star className="absolute left-6 top-5 h-5 w-5" color="#9CC3FF" />
        <Star className="absolute bottom-6 left-1/3 h-4 w-4" color="#FFA8C8" />
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Every win deserves a place.</h2>
          <p className="text-[#C9C9D6]">Takes a moment now. Future you says thanks. <Emoji>💌</Emoji></p>
        </div>
        <div className="relative">
          {(inView || reduced) && (
            <span
              className={cn("pointer-events-none absolute -left-12 -top-12 block", !reduced && "wf-plane")}
              style={{ "--travel": `${travel}px` } as CSSProperties}
              aria-hidden="true"
            >
              <PaperPlane className="h-11 w-14" />
            </span>
          )}
          {landed && (
            <span className="wf-pop absolute -right-3 -top-3 z-10" aria-hidden="true">
              <Star className="h-7 w-7" color="#FFD68A" />
            </span>
          )}
          <Link
            to="/auth"
            className={cn(button, "bg-white text-[#0B0B12] hover:-translate-y-0.5 hover:bg-[#ECE6FF]", landed && !reduced && "wf-pulse-once")}
          >
            Save your first win <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- reveal wrapper
function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInViewOnce(ref, 0.2);
  return (
    <Tag ref={ref as React.Ref<never>} className={cn("wf-reveal", inView && "is-visible", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

const HABITS = [
  { icon: PenLine, emoji: "✍️", title: "Catch the win", tilt: "-1.5deg", bg: "bg-[#DCEBFF]", ink: "text-[#1E40AF]",
    body: "Something went well? Write it down. Something was harder than expected? That counts too. A couple of sentences will do." },
  { icon: BookOpen, emoji: "🌱", title: "Check in with yourself", tilt: "1deg", bg: "bg-[#ECE6FF]", ink: "text-[#5B21B6]",
    body: "Take a few minutes each week to reflect on what went well, what was tricky, and what you'd like to tackle next. Think of it as a debrief with yourself, minus the meeting invite." },
  { icon: PartyPopper, emoji: "🎉", title: "Look at you go", tilt: "-0.75deg", bg: "bg-[#FFE1EC]", ink: "text-[#9D174D]",
    body: "Pick a date range and turn your recorded wins and reflections into a review-ready summary. No archaeological expedition through Slack required." },
];

const WHY = [
  { icon: Briefcase, lead: "Performance review coming up?", rest: "You've got examples.", ink: "text-[#1E40AF]", bg: "bg-[#DCEBFF]" },
  { icon: Sprout, lead: "Wondering whether you're growing?", rest: "Look back at the work you've done.", ink: "text-[#5B21B6]", bg: "bg-[#ECE6FF]" },
  { icon: MessageCircle, lead: "Someone asks what you've been working on?", rest: "For once, you don't have to say, “Oh, a bit of everything.”", ink: "text-[#9D174D]", bg: "bg-[#FFE1EC]" },
];

// ---------------------------------------------------------------- page
export default function WinfolioPlayful({ showPreviewSwitch = false }: { showPreviewSwitch?: boolean }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFAFC] font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[#0B0B12]">
      {showPreviewSwitch && (
        <div className="bg-[#16161D] px-4 py-2 text-center text-sm text-white">
          Preview: Version 1 · Pastel mix (animated) ·{" "}
          <Link to="/preview/forest" className="font-semibold underline underline-offset-4 hover:no-underline">
            Switch to Version 2 · Forest green
          </Link>
        </div>
      )}

      <header className="border-b-2 border-[#0B0B12] bg-white">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B21B6]">
            <WinfolioLogo variant="pastel" />
          </Link>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
            <a href="#how" className="hidden text-[#4A4A57] hover:text-[#0B0B12] sm:inline">How it works</a>
            <a href="#privacy" className="hidden text-[#4A4A57] hover:text-[#0B0B12] sm:inline">Privacy</a>
            <Link to="/auth" className="font-bold text-[#4A4A57] hover:text-[#0B0B12]">Sign in</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-16">
          <Star className="absolute left-2 top-6 hidden h-6 w-6 md:block" color="#9CC3FF" />
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5B21B6]">Your personal work journal</p>
            <h1 className="text-[clamp(2.4rem,5.5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
              You did a lot this week.{" "}
              <span className="relative inline-block">
                Your brain disagrees.
                <Squiggle className="absolute -bottom-2 left-0 h-3 w-full" />
              </span>{" "}
              <Emoji>🫠</Emoji>
            </h1>
            <div className="flex max-w-xl flex-col gap-4 text-lg leading-relaxed text-[#4A4A57]">
              <p>Fixed that annoying bug? Helped a teammate? Somehow survived six meetings that could've been emails?</p>
              <p className="font-semibold text-[#5B21B6]">Those count as wins, by the way.</p>
              <p>But a week later, they're buried under 37 new tasks and a suspicious number of unread messages.</p>
              <p>
                <span className="font-semibold text-[#0B0B12]">Winfolio gives your work wins a home.</span> Jot them down as they happen,
                add what changed, and get on with your day.
              </p>
              <p>No big write-up. No humblebragging practice. No staring at a blank page three months later wondering what you've been doing with your life.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
              <Link to="/auth" className={cn(button, "border-2 border-[#0B0B12] bg-[#0B0B12] text-white shadow-[4px_4px_0_#C4B1FF] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#C4B1FF]")}>
                Save your first win <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="text-sm font-semibold text-[#5A5A66]">Takes a moment now. Future you says thanks. <Emoji>💚</Emoji></span>
            </div>
            <p className="flex items-center gap-2 text-sm text-[#5A5A66]">
              <ShieldCheck className="h-4 w-4 text-[#5B21B6]" aria-hidden="true" />
              Private by default. Only you can read your journal.
            </p>
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <HappyWin />
          </div>
        </section>

        {/* 01 The problem */}
        <section className="border-y-2 border-[#0B0B12] bg-white">
          <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-24">
            <h2 className={h2}>Work happened. Where did the memories go?</h2>
            <ForgetfulWeek />
            <Reveal className="flex flex-col gap-3 text-lg leading-relaxed md:text-xl">
              <p className="text-[#4A4A57]">Your work doesn't disappear. Your memory just has other priorities.</p>
              <p className="font-semibold">Winfolio helps you keep the receipts before your brain clears its cache.</p>
            </Reveal>
          </div>
        </section>

        {/* 02 How it works */}
        <section id="how" className="mx-auto flex max-w-6xl scroll-mt-6 flex-col gap-12 px-4 py-16 sm:px-6 md:py-20">
          <h2 className={cn(h2, "max-w-2xl")}>Three tiny habits. One less thing to panic about.</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {HABITS.map(({ icon: Icon, emoji, title, body, tilt, bg, ink }, i) => (
              <Reveal key={title} delay={i * 120} as="li">
                <div className={cn(sticker, "wf-sticker relative flex h-full flex-col gap-4 p-7")} style={{ transform: `rotate(${tilt})` }}>
                  <span className={cn("absolute -right-3 -top-4 flex h-12 w-12 rotate-12 items-center justify-center rounded-full border-2 border-[#0B0B12] text-2xl", bg)} aria-hidden="true">
                    {emoji}
                  </span>
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", bg)}>
                    <Icon className={cn("h-5 w-5", ink)} aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-extrabold"><span className="mr-1.5 text-[#5A5A66]">{i + 1}.</span>{title}</h3>
                  <p className="leading-relaxed text-[#4A4A57]">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* 03 Example win (interactive) */}
        <section className="border-y-2 border-[#0B0B12] bg-[#ECE6FF]/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 py-16 sm:px-6 md:py-20">
            <Reveal className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
              <h2 className={h2}>Yes, that counts. And so does that.</h2>
              <p className="text-lg leading-relaxed text-[#4A4A57]">
                See? It doesn't have to be a company-wide launch or a dramatic promotion announcement.
                Making something work better is worth remembering, too.
              </p>
            </Reveal>
            <div className="min-w-0 flex-[1_1_420px]">
              <TryItWin />
            </div>
          </div>
        </section>

        {/* 04 Why it matters */}
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 md:py-20">
          <h2 className={cn(h2, "max-w-3xl")}>For the days you need to remember what you're good at.</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY.map(({ icon: Icon, lead, rest, ink, bg }, i) => (
              <Reveal key={lead} delay={i * 120} className="wf-wiggle-on-hover">
                <div className="flex flex-col gap-3">
                  <span className={cn("wf-wiggle-target flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#0B0B12]", bg)}>
                    <Icon className={cn("h-6 w-6", ink)} aria-hidden="true" />
                  </span>
                  <p className="text-lg leading-relaxed">
                    <span className="font-extrabold">{lead}</span> <span className="text-[#4A4A57]">{rest}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-lg font-semibold">Your wins, your reflections, your progress — all in one place.</p>
        </section>

        {/* 05 Privacy (deliberately calm) */}
        <section id="privacy" className="scroll-mt-6 border-y-2 border-[#0B0B12] bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 py-16 sm:px-6 md:py-20">
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
              <h2 className={h2}>Your work journal. Your business.</h2>
              <p className="text-lg leading-relaxed text-[#4A4A57]">Some work stories aren't meant for the group chat.</p>
              <p className="text-lg leading-relaxed">Your journal is private to your account, and you can export your wins whenever you need them.</p>
              <p className="text-lg font-semibold">Because your work history should be yours to keep.</p>
            </div>
            <ul className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">
              <li className="flex items-start gap-3 rounded-2xl bg-[#DCEBFF] p-4">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#1E40AF]" aria-hidden="true" />
                <span>Only you can read your journal. Other members and in-app admins can't; it's enforced on our servers.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-[#ECE6FF] p-4">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-[#5B21B6]" aria-hidden="true" />
                <span>Export your wins to Excel, or download a review PDF, any time.</span>
              </li>
            </ul>
          </div>
        </section>

        <FutureYouCta />
      </main>

      <footer className="border-t-2 border-[#0B0B12] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-[#5A5A66] sm:px-6">
          <WinfolioLogo variant="pastel" className="text-[#0B0B12]" />
          <span>© {new Date().getFullYear()} Winfolio · Every win deserves a place.</span>
        </div>
      </footer>
    </div>
  );
}
