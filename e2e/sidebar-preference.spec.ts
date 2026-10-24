import {test,expect} from '@playwright/test';

test('sidebar defaults expanded and preserves explicit desktop choices across navigation and responsive rail',async({page,context})=>{
 await page.setViewportSize({width:1440,height:1000});
 const origin=new URL(String(test.info().project.use.baseURL)).origin;
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto('/en');
 const toggle=page.locator('.asv2-sidebar-resizer');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.locator('.asv2-nav-item').filter({hasText:'Tools'}).click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:1000,height:1000});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.locator('.asv2-nav-item').filter({hasText:'Home'}).click();
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
  const triggers=page.locator('.asv2-topbar .asv2-search:visible, .asv2-topbar .asv2-topbar-search:visible');
  await expect(triggers).toHaveCount(1);
  await expect(page.locator('.asv2-topbar-cta')).toBeVisible();
  await triggers.click();
  await expect(page.getByRole('dialog',{name:lang==='fr'?'Recherche globale':'Global search',exact:true})).toBeVisible();
 });
}
