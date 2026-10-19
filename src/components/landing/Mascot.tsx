import { cn } from "@/lib/utils";

export type MascotPose = "idle" | "celebrate" | "thumbs";

interface MascotProps {
  pose?: MascotPose;
  className?: string;
}

/**
 * Winfolio's notebook mascot (first draft). Decorative: hidden from screen readers.
 * Idle: breathes and blinks. Celebrate: arms up, open smile, jumps.
 * Thumbs: a thumbs-up with a wink-free grin.
 */
export function Mascot({ pose = "idle", className }: MascotProps) {
  const celebrating = pose === "celebrate";
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="133" rx="30" ry="4" fill="#0B0B12" opacity="0.12" />
      <g className={cn(celebrating ? "wf-jump" : "wf-breathe")} style={{ transformOrigin: "60px 120px" }}>
        {/* legs */}
        <path d="M48 116v9M72 116v9" stroke="#0B0B12" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="45" cy="126" rx="6" ry="3.5" fill="#0B0B12" />
        <ellipse cx="75" cy="126" rx="6" ry="3.5" fill="#0B0B12" />

        {/* arms */}
        {celebrating ? (
          <g stroke="#0B0B12" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M24 66 L9 44" />
            <path d="M96 66 L111 44" />
            <circle cx="8" cy="41" r="4" fill="#FFE1EC" />
            <circle cx="112" cy="41" r="4" fill="#FFE1EC" />
          </g>
        ) : pose === "thumbs" ? (
          <g stroke="#0B0B12" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M24 78 L12 90" />
            <path d="M96 78 Q108 76 110 66" />
            <rect x="103" y="54" width="13" height="13" rx="4" fill="#FFE1EC" strokeWidth="3" />
            <path d="M109 54 V45" strokeWidth="4" />
          </g>
        ) : (
          <path d="M24 80 L12 92 M96 80 L108 92" stroke="#0B0B12" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* body: a notebook */}
        <rect x="22" y="18" width="76" height="98" rx="16" fill="#C4B1FF" stroke="#0B0B12" strokeWidth="3.5" />
        <path d="M80 16 h10 v24 l-5 -5 l-5 5 z" fill="#FFA8C8" stroke="#0B0B12" strokeWidth="3" strokeLinejoin="round" />
        {[34, 50, 66, 82, 98].map((y) => (
          <circle key={y} cx="22" cy={y} r="4.5" fill="#FFFFFF" stroke="#0B0B12" strokeWidth="2.5" />
        ))}

        {/* face */}
        <g className="wf-blink">
          <ellipse cx="49" cy="58" rx="4.5" ry="6" fill="#0B0B12" />
          <ellipse cx="73" cy="58" rx="4.5" ry="6" fill="#0B0B12" />
        </g>
        <circle cx="50.5" cy="55.5" r="1.6" fill="#FFFFFF" />
        <circle cx="74.5" cy="55.5" r="1.6" fill="#FFFFFF" />
        <circle cx="40" cy="70" r="5" fill="#FFA8C8" opacity="0.85" />
        <circle cx="82" cy="70" r="5" fill="#FFA8C8" opacity="0.85" />
        {celebrating ? (
          <g>
            <path d="M50 68 Q61 84 72 68 Z" fill="#0B0B12" />
            <path d="M55 74 Q61 79 67 74 Q61 77 55 74 Z" fill="#FFA8C8" />
          </g>
        ) : (
          <path d="M52 69 Q61 78 70 69" stroke="#0B0B12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  );
}
