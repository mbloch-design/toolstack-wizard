import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

// Design system tests run in a real browser: layout invariants and every story (with its a11y check).
// One browser object per project: Vitest names its instances in place.
const browser = () => ({ enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" as const }] });

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    projects: [
      { extends: true, test: { name: "ds-unit", include: ["src/ds/**/*.browser.test.ts"], browser: browser() } },
      { extends: true, plugins: [storybookTest({ configDir: ".storybook" })], test: { name: "storybook", browser: browser() } },
    ],
  },
});
