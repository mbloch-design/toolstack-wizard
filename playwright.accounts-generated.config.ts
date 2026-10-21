import { defineConfig, devices } from '@playwright/test';
const baseURL = 'http://127.0.0.1:8193';
export default defineConfig({
 testDir: './e2e', testMatch: 'account-generated-routing.spec.ts', workers: 1, fullyParallel: false,
 timeout: 30_000, expect: { timeout: 10_000 }, retries: 0, reporter: 'list', outputDir: 'test-results/accounts-generated',
 use: { baseURL, serviceWorkers: 'block', trace: 'retain-on-failure' },
 projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
 // Intentionally does not build: the controller runs this after the single final production build.
 webServer: { command: 'node scripts/serve-generated-routing.mjs', url: baseURL, reuseExistingServer: false, env: { PORT: '8193' }, timeout: 30_000 },
});
