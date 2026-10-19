import { test, expect, Page, Browser } from "@playwright/test";
import { resetEmulators, seedAdmin } from "./emulator";

// One story across three people, in order:
//   employee signs up -> logs work -> admin promotes a manager -> employee picks that
//   manager -> manager reviews and gives feedback -> employee acknowledges and completes it.

const PASSWORD = "Passw0rd!x";
const ADMIN = { email: "admin@pulseboard.test", name: "Ada Admin" };
const ALICE = { email: "alice@pulseboard.test", name: "Alice Employee" };
const BOB = { email: "bob@pulseboard.test", name: "Bob Manager" };

const year = new Date().getFullYear();

// Errors the app logs or throws are collected and asserted empty at the end, so a
// permission-denied listener or crash can't hide behind a passing UI check.
const appErrors: string[] = [];

async function newPage(browser: Browser, label: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (err) => appErrors.push(`[${label}] uncaught: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/permission|insufficient|Missing or insufficient|FirebaseError|Uncaught/i.test(text)) {
      appErrors.push(`[${label}] console: ${text.slice(0, 300)}`);
    }
  });
  return page;
}

async function signUp(page: Page, person: { email: string; name: string }, team: string, role?: string) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: "Sign Up" }).click();
  await page.locator("#signup-name").fill(person.name);
  await page.locator("#signup-email").fill(person.email);
  await page.locator("#signup-password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();

  // New accounts are sent to onboarding.
  await expect(page).toHaveURL(/\/onboard$/);
  await page.locator("#team").fill(team);
  if (role) await chooseOption(page, page.getByRole("combobox", { name: "Your role" }), role);
  await page.getByRole("button", { name: /Next Step/ }).click();
  // The recommended set (not company-specific defaults) is offered.
  await expect(page.getByText("Customer & Business Impact")).toBeVisible();
  await expect(page.getByText("Roofing Core Vertical")).toHaveCount(0);
  await page.getByRole("button", { name: /Complete Setup/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: new RegExp(`Good (morning|afternoon|evening), ${person.name.split(" ")[0]}`) })).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.goto("/auth");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function chooseOption(page: Page, trigger: ReturnType<Page["locator"]>, option: string | RegExp) {
  await trigger.click();
  await page.getByRole("option", { name: option }).click();
}

test.describe.serial("Winfolio team workflows (v2 features)", () => {
  let alice: Page;
  let bob: Page;
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    await resetEmulators();
    await seedAdmin(ADMIN.email, PASSWORD, ADMIN.name);
    alice = await newPage(browser, "alice");
    bob = await newPage(browser, "bob");
    admin = await newPage(browser, "admin");
  });

  test("visitors are sent to sign in", async () => {
    await alice.goto("/dashboard");
    await expect(alice).toHaveURL(/\/auth$/);
  });

  test("employee signs up, onboards, and cannot reach manager/admin pages", async () => {
    await signUp(alice, ALICE, "Engineering", "Engineering");
    await signUp(bob, BOB, "Engineering");

    await alice.goto("/admin");
    await expect(alice).toHaveURL(/\/dashboard$/);
    await alice.goto("/manager");
    await expect(alice).toHaveURL(/\/dashboard$/);
  });

  test("employee logs a dated activity and a quarter activity", async () => {
    await alice.goto("/dashboard");
    const logWin = alice.getByRole("complementary").first().getByRole("button", { name: "Log a win" });
    await logWin.click();
    const dialog = alice.getByRole("dialog", { name: "Log a win" });
    // Role-tuned keyword suggestion ("hotfix" is an engineering keyword).
    await dialog.locator("#title").fill("Hotfix for login outage");
    await expect(dialog.getByRole("button", { name: /Suggested: Problem Solving/ })).toBeVisible();
    await dialog.locator("#title").fill("Shipped onboarding revamp");
    await dialog.getByRole("button", { name: "Save win" }).click();
    await expect(alice.getByText("Win saved! Look at you go.").first()).toBeVisible();
    await expect(alice.getByRole("region", { name: "Recent wins" }).getByText("Shipped onboarding revamp")).toBeVisible();

    // Quarter-level entry must stay in the chosen quarter (previously forced into Q1).
    await logWin.click();
    await dialog.getByRole("button", { name: "Quarter", exact: true }).click();
    await chooseOption(alice, dialog.getByRole("combobox", { name: "Quarter" }), "Q3");
    await dialog.locator("#title").fill("Q3 partner programme");
    await dialog.getByRole("button", { name: "Save win" }).click();
    await expect(dialog).toHaveCount(0);

    await alice.goto("/wins");
    await alice.getByRole("button", { name: "By quarter" }).click();
    const quarterSelect = alice.getByRole("main").getByRole("combobox").nth(1);
    await chooseOption(alice, quarterSelect, `Q3 ${year}`);
    await expect(alice.getByRole("heading", { name: "Q3 partner programme" })).toBeVisible();
  });

  test("employee submits a check-in with optional fields left blank", async () => {
    await alice.goto("/check-ins");
    await alice.getByRole("button", { name: "New Reflection" }).click();
    await alice.locator("#workSummary").fill("Finished the onboarding revamp and started partner work.");
    await alice.locator("#blockers").fill("Waiting on API keys from partner");
    await alice.getByRole("button", { name: "Save Reflection" }).click();
    await expect(alice.getByText(/Reflection saved/).first()).toBeVisible();
    await expect(alice.getByText("Finished the onboarding revamp").first()).toBeVisible();
  });

  test("employee creates a goal", async () => {
    await alice.goto("/goals");
    await alice.getByRole("button", { name: "New Goal" }).click();
    await alice.getByRole("dialog").locator("#title").fill("Launch partner integrations");
    await alice.getByRole("dialog").getByRole("button", { name: "Create Goal" }).click();
    await expect(alice.getByText("Goal created!")).toBeVisible();
    await expect(alice.getByText("Launch partner integrations").first()).toBeVisible();
  });

  test("employee attaches evidence to an activity, then removes it", async () => {
    await alice.goto("/wins");
    const card = alice.getByRole("listitem").filter({ hasText: "Shipped onboarding revamp" });
    await card.getByRole("button", { name: 'Edit "Shipped onboarding revamp"' }).click();

    const dialog = alice.getByRole("dialog", { name: "Edit win" });
    await dialog.getByRole("button", { name: "Add more detail" }).click();
    // 1x1 transparent PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    await dialog.locator("#attachment-input").setInputFiles({ name: "evidence.png", mimeType: "image/png", buffer: png });
    await expect(dialog.getByText("evidence.png")).toBeVisible();
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(alice.getByText("Win updated")).toBeVisible();
    await expect(card.getByRole("button", { name: "View attachment" })).toBeVisible();

    await card.getByRole("button", { name: 'Edit "Shipped onboarding revamp"' }).click();
    await dialog.getByRole("button", { name: "Remove attachment" }).click();
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(card.getByRole("button", { name: "View attachment" })).toHaveCount(0);
  });

  test("employee exports to Excel, imports the template, and generates a PDF", async () => {
    await alice.goto("/wins");

    const exported = alice.waitForEvent("download");
    await alice.getByRole("button", { name: "Export" }).click();
    expect((await exported).suggestedFilename()).toMatch(/^winfolio-wins-.*\.xlsx$/);

    const templateDownload = alice.waitForEvent("download");
    await alice.getByRole("button", { name: "Download the template" }).click();
    const template = await templateDownload;
    const templatePath = await template.path();

    await alice.getByRole("button", { name: "Import" }).click();
    await alice.locator("#file-upload").setInputFiles({
      name: "pulseboard-import-template.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: (await import("node:fs")).readFileSync(templatePath!),
    });
    await expect(alice.getByText("1 activities imported successfully!")).toBeVisible();
    await alice.getByRole("button", { name: "Done" }).click();
    await expect(alice.getByText("Customer Success Workshop")).toBeVisible();

    await alice.goto("/reviews");
    const pdf = alice.waitForEvent("download");
    await alice.getByRole("button", { name: /Download review PDF/ }).click();
    expect((await pdf).suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("admin promotes Bob to manager", async () => {
    await signIn(admin, ADMIN.email);
    await admin.goto("/admin");
    const row = admin.getByRole("row", { name: new RegExp(BOB.email) });
    await chooseOption(admin, row.getByRole("combobox", { name: `Role for ${BOB.name}` }), "Manager");
    await expect(admin.getByText(`${BOB.name} is now a manager`)).toBeVisible();
  });

  test("employee picks Bob as manager from Edit profile", async () => {
    await alice.goto("/onboard");
    await chooseOption(alice, alice.getByRole("combobox", { name: "Your manager" }), BOB.name);
    await alice.getByRole("button", { name: /Next Step/ }).click();
    await alice.getByRole("button", { name: /Complete Setup/ }).click();
    await expect(alice).toHaveURL(/\/dashboard$/);
  });

  test("manager sees the report's history and sends feedback with an action item", async () => {
    await bob.reload();
    await bob.goto("/manager");
    await expect(bob.getByRole("heading", { name: "Manager Dashboard" })).toBeVisible();
    await expect(bob.getByRole("heading", { name: ALICE.name })).toBeVisible();

    // The check-in Alice wrote before choosing Bob is re-tagged and becomes visible.
    await bob.getByRole("tab", { name: "Recent Check-Ins" }).click();
    await expect(bob.getByText("Finished the onboarding revamp")).toBeVisible();
    await bob.getByRole("tab", { name: "Blockers & Risks" }).click();
    await expect(bob.getByText("Waiting on API keys from partner")).toBeVisible();

    await bob.getByRole("tab", { name: "Team Overview" }).click();
    await bob.getByRole("button", { name: "Give feedback" }).click();
    const dialog = bob.getByRole("dialog");
    await dialog.locator("#feedback").fill("Great progress on onboarding. Let's unblock the partner keys.");
    await dialog.getByPlaceholder("Action item title").fill("Email partner about API keys");
    await dialog.getByRole("button", { name: /Send Feedback/ }).click();
    await expect(bob.getByText("Feedback sent")).toBeVisible();

    await bob.getByRole("tab", { name: /Feedback Sent/ }).click();
    await expect(bob.getByText(`To ${ALICE.name}`)).toBeVisible();
  });

  test("employee acknowledges feedback and completes the action item", async () => {
    await alice.goto("/dashboard");
    await expect(alice.getByText("Great progress on onboarding.")).toBeVisible();
    await alice.getByRole("button", { name: "Acknowledge Feedback" }).click();
    await expect(alice.getByText("Feedback acknowledged")).toBeVisible();

    const item = alice.getByText("Email partner about API keys");
    await expect(item).toBeVisible();
    await item.locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]").getByRole("button").click();
    await expect(alice.getByText("Action item completed")).toBeVisible();
  });

  test("no permission errors or crashes were logged during the journey", async () => {
    expect(appErrors).toEqual([]);
  });

  test("Reviews link opens the reviews page", async () => {
    await alice.goto("/dashboard");
    await alice.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Reviews" }).click();
    await expect(alice).toHaveURL(/\/reviews$/);
    await expect(alice.getByText("Prepare my performance review")).toBeVisible();
  });
});
