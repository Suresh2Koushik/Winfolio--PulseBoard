import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the Firebase emulators (see `npm run test:e2e`),
// never against a real project. Two builds of the app are served:
//   - individual: v1 as it ships (team features off), port 5175
//   - teams: team features on, to keep v2 functionality covered, port 5174
// The individual flow also runs in Firefox, Safari (WebKit) and a phone viewport, and
// an automated accessibility scan covers every main screen.
// Projects run one after another (workers: 1) because they share the emulators.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "individual",
      testMatch: "individual.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5175" },
    },
    {
      name: "individual-firefox",
      testMatch: "individual.spec.ts",
      use: { ...devices["Desktop Firefox"], baseURL: "http://localhost:5175" },
    },
    {
      name: "individual-safari",
      // WebKit on Windows is much slower than real Safari; give it more time.
      timeout: 240_000,
      expect: { timeout: 30_000 },
      testMatch: "individual.spec.ts",
      use: { ...devices["Desktop Safari"], baseURL: "http://localhost:5175" },
    },
    {
      name: "individual-phone",
      // WebKit on Windows is much slower than real Safari; give it more time.
      timeout: 240_000,
      expect: { timeout: 30_000 },
      testMatch: "individual.spec.ts",
      use: { ...devices["iPhone 13"], baseURL: "http://localhost:5175" },
    },
    {
      name: "accessibility",
      testMatch: "accessibility.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5175" },
    },
    {
      name: "teams",
      testMatch: "workflows.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5174" },
    },
  ],
  webServer: [
    {
      command: "npx vite --mode e2e-v1 --port 5175 --strictPort",
      url: "http://localhost:5175",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npx vite --mode e2e --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
