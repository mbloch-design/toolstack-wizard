import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "playwright/test";

type Entry = { id: string; type: string; tags?: string[] };

// Every story at 390, 768 and 1280, in French and English, light and dark. A story tagged !visual is skipped, so is the foundation's smoke story.
const index = JSON.parse(readFileSync(join(import.meta.dirname, "../storybook-static/index.json"), "utf8")) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter((entry) => entry.type === "story" && !entry.tags?.includes("!visual") && !entry.id.startsWith("socle-"));

for (const story of stories) for (const width of [390, 768, 1280]) for (const lang of ["fr", "en"]) for (const theme of ["light", "dark"]) {
  test(`${story.id} ${width} ${lang} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=lang:${lang};theme:${theme}`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.id}--${width}-${lang}-${theme}.png`);
  });
}
