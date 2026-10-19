import { CSSProperties, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = ["#9CC3FF", "#C4B1FF", "#FFA8C8", "#0B0B12", "#FFD68A"];

/**
 * A short pastel confetti burst. Changing `fire` (any new number > 0) plays it again.
 * Decorative, removed from the page after it finishes, and hidden for reduced motion
 * by playful.css.
 */
export function Confetti({ fire, count = 22, className }: { fire: number; count?: number; className?: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (fire <= 0) return;
    setActive(fire);
    const timer = window.setTimeout(() => setActive(0), 1200);
    return () => window.clearTimeout(timer);
  }, [fire]);

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 60 + Math.random() * 70;
        return {
          dx: `${Math.cos(angle) * distance}px`,
          dy: `${Math.sin(angle) * distance - 40}px`,
          rot: `${Math.random() * 540 - 270}deg`,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          round: i % 3 === 0,
          delay: `${Math.random() * 80}ms`,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, count],
  );

  if (!active) return null;
  return (
    <span className={cn("pointer-events-none absolute left-1/2 top-1/2", className)} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={`${active}-${i}`}
          className={cn("wf-confetti-piece absolute block", p.round ? "h-2 w-2 rounded-full" : "h-2.5 w-1.5 rounded-[2px]")}
          style={{ "--dx": p.dx, "--dy": p.dy, "--rot": p.rot, background: p.color, animationDelay: p.delay } as CSSProperties}
        />
      ))}
    </span>
  );
}

/** Four-point sparkle star. */
export function Star({ className, color = "#FFA8C8", style }: { className?: string; color?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M12 1.5 L14.2 9.8 L22.5 12 L14.2 14.2 L12 22.5 L9.8 14.2 L1.5 12 L9.8 9.8 Z" fill={color} stroke="#0B0B12" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Hand-drawn squiggle underline. */
export function Squiggle({ className, color = "#C4B1FF" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 14" className={className} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M2 9 Q 12 1 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 6" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Loopy doodle arrow pointing right/down. */
export function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden="true" focusable="false">
      <path d="M4 8 C 30 0, 44 30, 30 34 C 18 38, 22 18, 40 22 C 56 26, 62 40, 66 52" fill="none" stroke="#0B0B12" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 48 L66 54 L70 44" fill="none" stroke="#0B0B12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Paper plane carrying a star. */
export function PaperPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true" focusable="false">
      <path d="M4 22 L58 4 L42 42 L30 28 Z" fill="#FFFFFF" stroke="#0B0B12" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 28 L58 4 L24 34 Z" fill="#ECE6FF" stroke="#0B0B12" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M12 6 L13.4 10.6 L18 12 L13.4 13.4 L12 18 L10.6 13.4 L6 12 L10.6 10.6 Z" fill="#FFD68A" stroke="#0B0B12" strokeWidth="1.2" />
    </svg>
  );
}
