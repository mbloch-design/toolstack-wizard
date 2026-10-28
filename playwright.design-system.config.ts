import { defineConfig } from "@playwright/test";

// Intentionally independent of the dev-server config: this contract needs dist.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "design-system.spec.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  outputDir: "test-results/design-system",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8324",
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run preview -- --host 127.0.0.1 --port 8324 --strictPort",
    url: "http://127.0.0.1:8324/fr/tool/notion",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
