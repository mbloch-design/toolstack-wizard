import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

// Design system tests run in a real browser: layout invariants and every story (with its a11y check).
// One browser object per project: Vitest names its instances in place.
const browser = () => ({ enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" as const }] });
// Stories run at the three widths of the visual tests: a word breaks on a phone, not on a desktop.
const widths = () => ({ ...browser(), instances: [390, 768, 1280].map((width) => ({ browser: "chromium" as const, name: `storybook-${width}`, viewport: { width, height: 900 } })) });

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    projects: [
      { extends: true, test: { name: "ds-unit", include: ["src/ds/**/*.browser.test.ts"], browser: browser() } },
      { extends: true, plugins: [storybookTest({ configDir: ".storybook" })], test: { name: "storybook", browser: widths() } },
    ],
  },
});
