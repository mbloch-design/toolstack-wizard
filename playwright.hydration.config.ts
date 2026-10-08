import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "**/tool-hydration.spec.ts",
  testIgnore: [],
  use: { ...base.use, baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8087" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "node scripts/serve-generated-html.mjs",
    url: "http://127.0.0.1:8087/en/tool/notion",
    reuseExistingServer: false,
  },
});
