import { describe, expect, it } from "vitest";
import { categorizeActivity } from "@/utils/categorization";
import { categoriesForRole, categoryDisplay, DEFAULT_CATEGORIES } from "@/lib/categories";

describe("categorizeActivity", () => {
  const general = categoriesForRole("general");

  it("suggests the best-matching category", () => {
    expect(categorizeActivity("Fixed the checkout incident", "", general)).toBe("Problem Solving");
    expect(categorizeActivity("Mentored two new hires", "", general)).toBe("Leadership & Mentoring");
    expect(categorizeActivity("Completed AWS certification", "", general)).toBe("Learning & Growth");
  });

  it("returns null instead of guessing when nothing matches", () => {
    expect(categorizeActivity("Lunch", "", general)).toBeNull();
  });

  it("matches whole words only", () => {
    // "led" must not match "filed"; "doc" style partials must not match longer words.
    expect(categorizeActivity("Filed expense report", "", general)).not.toBe("Leadership & Mentoring");
  });

  it("weights the title above the description", () => {
    expect(
      categorizeActivity("Mentored a junior engineer", "we also fixed a bug together", general),
    ).toBe("Leadership & Mentoring");
  });

  it("uses role-specific keywords", () => {
    expect(categorizeActivity("Closed the Acme deal", "", categoriesForRole("sales_cs"))).toBe("Customer & Business Impact");
    expect(categorizeActivity("Closed the Acme deal", "", categoriesForRole("general"))).toBeNull();
    expect(categorizeActivity("Merged the payments refactor", "", categoriesForRole("engineering"))).toBe("Delivery & Execution");
  });
});

describe("category defaults", () => {
  it("contains no company-specific categories", () => {
    const names = DEFAULT_CATEGORIES.map((c) => c.name);
    expect(names).not.toContain("Roofing Core Vertical");
    expect(names).toContain("Other");
    expect(new Set(names).size).toBe(names.length);
  });

  it("role sets keep the same category names", () => {
    for (const role of ["engineering", "product", "sales_cs", "marketing", "operations", "general"] as const) {
      expect(categoriesForRole(role).map((c) => c.name)).toEqual(DEFAULT_CATEGORIES.map((c) => c.name));
    }
  });

  it("still displays legacy category names from older data", () => {
    expect(categoryDisplay("Roofing Core Vertical").emoji).toBe("🧩");
    expect(categoryDisplay("Something custom").emoji).toBe("🔹");
    expect(categoryDisplay("Mine", [{ name: "Mine", emoji: "⭐", color: "red" }]).emoji).toBe("⭐");
  });
});
