import { getWeek, getQuarter as getQuarterFromDate } from "date-fns";

export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 });
}

export function getQuarter(date: Date): string {
  const quarter = getQuarterFromDate(date);
  return `Q${quarter}`;
}

export function categorizeActivity(title: string, description: string, categories: { name: string; keywords: string[] }[]): string {
  const text = `${title} ${description}`.toLowerCase();

  for (const category of categories) {
    if (category.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return category.name;
    }
  }

  return "Other";
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

