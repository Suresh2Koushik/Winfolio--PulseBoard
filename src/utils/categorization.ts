import { getWeek, getQuarter as getQuarterFromDate } from "date-fns";

export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 });
}

export function getQuarter(date: Date): string {
  const quarter = getQuarterFromDate(date);
  return `Q${quarter}`;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Picks the category whose keywords best match the text, or null when nothing
 * matches. Keywords match whole words/phrases ("doc" does not match "docker"),
 * title matches count triple, and ties go to the category listed first.
 */
export function categorizeActivity(
  title: string,
  description: string,
  categories: { name: string; keywords: string[] }[],
): string | null {
  const titleText = title.toLowerCase();
  const bodyText = description.toLowerCase();
  let best: { name: string; score: number } | null = null;

  for (const category of categories) {
    let score = 0;
    for (const raw of category.keywords) {
      const keyword = raw.trim().toLowerCase();
      if (!keyword) continue;
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}($|[^a-z0-9])`, "i");
      if (pattern.test(titleText)) score += 3;
      else if (pattern.test(bodyText)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { name: category.name, score };
  }

  return best?.name ?? null;
}

export function getWeekDates(weekNumber: number, year: number): { start: Date; end: Date } {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7;
  const dayOfWeek = firstDayOfYear.getDay();
  const startOffset = dayOfWeek <= 4 ? -dayOfWeek + 1 : 8 - dayOfWeek;

  const start = new Date(year, 0, 1 + startOffset + daysOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

export function formatWeekRange(weekNumber: number, year: number): string {
  const { start, end } = getWeekDates(weekNumber, year);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

// Alias for backward compatibility
export const suggestCategory = categorizeActivity;

