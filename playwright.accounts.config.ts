import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_ACCOUNTS_PORT || "8192";
const baseURL = `http://127.0.0.1:${port}`;
// The portable deletion recipe consumes this explicit isolated origin too.
process.env.PLAYWRIGHT_BASE_URL = baseURL;
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["stack-account.spec.ts", "backoffice-accounts.spec.ts", "backoffice-catalog.spec.ts", "stack-account-lifecycle.spec.ts", "account-experience.spec.ts"],
  timeout: 45_000, expect: { timeout: 10_000 }, fullyParallel: false, workers: 1,
  forbidOnly: !!process.env.CI, retries: 0, reporter: "list",
  outputDir: "test-results/accounts",
  use: { baseURL, trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node e2e/fixtures/accounts-server.mjs", url: baseURL, reuseExistingServer: false,
    env: { PLAYWRIGHT_ACCOUNTS_PORT: port }, timeout: 120_000 },
});
