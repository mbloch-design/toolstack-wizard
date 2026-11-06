import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

// Design system tests run in a real browser: layout invariants and every story (with its a11y check).
// One browser object per project: Vitest names its instances in place.
const browser = () => ({ enabled: true, headless: true, provider: playwright(), instances: [{ browser: "chromium" as const }] });
// Stories run at the three widths of the visual tests, one project each: a word breaks on a phone, not on a desktop.
// Storybook sizes each story from its viewport global (1200 px by default, checked): .storybook/vitest.setup.ts sets it per project.
const widths = [390, 768, 1280];

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    projects: [
      { extends: true, test: { name: "ds-unit", include: ["src/ds/**/*.browser.test.ts"], browser: browser() } },
      ...widths.map((width) => ({ extends: true, plugins: [storybookTest({ configDir: ".storybook" })], test: { name: `storybook-${width}`, provide: { width }, setupFiles: [".storybook/vitest.setup.ts"], browser: browser() } })),
    ],
  },
});
