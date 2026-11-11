import {test,expect} from '@playwright/test';

test('sidebar defaults expanded and preserves explicit desktop choices across navigation and responsive rail',async({page,context})=>{
 await page.setViewportSize({width:1440,height:1000});
 const origin=new URL(String(test.info().project.use.baseURL)).origin;
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto('/en');
 const toggle=page.locator('[data-shell-sidebar] button[aria-expanded]');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.locator('[data-shell-sidebar] nav a').filter({hasText:'Tools'}).click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:1000,height:1000});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.locator('[data-shell-sidebar] nav a').filter({hasText:'Home'}).click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:1440,height:1000});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
});

for (const lang of ['fr', 'en']) for (const width of [390, 1440]) {
 test(`homepage ${lang} ${width}: one header search opens the shared dialog`, async ({page, context}) => {
  await page.setViewportSize({width,height:900});
  const origin=new URL(String(test.info().project.use.baseURL)).origin;
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(`/${lang}`);
  const triggers=page.locator('[data-shell-topbar] button[aria-keyshortcuts]:visible');
  await expect(triggers).toHaveCount(1);
  // Ma stack: the bar's pill on a computer, the tab bar on a phone.
  await expect(page.locator('[data-shell-topbar] [data-stack-target]:visible, [data-shell-tabbar] [data-stack-target]:visible')).toHaveCount(1);
  await triggers.click();
  await expect(page.getByRole('dialog',{name:lang==='fr'?'Recherche globale':'Global search',exact:true})).toBeVisible();
 });
}
