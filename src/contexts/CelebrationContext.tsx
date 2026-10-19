import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Mascot, MascotPose } from '@/components/landing/Mascot';
import { Confetti } from '@/components/landing/Effects';
import { usePrefersReducedMotion } from '@/components/landing/motion';
import '@/components/landing/playful.css';

interface Celebration {
  id: number;
  message: string;
  pose: MascotPose;
  confetti: boolean;
}

interface CelebrationContextType {
  /** Show Momo briefly with a message. Confetti is skipped for reduced motion. */
  celebrate: (message: string, options?: { pose?: MascotPose; confetti?: boolean }) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

const VISIBLE_MS = 2400;

/**
 * Momo's in-app reactions: a small card at the bottom of the screen for a couple of
 * seconds. It never blocks clicks, and the message is announced to screen readers.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState<Celebration | null>(null);
  const counter = useRef(0);

  const celebrate = useCallback<CelebrationContextType['celebrate']>((message, options = {}) => {
    counter.current += 1;
    setCurrent({ id: counter.current, message, pose: options.pose ?? 'celebrate', confetti: options.confetti ?? true });
  }, []);

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setCurrent(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [current]);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      <div aria-live="polite" className="sr-only">{current?.message ?? ''}</div>
      {current && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-hidden="true">
          <div
            key={current.id}
            className="relative flex items-center gap-3 rounded-2xl border-2 border-foreground bg-card py-2 pl-2 pr-5 shadow-[4px_4px_0_hsl(var(--foreground))] dark:border-pastel-violet-ink dark:shadow-[4px_4px_0_hsl(var(--pastel-violet))] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
          >
            <Mascot pose={current.pose} className="h-14 w-12" />
            <span className="font-bold">{current.message}</span>
            {current.confetti && !reduced && <Confetti fire={current.id} count={18} />}
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebrate() {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebrate must be used within a CelebrationProvider');
  }
  return context.celebrate;
}
