import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  // Keep diagnostics when the suite deadline is reached; the job timeout
  // stays longer to allow the reporter and artifact upload to finish.
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : undefined,
  maxFailures: process.env.CI ? 5 : 0,
  workers: process.env.CI ? 1 : undefined,
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : base.reporter,
  testMatch: "**/tool-hydration.spec.ts",
  testIgnore: [],
  use: { ...base.use, contextOptions: { ...base.use?.contextOptions, reducedMotion: "no-preference" }, baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8087" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "node scripts/serve-generated-html.mjs",
    url: "http://127.0.0.1:8087/en/tool/notion",
    reuseExistingServer: false,
  },
});
