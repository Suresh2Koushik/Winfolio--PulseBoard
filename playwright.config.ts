import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the Firebase emulators (see `npm run test:e2e`),
// never against a real project.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --mode e2e --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
