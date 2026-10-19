import { test, expect, Page, Browser } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resetEmulators, seedAdmin } from "./emulator";

// v1 as it ships: individual users only (VITE_FEATURE_TEAMS=false).
// Covers onboarding without a manager, reflections, review preparation for a chosen
// period (wins with impact + reflections, in the UI and in the PDF), and the admin
// view showing profiles only.

const PASSWORD = "Passw0rd!x";
const USER = { email: "riya@winfolio.test", name: "Riya Individual" };
const ADMIN = { email: "owner@winfolio.test", name: "Olu Owner" };

const WIN_TITLE = "Cut checkout errors for large orders";
const WIN_IMPACT = "Failed checkouts dropped from daily to none over two weeks";
const REFLECTION = "Shipped the checkout fix before the sale";

const appErrors: string[] = [];

async function newPage(browser: Browser, label: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  page.on("pageerror", (err) => appErrors.push(`[${label}] uncaught: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /permission|insufficient|FirebaseError|Uncaught/i.test(msg.text())) {
      appErrors.push(`[${label}] console: ${msg.text().slice(0, 300)}`);
    }
  });
  return page;
}

async function chooseOption(page: Page, trigger: ReturnType<Page["locator"]>, option: string | RegExp) {
  await trigger.click();
  await page.getByRole("option", { name: option }).click();
}

test.describe.serial("Individual mode (v1)", () => {
  let page: Page;
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    await resetEmulators();
    await seedAdmin(ADMIN.email, PASSWORD, ADMIN.name);
    page = await newPage(browser, "user");
    admin = await newPage(browser, "admin");
  });

  test("sign-up and onboarding have no manager step", async () => {
    await page.goto("/auth");
    await page.getByRole("tab", { name: "Sign Up" }).click();
    await page.locator("#signup-name").fill(USER.name);
    await page.locator("#signup-email").fill(USER.email);
    await page.locator("#signup-password").fill(PASSWORD);
    await expect(page.getByText(/your workspace admin/)).toHaveCount(0);
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page).toHaveURL(/\/onboard$/);
    await expect(page.getByRole("combobox", { name: "Your role" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Your manager" })).toHaveCount(0);
    await page.locator("#team").fill("Engineering");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await page.getByRole("button", { name: /Complete Setup/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("navigation shows Reflections and no team features", async () => {
    const nav = page.getByRole("complementary").first();
    await expect(nav.getByRole("button", { name: "Reflections" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Manager" })).toHaveCount(0);
    await page.goto("/manager");
    await expect(page.getByText("Oops! Page not found")).toBeVisible();
  });

  test("log a win with impact and write a reflection", async () => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Add Work Activity" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#title").fill(WIN_TITLE);
    await dialog.locator("#impact").fill(WIN_IMPACT);
    await dialog.getByRole("button", { name: /Capture Achievement/ }).click();
    await expect(page.getByText("Activity added successfully")).toBeVisible();

    await page.goto("/check-ins");
    await expect(page.getByRole("heading", { name: "Weekly Reflections" })).toBeVisible();
    await page.getByRole("button", { name: "New Reflection" }).click();
    await page.getByLabel("What went well this week? *").fill(REFLECTION);
    await page.getByLabel("What was challenging?").fill("Flaky staging environment");
    await page.getByLabel("What did you learn?").fill("Load-test before big sales");
    await page.getByLabel("What will you focus on next week?").fill("Add checkout monitoring");
    await page.getByRole("button", { name: "Save Reflection" }).click();
    await expect(page.getByText("Reflection saved")).toBeVisible();
  });

  test("review preparation includes wins with impact and reflections for the period", async () => {
    await page.goto("/dashboard?tab=review");
    await expect(page.getByText("Prepare my performance review")).toBeVisible();

    // Default period is the current quarter, which contains today's records.
    await expect(page.getByText(WIN_TITLE)).toBeVisible();
    await expect(page.getByText(WIN_IMPACT)).toBeVisible();
    await expect(page.getByText(REFLECTION)).toBeVisible();

    // A custom range in the past contains nothing.
    await chooseOption(page, page.getByLabel("Review period"), "Custom range…");
    await page.getByLabel("From", { exact: true }).fill("2020-01-01");
    await page.getByLabel("To", { exact: true }).fill("2020-03-31");
    await expect(page.getByText(/No wins recorded for/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Download review PDF/ })).toBeDisabled();

    // Back to the current quarter, and the PDF contains the actual records.
    const now = new Date();
    const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    await chooseOption(page, page.getByLabel("Review period"), currentQuarter);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Download review PDF/ }).click();
    const file = await download;
    await file.saveAs("test-results/review-sample.pdf"); // kept for visual review
    expect(file.suggestedFilename()).toMatch(/^Review_Riya_Individual_Q[1-4]_\d{4}\.pdf$/);
    // The PDF is uncompressed; join its text-show operators so wrapped table cells read as one string.
    const raw = readFileSync((await file.path())!, "latin1");
    const pdfText = [...raw.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)]
      .map((m) => m[1].replace(/\\([()\\])/g, "$1"))
      .join(" ")
      .replace(/\s+/g, " ");
    for (const text of ["Performance review summary", USER.name, WIN_TITLE, WIN_IMPACT, REFLECTION, "Weekly reflections"]) {
      expect(pdfText, `PDF should contain "${text}"`).toContain(text);
    }
  });

  test("admin sees profiles only, with no team controls", async () => {
    await admin.goto("/auth");
    await admin.locator("#signin-email").fill(ADMIN.email);
    await admin.locator("#signin-password").fill(PASSWORD);
    await admin.locator("form").getByRole("button", { name: "Sign In" }).click();
    await expect(admin).toHaveURL(/\/dashboard$/);

    await admin.goto("/admin");
    await expect(admin.getByRole("row", { name: new RegExp(USER.email) })).toBeVisible();
    await expect(admin.getByRole("columnheader", { name: "Reports to" })).toHaveCount(0);
    await expect(admin.getByRole("button", { name: "Sync manager directory" })).toHaveCount(0);
    await admin.getByRole("combobox", { name: `Role for ${USER.name}` }).click();
    await expect(admin.getByRole("option", { name: "Manager" })).toHaveCount(0);
    await admin.keyboard.press("Escape");
  });

  test("no permission errors or crashes were logged", async () => {
    expect(appErrors).toEqual([]);
  });
});
