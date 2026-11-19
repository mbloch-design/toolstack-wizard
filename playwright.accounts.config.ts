import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_ACCOUNTS_PORT || "8192";
const baseURL = `http://127.0.0.1:${port}`;
// CMS changes the admin publication path. Give publisher scenarios their own fixture.
const publisherPort = process.env.PLAYWRIGHT_PUBLISHER_CMS_PORT || String(Number(port) + 3);
const publisherBaseURL = `http://127.0.0.1:${publisherPort}`;
const publisherSpec = "publisher-cms.spec.ts";
// The portable deletion recipe consumes this explicit isolated origin too.
process.env.PLAYWRIGHT_BASE_URL = baseURL;
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["stack-account.spec.ts", "backoffice-accounts.spec.ts", "backoffice-catalog.spec.ts", "backoffice-inline-acceptance.spec.ts", publisherSpec, "stack-account-lifecycle.spec.ts", "account-experience.spec.ts", "stack-discovery-section.spec.ts"],
  timeout: 45_000, expect: { timeout: 10_000 }, fullyParallel: false, workers: 1,
  forbidOnly: !!process.env.CI, retries: 0, reporter: "list",
  outputDir: "test-results/accounts",
  use: { baseURL, trace: "retain-on-failure", serviceWorkers: "block" },
  projects: [
    { name: "chromium", testIgnore: publisherSpec, use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-publisher", testMatch: publisherSpec, use: { ...devices["Desktop Chrome"], baseURL: publisherBaseURL } },
  ],
  webServer: [
    { command: "node e2e/fixtures/accounts-server.mjs", url: baseURL, reuseExistingServer: false,
      env: { PLAYWRIGHT_ACCOUNTS_PORT: port, PLAYWRIGHT_PUBLISHER_CMS_ENABLED: "false" }, timeout: 120_000 },
    { command: "node e2e/fixtures/accounts-server.mjs", url: publisherBaseURL, reuseExistingServer: false,
      env: { PLAYWRIGHT_ACCOUNTS_PORT: publisherPort, PLAYWRIGHT_PUBLISHER_CMS_ENABLED: "true" }, timeout: 120_000 },
  ],
});
