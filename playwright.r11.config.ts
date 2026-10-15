import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: '**/r11-*.spec.ts',
  outputDir: 'r11-test-results',
  use: { ...base.use, baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8093' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node scripts/serve-generated-routing.mjs',
    url: 'http://127.0.0.1:8093/en/tool/notion',
    reuseExistingServer: false,
  },
});
