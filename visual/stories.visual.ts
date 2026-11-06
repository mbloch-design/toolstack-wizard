import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "playwright/test";

type Entry = { id: string; type: string; tags?: string[] };

// Every story at 390, 768 and 1280, in French and English, light and dark. A story tagged !visual is skipped.
const index = JSON.parse(readFileSync(join(import.meta.dirname, "../storybook-static/index.json"), "utf8")) as { entries: Record<string, Entry> };
// A story tagged "a-valider" has no reference yet: captured locally for review, compared in CI only once Michael validated it.
const stories = Object.values(index.entries).filter((entry) => entry.type === "story" && !entry.tags?.includes("!visual") && !(process.env.CI && entry.tags?.includes("a-valider")));

for (const story of stories) for (const width of [390, 768, 1280]) for (const lang of ["fr", "en"]) for (const theme of ["light", "dark"]) {
  test(`${story.id} ${width} ${lang} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=lang:${lang};theme:${theme}`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    // Visible logos only: a logo hidden at this width is lazy and never loads.
    await page.waitForFunction(() => [...document.images].filter((img) => img.checkVisibility()).every((img) => img.complete && img.naturalWidth > 0 && !img.hasAttribute("data-loading")));
    // A story that failed (a layout invariant, an a11y error) shows Storybook's error screen: never take that as a reference.
    await expect(page.locator("body")).not.toHaveClass(/sb-show-errordisplay/);
    await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.id}--${width}-${lang}-${theme}.png`);
  });
}
