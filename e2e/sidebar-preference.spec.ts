import {test,expect} from '@playwright/test';

test('sidebar starts compact and preserves the explicit desktop choice',async({page,context})=>{
 await page.setViewportSize({width:1440,height:1000});
 const origin=new URL(String(test.info().project.use.baseURL)).origin;
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto('/en');
 const toggle=page.locator('.asv2-sidebar-resizer');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.locator('.asv2-nav-item').filter({hasText:'Tools'}).click();
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.reload();await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:1000,height:1000});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.locator('.asv2-nav-item').filter({hasText:'Home'}).click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:1440,height:1000});
 await expect(toggle).toHaveAttribute('aria-expanded','false');
});
