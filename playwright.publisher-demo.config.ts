import { defineConfig } from '@playwright/test';
const port = process.env.PLAYWRIGHT_CMS_DEMO_PORT || '8193';
export default defineConfig({
  testDir: './e2e', testMatch: 'publisher-demo.spec.ts', workers: 1,
  timeout: 60000, expect: { timeout: 10000 }, reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, serviceWorkers: 'block', trace: 'retain-on-failure' },
  webServer: { command: 'node e2e/fixtures/accounts-server.mjs --cms-demo', url: `http://127.0.0.1:${port}`,
    env: { PLAYWRIGHT_ACCOUNTS_PORT: port }, reuseExistingServer: false, timeout: 120000 },
});
