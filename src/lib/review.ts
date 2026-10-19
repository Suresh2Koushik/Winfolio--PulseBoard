import {
  endOfDay, endOfMonth, endOfQuarter, endOfYear, format, isValid, parseISO,
  startOfDay, startOfMonth, startOfQuarter, startOfYear, subMonths, subQuarters, subYears,
} from "date-fns";
import type { Activity, CheckIn } from "@/types";

export type PeriodKind = "month" | "quarter" | "half" | "year" | "custom";

export interface ReviewPeriod {
  /** Stable id for selects, e.g. "month:2026-10", "quarter:2026-Q4", "custom:2026-01-01:2026-03-31". */
  id: string;
  kind: PeriodKind;
  label: string;
  start: Date;
  end: Date;
}

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

function halfOf(date: Date) {
  const firstHalf = date.getMonth() < 6;
  const start = new Date(date.getFullYear(), firstHalf ? 0 : 6, 1);
  const end = endOfMonth(new Date(date.getFullYear(), firstHalf ? 5 : 11, 1));
  return { start, end, label: `H${firstHalf ? 1 : 2} ${date.getFullYear()}` };
}

/** Recent periods to choose from, newest first within each kind. */
export function periodOptions(now: Date = new Date()): Record<Exclude<PeriodKind, "custom">, ReviewPeriod[]> {
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = startOfMonth(subMonths(now, i));
    return { id: `month:${format(start, "yyyy-MM")}`, kind: "month" as const, label: format(start, "MMMM yyyy"), start, end: endOfMonth(start) };
  });
  const quarters = Array.from({ length: 6 }, (_, i) => {
    const start = startOfQuarter(subQuarters(now, i));
    return { id: `quarter:${format(start, "yyyy-'Q'Q")}`, kind: "quarter" as const, label: format(start, "QQQ yyyy"), start, end: endOfQuarter(start) };
  });
  const halves = Array.from({ length: 4 }, (_, i) => {
    const h = halfOf(subMonths(startOfMonth(now), i * 6));
    return { id: `half:${ymd(h.start)}`, kind: "half" as const, label: h.label, start: h.start, end: h.end };
  });
  const years = Array.from({ length: 3 }, (_, i) => {
    const start = startOfYear(subYears(now, i));
    return { id: `year:${start.getFullYear()}`, kind: "year" as const, label: String(start.getFullYear()), start, end: endOfYear(start) };
  });
  return { month: months, quarter: quarters, half: halves, year: years };
}

/** A custom range from two yyyy-MM-dd strings, or null if invalid or reversed. */
export function customPeriod(from: string, to: string): ReviewPeriod | null {
  const start = startOfDay(parseISO(from));
  const end = endOfDay(parseISO(to));
  if (!isValid(start) || !isValid(end) || start > end) return null;
  return {
    id: `custom:${from}:${to}`,
    kind: "custom",
    label: `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`,
    start,
    end,
  };
}

export interface CategoryGroup {
  category: string;
  wins: Activity[];
}

export interface ReviewData {
  wins: Activity[];
  byCategory: CategoryGroup[];
  withImpact: number;
  reflections: CheckIn[];
}

const inRange = (dateStr: string, start: Date, end: Date) => {
  const d = parseISO(dateStr);
  return isValid(d) && d >= start && d <= end;
};

export const hasImpact = (a: Activity) => (a.impactNotes ?? "").trim().length > 0;

/**
 * Everything recorded in a period. Wins count by their date; a weekly reflection
 * counts in the period its week starts in. Categories are ordered by number of
 * wins (then name); wins within a category are oldest first.
 */
export function buildReview(activities: Activity[], checkIns: CheckIn[], period: Pick<ReviewPeriod, "start" | "end">): ReviewData {
  const wins = activities
    .filter((a) => inRange(a.date, period.start, period.end))
    .sort((a, b) => a.date.localeCompare(b.date));

  const groups = new Map<string, Activity[]>();
  for (const win of wins) {
    const key = win.category || "Other";
    groups.set(key, [...(groups.get(key) ?? []), win]);
  }
  const byCategory = Array.from(groups, ([category, list]) => ({ category, wins: list }))
    .sort((a, b) => b.wins.length - a.wins.length || a.category.localeCompare(b.category));

  const reflections = checkIns
    .filter((c) => inRange(c.weekStart, period.start, period.end))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return { wins, byCategory, withImpact: wins.filter(hasImpact).length, reflections };
}
