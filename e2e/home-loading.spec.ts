import { expect, test } from '@playwright/test';

// Run against generated HTML (PLAYWRIGHT_BASE_URL), never the Vite dev shell.
// Holding only the deferred bundle exposes the former generic-to-editorial flash.
for (const lang of ['fr', 'en']) {
  for (const width of [1440, 390]) {
    test(`${lang} ${width}px: homepage uses its final typography from first paint`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 });
      await page.route('**/assets/index-*.css', async route => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        await route.continue();
      });
      await page.addInitScript(() => {
        const samples: string[] = [];
        Object.assign(window, { __homeTypeSamples: samples });
        const sample = () => {
          const title = document.querySelector('.hv2-title');
          if (title) {
            const style = getComputedStyle(title);
            const chrome = ['.asv2-topbar', '.asv2-nav-label'].map(selector => {
              const element = document.querySelector(selector);
              if (!element) return '';
              const css = getComputedStyle(element);
              return [css.fontFamily, css.fontSize, css.fontWeight, css.lineHeight].join('|');
            });
            const value = [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing, ...chrome].join('|');
            if (samples[samples.length - 1] !== value) samples.push(value);
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await page.goto(`/${lang}`, { waitUntil: 'load' });
      await expect(page.locator('.hv2-title')).toBeVisible();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const samples = await page.evaluate(() => (window as Window & { __homeTypeSamples: string[] }).__homeTypeSamples);
      expect(samples.length, `Typography changed during loading: ${samples.join(' -> ')}`).toBe(1);
      expect(samples[0]).toContain('Uncut Sans');
    });
  }
}
