// Winfolio brand marks and lightweight inline illustrations (no image downloads).

export type BrandVariant = "pastel" | "forest";

interface MarkProps {
  variant: BrandVariant;
  className?: string;
}

/** Logo mark: three rising bars (pastel) or a sprouting leaf (forest). */
export function WinfolioMark({ variant, className }: MarkProps) {
  if (variant === "forest") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#24583C" />
        <path d="M16 25v-9" stroke="#F7F7F2" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 17c0-5 3.5-8.5 8-8.5 0 4.6-3.4 8.5-8 8.5z" fill="#E4F0E5" />
        <path d="M16 19.5c0-3.6-2.6-6-6-6 0 3.3 2.5 6 6 6z" fill="#E9B96E" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0B0B12" />
      <rect x="8" y="15" width="4.5" height="9" rx="2.25" fill="#9CC3FF" />
      <rect x="13.75" y="8" width="4.5" height="16" rx="2.25" fill="#C4B1FF" />
      <rect x="19.5" y="12" width="4.5" height="12" rx="2.25" fill="#FFA8C8" />
    </svg>
  );
}

export function WinfolioLogo({ variant, className }: MarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <WinfolioMark variant={variant} className="h-8 w-8" />
      <span className="text-lg font-extrabold tracking-tight">Winfolio</span>
    </span>
  );
}

interface HeroArtProps {
  variant: BrandVariant;
  className?: string;
}

/**
 * Hero illustration: a stack of logged wins rising into a growth line, ending in a
 * small celebration mark. Purely decorative.
 */
export function HeroIllustration({ variant, className }: HeroArtProps) {
  const c = variant === "forest"
    ? { a: "#E4F0E5", aInk: "#24583C", b: "#FBF0DC", bInk: "#8A5A12", c: "#E8EEF7", cInk: "#2F4A6E", line: "#24583C", spark: "#E9B96E", card: "#FFFFFF", stroke: "#E3E5DC" }
    : { a: "#DCEBFF", aInk: "#1E40AF", b: "#FFE1EC", bInk: "#9D174D", c: "#ECE6FF", cInk: "#5B21B6", line: "#0B0B12", spark: "#FFA8C8", card: "#FFFFFF", stroke: "#EEEEF3" };

  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Illustration of logged wins stacking up into a rising progress line">
      <defs>
        <filter id={`shadow-${variant}`} x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0B0B12" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* soft backdrop shapes */}
      <circle cx="380" cy="90" r="70" fill={c.c} />
      <circle cx="90" cy="320" r="56" fill={c.b} />

      {/* growth line */}
      <path d="M40 330 C 140 320, 170 250, 250 230 S 380 150, 430 70" fill="none" stroke={c.line} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />
      <circle cx="430" cy="70" r="9" fill={c.line} />

      {/* celebration sparks */}
      <g stroke={c.spark} strokeWidth="3.5" strokeLinecap="round">
        <path d="M430 38v-14" /><path d="M456 52l10-10" /><path d="M462 78h14" /><path d="M404 46l-10-10" />
      </g>

      {/* stacked win cards */}
      <g filter={`url(#shadow-${variant})`}>
        <rect x="70" y="236" width="250" height="60" rx="16" fill={c.card} stroke={c.stroke} />
        <rect x="90" y="252" width="28" height="28" rx="8" fill={c.a} />
        <path d="M97 266l5 5 9-10" fill="none" stroke={c.aInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="132" y="256" width="130" height="9" rx="4.5" fill="#D9D9E3" />
        <rect x="132" y="272" width="84" height="8" rx="4" fill={c.a} />

        <rect x="110" y="166" width="250" height="60" rx="16" fill={c.card} stroke={c.stroke} />
        <rect x="130" y="182" width="28" height="28" rx="8" fill={c.b} />
        <path d="M137 196l5 5 9-10" fill="none" stroke={c.bInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="172" y="186" width="150" height="9" rx="4.5" fill="#D9D9E3" />
        <rect x="172" y="202" width="70" height="8" rx="4" fill={c.b} />

        <rect x="150" y="96" width="250" height="60" rx="16" fill={c.card} stroke={c.stroke} />
        <rect x="170" y="112" width="28" height="28" rx="8" fill={c.c} />
        <path d="M177 126l5 5 9-10" fill="none" stroke={c.cInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="212" y="116" width="120" height="9" rx="4.5" fill="#D9D9E3" />
        <rect x="212" y="132" width="96" height="8" rx="4" fill={c.c} />
      </g>
    </svg>
  );
}
