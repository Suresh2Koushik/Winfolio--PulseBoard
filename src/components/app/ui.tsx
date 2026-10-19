import { ReactNode, useState } from "react";
import { format, parseISO } from "date-fns";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { Activity } from "@/types";
import { Mascot, MascotPose } from "@/components/landing/Mascot";
import { categoryDisplay } from "@/lib/categories";
import { hasImpact } from "@/lib/review";
import { openAttachment } from "@/lib/attachments";
import { useUserData } from "@/hooks/useUserData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Page title block used at the top of every app page. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-extrabold leading-tight tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Standard page container. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-8", className)}>{children}</div>;
}

const TINTS = {
  blue: "bg-pastel-blue text-pastel-blue-ink",
  violet: "bg-pastel-violet text-pastel-violet-ink",
  pink: "bg-pastel-pink text-pastel-pink-ink",
  ink: "bg-foreground text-background dark:bg-secondary dark:text-foreground",
} as const;
export type Tint = keyof typeof TINTS;

/** A single number with a label, on a pastel tint. Only ever shows real data. */
export function StatTile({ label, value, note, tint = "blue" }: { label: string; value: ReactNode; note?: ReactNode; tint?: Tint }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-2xl p-5", TINTS[tint])}>
      <span className="text-sm font-bold opacity-90">{label}</span>
      <span className={cn("text-3xl font-extrabold tracking-tight", tint === "ink" ? "text-background dark:text-foreground" : "text-foreground")}>{value}</span>
      {note && <span className="text-[13px] font-medium opacity-90">{note}</span>}
    </div>
  );
}

/** Momo with a short message and an optional action, for empty screens. */
export function EmptyState({ title, body, action, pose = "idle" }: { title: string; body?: ReactNode; action?: ReactNode; pose?: MascotPose }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-6 py-10 text-center">
      <Mascot pose={pose} className="h-24 w-20" />
      <p className="text-lg font-extrabold">{title}</p>
      {body && <p className="max-w-md text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

/** Placeholder rows shown while data loads. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One win, compact. Edit and delete are shown only when handlers are given. */
export function WinRow({ win, onEdit, onDelete }: { win: Activity; onEdit?: (w: Activity) => void; onDelete?: (w: Activity) => void }) {
  const { categories } = useUserData();
  const display = categoryDisplay(win.category, categories);
  return (
    <li className="group flex items-start gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(11,11,18,0.35)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg" aria-hidden="true">{display.emoji}</span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold leading-snug">{win.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>{format(parseISO(win.date), "MMM d, yyyy")}</span>
          <span aria-hidden="true">·</span>
          <span>{win.category}</span>
          {win.status !== "Done" && (<><span aria-hidden="true">·</span><span>{win.status}</span></>)}
        </p>
        {hasImpact(win) && (
          <p className="text-sm"><span className="font-semibold">What changed:</span> <span className="text-muted-foreground">{win.impactNotes}</span></p>
        )}
        {win.attachmentUrl && (
          <button type="button" onClick={() => void openAttachment(win.attachmentUrl!)} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> View attachment
          </button>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <button type="button" onClick={() => onEdit(win)} aria-label={`Edit "${win.title}"`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(win)} aria-label={`Delete "${win.title}"`} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * A styled confirmation dialog (replaces the browser's confirm()).
 * Usage: const confirm = useConfirm(); ... confirm.ask({...}) ... {confirm.dialog}
 */
export function useConfirm() {
  const [pending, setPending] = useState<{ title: string; body: string; action: string; onConfirm: () => void } | null>(null);
  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { pending?.onConfirm(); setPending(null); }}
          >
            {pending?.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { ask: setPending, dialog };
}
