import { test, expect, Page, Browser, BrowserContextOptions } from "@playwright/test";
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

// Browser noise, not app errors: WebKit reports the emulator's long-lived Firestore
// connections as failed "access control checks" when a test navigates away mid-request,
// and Firefox can log one transient "could not reach backend" while the channel reconnects.
const isNavigationNoise = (text: string) =>
  /127\.0\.0\.1:8085\/.* due to access control checks/.test(text) ||
  /Could not reach Cloud Firestore backend\. Connection failed 1 times/.test(text);

async function newPage(browser: Browser, label: string): Promise<Page> {
  // Apply the project's device (viewport, touch, user agent) to this hand-made context.
  const { viewport, isMobile, hasTouch, userAgent, deviceScaleFactor } = test.info().project.use as BrowserContextOptions;
  const page = await (await browser.newContext({ viewport, isMobile, hasTouch, userAgent, deviceScaleFactor })).newPage();
  page.on("pageerror", (err) => {
    if (!isNavigationNoise(err.message)) appErrors.push(`[${label}] uncaught: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (isNavigationNoise(msg.text())) return;
    if (msg.type() === "error" && /permission|insufficient|FirebaseError|Uncaught/i.test(msg.text())) {
      appErrors.push(`[${label}] console: ${msg.text().slice(0, 300)}`);
    }
  });
  return page;
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

/** The sidebar on desktop; the slide-out menu on phones. */
async function openNav(page: Page) {
  if (isPhone(page)) await page.getByRole("button", { name: "Open menu" }).click();
  return page.getByRole("complementary").filter({ has: page.getByRole("navigation", { name: "Main" }) }).first();
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

  test("home page introduces Winfolio and leads to sign-up", async () => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Winfolio/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("You did a lot this week.");
    // Interactive example works on the live page.
    const done = page.getByRole("button", { name: "Done" });
    await done.click();
    await expect(done).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Look at you go!")).toBeVisible();
    await page.getByRole("link", { name: /Save your first win/ }).first().click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText("Every win deserves a place.").first()).toBeVisible();
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
    await openNav(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of ["Home", "Wins", "Reflections", "Goals", "Reviews"]) {
      await expect(nav.getByRole("link", { name })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Team" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Admin" })).toHaveCount(0);
    // A new user sees the setup checklist and an empty state, not made-up numbers.
    await expect(page.getByRole("heading", { name: /Get set up · 0 of 3/ })).toBeVisible();
    await expect(page.getByText("Your story starts with your first win.")).toBeVisible();
    await page.goto("/manager");
    await expect(page.getByText("Oops! Page not found")).toBeVisible();
  });

  test("log a win with impact and write a reflection", async () => {
    await page.goto("/dashboard");
    // First in page order: the sidebar on desktop, the top-bar button on phones.
    await page.getByRole("button", { name: "Log a win" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Log a win" });
    const category = dialog.locator("#category");

    // Example chips fill the title; the category follows the words automatically.
    await dialog.getByRole("button", { name: "Fixed a bug" }).click();
    await expect(dialog.locator("#title")).toHaveValue("Fixed a bug");
    await expect(category).toContainText("Problem Solving");
    await expect(dialog.getByText("Picked from what you wrote")).toBeVisible();

    // A category the person chooses is never overridden by later typing.
    await chooseOption(page, category, /Delivery & Execution/);
    await dialog.locator("#title").fill(WIN_TITLE);
    await dialog.locator("#impact").fill(WIN_IMPACT);
    await expect(category).toContainText("Delivery & Execution");
    await expect(dialog.getByText("Picked from what you wrote")).toHaveCount(0);
    await dialog.getByRole("button", { name: "Save win" }).click();
    await expect(page.getByText("Win saved! Look at you go.").first()).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Recent wins" }).getByText(WIN_TITLE)).toBeVisible();
    await expect(page.getByText("Wins this week").locator("..")).toContainText("1");

    // The old address still works.
    await page.goto("/check-ins");
    await expect(page).toHaveURL(/\/reflections$/);
    await expect(page.getByRole("heading", { name: "Weekly Reflections" })).toBeVisible();
    await page.getByRole("button", { name: "New Reflection" }).click();
    await page.getByLabel("What went well this week? *").fill(REFLECTION);
    await page.getByLabel("What was challenging?").fill("Flaky staging environment");
    await page.getByLabel("What did you learn?").fill("Load-test before big sales");
    await page.getByLabel("What will you focus on next week?").fill("Add checkout monitoring");
    await page.getByRole("button", { name: "Save Reflection" }).click();
    await expect(page.getByText(/Reflection saved/).first()).toBeVisible();
    await expect(page.getByText(REFLECTION)).toBeVisible();
  });

  test("wins page searches, edits and deletes with a styled confirmation", async () => {
    await page.goto("/wins");
    await page.getByRole("main").getByRole("button", { name: "Log a win" }).click();
    const dialog = page.getByRole("dialog", { name: "Log a win" });
    await dialog.locator("#title").fill("Temporary win to remove");
    await dialog.getByRole("button", { name: "Save win" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Temporary win to remove" })).toBeVisible();

    await page.getByLabel("Search wins").fill("checkout");
    await expect(page.getByText(WIN_TITLE)).toBeVisible();
    await expect(page.getByText("Temporary win to remove")).toHaveCount(0);
    await page.getByLabel("Search wins").fill("");

    await page.getByRole("button", { name: 'Edit "Temporary win to remove"' }).click();
    const edit = page.getByRole("dialog", { name: "Edit win" });
    await edit.locator("#title").fill("Temporary win, edited");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Temporary win, edited")).toBeVisible();

    await page.getByRole("button", { name: 'Delete "Temporary win, edited"' }).click();
    const confirmDialog = page.getByRole("alertdialog", { name: "Delete this win?" });
    await confirmDialog.getByRole("button", { name: "Keep it" }).click();
    await expect(page.getByText("Temporary win, edited")).toBeVisible();
    await page.getByRole("button", { name: 'Delete "Temporary win, edited"' }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete win" }).click();
    await expect(page.getByText("Temporary win, edited")).toHaveCount(0);

    await page.getByRole("button", { name: "By category" }).click();
    await expect(page).toHaveURL(/view=category/);
    await expect(page.getByText(WIN_TITLE)).toBeVisible();
  });

  test("review preparation includes wins with impact and reflections for the period", async () => {
    // Old dashboard tab links land on the new page.
    await page.goto("/dashboard?tab=review");
    await expect(page).toHaveURL(/\/reviews$/);
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
    await expect(page.getByText(/Your review PDF is ready/).first()).toBeVisible();
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

  test("settings shows the profile and data tools", async () => {
    await (await openNav(page)).getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(USER.email)).toBeVisible();
    await expect(page.getByRole("button", { name: "Export wins" })).toBeEnabled();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export wins" }).click();
    expect((await download).suggestedFilename()).toMatch(/winfolio-wins/);
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
