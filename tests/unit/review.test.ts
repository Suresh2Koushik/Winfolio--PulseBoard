import { describe, expect, it } from "vitest";
import { buildReview, customPeriod, periodOptions } from "@/lib/review";
import type { Activity, CheckIn } from "@/types";

const win = (id: string, date: string, category: string, impactNotes = ""): Activity => ({
  id, userId: "u", date, weekNumber: 1, title: `Win ${id}`, description: "", category, teams: [],
  impactNotes, status: "Done", createdAt: "", updatedAt: "",
});

const reflection = (id: string, weekStart: string): CheckIn => ({
  id, userId: "u", weekStart, weekEnd: weekStart, workSummary: `Went well ${id}`,
  linkedGoalIds: [], categories: [], createdAt: "", updatedAt: "",
});

describe("periodOptions", () => {
  const now = new Date(2026, 9, 31); // Oct 31, 2026: month-end must not skip or repeat months

  it("lists 12 distinct consecutive months", () => {
    const labels = periodOptions(now).month.map((p) => p.label);
    expect(labels[0]).toBe("October 2026");
    expect(labels[1]).toBe("September 2026");
    expect(new Set(labels).size).toBe(12);
  });

  it("covers quarters, halves and years with correct bounds", () => {
    const opts = periodOptions(now);
    expect(opts.quarter[0].label).toBe("Q4 2026");
    expect(opts.quarter[0].start).toEqual(new Date(2026, 9, 1));
    expect(opts.quarter[1].label).toBe("Q3 2026");
    expect(opts.half[0].label).toBe("H2 2026");
    expect(opts.half[1].label).toBe("H1 2026");
    expect(opts.half[2].label).toBe("H2 2025");
    expect(opts.year[0].label).toBe("2026");
    expect(opts.year[0].end.getMonth()).toBe(11);
  });
});

describe("customPeriod", () => {
  it("accepts a valid range, inclusive of both days", () => {
    const p = customPeriod("2026-01-01", "2026-03-31")!;
    expect(p.start).toEqual(new Date(2026, 0, 1));
    expect(p.end.getDate()).toBe(31);
    expect(p.end.getHours()).toBe(23);
  });

  it("rejects reversed or invalid ranges", () => {
    expect(customPeriod("2026-03-31", "2026-01-01")).toBeNull();
    expect(customPeriod("nope", "2026-01-01")).toBeNull();
  });
});

describe("buildReview", () => {
  const q4 = { start: new Date(2026, 9, 1), end: new Date(2026, 11, 31, 23, 59, 59) };
  const activities = [
    win("1", "2026-10-05", "Problem Solving", "Cut checkout errors"),
    win("2", "2026-11-12", "Problem Solving"),
    win("3", "2026-12-31", "Delivery & Execution", "Launched on time"),
    win("4", "2026-09-30", "Delivery & Execution", "Outside the period"),
    win("5", "2027-01-01", "Learning & Growth"),
  ];
  const checkIns = [reflection("a", "2026-09-28"), reflection("b", "2026-10-05"), reflection("c", "2026-12-28")];

  it("includes only records inside the period, including its last day", () => {
    const r = buildReview(activities, checkIns, q4);
    expect(r.wins.map((w) => w.id)).toEqual(["1", "2", "3"]);
    expect(r.reflections.map((c) => c.id)).toEqual(["b", "c"]);
  });

  it("groups by category, largest first, and counts documented impact", () => {
    const r = buildReview(activities, checkIns, q4);
    expect(r.byCategory.map((g) => [g.category, g.wins.length])).toEqual([
      ["Problem Solving", 2],
      ["Delivery & Execution", 1],
    ]);
    expect(r.withImpact).toBe(2);
  });

  it("returns empty results for an empty period", () => {
    const r = buildReview([], [], q4);
    expect(r).toEqual({ wins: [], byCategory: [], withImpact: 0, reflections: [] });
  });
});
