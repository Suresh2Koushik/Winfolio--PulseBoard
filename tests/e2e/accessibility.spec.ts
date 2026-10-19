import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resetEmulators } from "./emulator";

// Automated WCAG 2.1 A/AA scan (axe-core) of every main screen, with real content on it.
// This catches missing labels, low contrast, bad ARIA and similar; it does not replace
// a manual screen-reader pass.

const PASSWORD = "Passw0rd!x";

async function scan(page: Page, name: string) {
  // Let entrance animations settle so contrast is measured on final colours.
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map((v) =>
    `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n    ")}`);
  // Soft, so one run reports every screen with problems.
  expect.soft(summary, `Accessibility problems on ${name}`).toEqual([]);
}

test.describe.serial("Accessibility (WCAG 2.1 AA, automated)", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await resetEmulators();
    page = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  });

  test("home page and sign-in", async () => {
    await page.goto("/");
    await scan(page, "home page");
    await page.goto("/auth");
    await scan(page, "sign-in");
  });

  test("app screens", async () => {
    await page.goto("/auth");
    await page.getByRole("tab", { name: "Sign Up" }).click();
    await page.locator("#signup-name").fill("Ana Access");
    await page.locator("#signup-email").fill("ana@a11y.test");
    await page.locator("#signup-password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/onboard$/);
    await scan(page, "onboarding");
    await page.locator("#team").fill("Design");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await page.getByRole("button", { name: /Complete Setup/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await scan(page, "home (new user)");

    await page.getByRole("complementary").first().getByRole("button", { name: "Log a win" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Add more detail" }).click();
    await scan(page, "log a win dialog");
    await page.locator("#title").fill("Redesigned the settings page");
    await page.locator("#impact").fill("Support tickets about settings halved");
    await page.getByRole("button", { name: "Save win" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    for (const [path, name] of [
      ["/dashboard", "home"],
      ["/wins", "wins"],
      ["/wins?view=week", "wins by week"],
      ["/wins?view=category", "wins by category"],
      ["/wins?view=quarter", "wins by quarter"],
      ["/reflections", "reflections"],
      ["/goals", "goals"],
      ["/reviews", "reviews"],
      ["/settings", "settings"],
    ]) {
      await page.goto(path);
      await scan(page, name);
    }

    await page.goto("/wins");
    await page.getByRole("button", { name: 'Delete "Redesigned the settings page"' }).click();
    await scan(page, "delete confirmation");
    await page.keyboard.press("Escape");

    await page.getByRole("complementary").first().getByRole("button", { name: "Send feedback" }).click();
    await scan(page, "send feedback dialog");
    await page.keyboard.press("Escape");
  });

  test("app screens in dark mode", async () => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    for (const [path, name] of [
      ["/dashboard", "home"],
      ["/wins", "wins"],
      ["/wins?view=category", "wins by category"],
      ["/reflections", "reflections"],
      ["/goals", "goals"],
      ["/reviews", "reviews"],
      ["/settings", "settings"],
    ]) {
      await page.goto(path);
      await scan(page, `${name} (dark)`);
    }
    await page.getByRole("button", { name: "Log a win" }).first().click();
    await scan(page, "log a win dialog (dark)");
    await page.keyboard.press("Escape");

    // The landing page stays light whatever the setting.
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
