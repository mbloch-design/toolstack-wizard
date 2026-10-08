import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Hydration needs generated HTML; use playwright.hydration.config.ts.
  testIgnore: "**/tool-hydration.spec.ts",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8080",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      command: "npm run dev -- --host 127.0.0.1 --port 8080 --strictPort",
      url: "http://127.0.0.1:8080",
      reuseExistingServer: false,
      timeout: 120_000,
    },
});
