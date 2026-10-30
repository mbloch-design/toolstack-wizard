import { expect, test } from "playwright/test";

for (const theme of ["light", "dark"]) {
  test(`filled danger action has readable normal text in ${theme} theme`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/e2e/fixtures/ui-controls.html");
    await page.evaluate((nextTheme) => {
      document.documentElement.className = nextTheme;
    }, theme);
    const button = page.getByRole("button", { name: "Delete draft" });
    await expect(button).toBeVisible();
    const rendered = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
        const linear = rgb.map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return {
        color: style.color,
        background: style.backgroundColor,
        contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      };
    });
    await testInfo.attach(`filled-danger-${theme}`, { body: JSON.stringify(rendered), contentType: "application/json" });
    expect(rendered.contrast, JSON.stringify(rendered)).toBeGreaterThanOrEqual(4.5);
  });
}
