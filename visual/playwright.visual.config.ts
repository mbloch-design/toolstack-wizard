import { defineConfig } from "playwright/test";

const local = !process.env.CI;

export default defineConfig({
  testDir: ".",
  testMatch: "stories.visual.ts",
  // References come from CI's Linux (Playwright's image). On macOS we only write captures to look at, never compare.
  snapshotPathTemplate: local ? "{testDir}/__local__/{arg}{ext}" : "{testDir}/__screenshots__/{arg}{ext}",
  updateSnapshots: local ? "all" : "none",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:6007", reducedMotion: "reduce" },
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixels: 0 } },
  webServer: { command: "node serve.mjs", url: "http://127.0.0.1:6007/index.json", reuseExistingServer: !process.env.CI },
});
