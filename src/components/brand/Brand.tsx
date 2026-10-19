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
