import { test, expect } from '@playwright/test';
const key='tooltrim-ma-stack-mvp-v3';
const seeds=['figma','notion','slack'];
test.beforeEach(async({page})=>{
 await page.route('**/*supabase.co/**',route=>route.abort());
 await page.addInitScript(({key,seeds})=>{
  localStorage.setItem('tooltrim-analytics-consent',JSON.stringify({version:1,choice:'refused',decidedAt:Date.now(),expiresAt:Date.now()+3600000}));
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:3,needs:[],pinnedToolSlugs:seeds,toolEntries:seeds.map(toolSlug=>({toolSlug,needIds:[],intent:'stack',addedAt:'2026-10-13T00:00:00Z',assignmentMode:'pending'}))}));
 },{key,seeds});
});
for(const lang of ['fr','en'])for(const width of [390,1440]){
 test(`whole-stack discovery ${lang}/${width}: stable feed, save, explore and return`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.goto(`/${lang}/ma-stack`);
  const entry=page.getByRole('link',{name:lang==='fr'?'Explorer autour de ma stack':'Explore around my stack',exact:true});
  await expect(entry).toBeVisible();await entry.click();
  await expect(page.locator('#explorer-title')).toContainText(lang==='fr'?'votre stack':'your stack');
  await expect(page.locator('[data-tool-slug]').first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
  await page.screenshot({path:`/private/tmp/stack-discovery-feed-${lang}-${width}.png`});
  for(const slug of seeds)await expect(page.locator(`[data-tool-slug="${slug}"]`)).toHaveCount(0);
  const first=page.locator('[data-tool-slug]').first();const slug=await first.getAttribute('data-tool-slug');
  const card=page.locator(`[data-tool-slug="${slug}"]`);
  await card.getByRole('button').click();
  const dialog=page.locator('.stack-save-dialog');await expect(dialog).toBeVisible();
  const choice=dialog.getByRole('checkbox').first();if(await choice.getAttribute('aria-checked')!=='true')await choice.click();
  await dialog.getByRole('button',{name:lang==='fr'?'Terminer':'Done',exact:true}).click();
  await expect(dialog).toHaveCount(0);await expect(card).toBeVisible();await expect(card.getByRole('button')).toBeDisabled();
  await card.locator('.ex-card-identity').click();
  await expect(page).toHaveURL(new RegExp(`/explorer/around/${slug}`));
  await page.goBack();await expect(card).toBeVisible();await expect(card.getByRole('button')).toBeDisabled();
  await page.getByRole('button',{name:lang==='fr'?'Retour à Ma stack':'Back to My stack',exact:true}).click();
  await expect.poll(()=>new URL(page.url()).pathname).toBe(`/${lang}/ma-stack`);
  await expect(page.locator('.ms-tool')).toHaveCount(4);await page.reload();await expect(page.locator('.ms-tool')).toHaveCount(4);
  const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),key);
  expect(state.toolEntries.find((entry:{toolSlug:string})=>entry.toolSlug===slug).needIds.length).toBeGreaterThan(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 });
}
test('direct stack feed keeps a newly saved idea instead of changing its source',async({page})=>{
 await page.goto('/fr/explorer?type=stack&source=ma-stack');
 const card=page.locator('[data-tool-slug]').first();await expect(card).toBeVisible();
 const slug=await card.getAttribute('data-tool-slug');await card.getByRole('button').click();
 const dialog=page.locator('.stack-save-dialog');const choice=dialog.getByRole('checkbox').first();if(await choice.getAttribute('aria-checked')!=='true')await choice.click();
 await dialog.getByRole('button',{name:'Terminer',exact:true}).click();
 await expect(page.locator(`[data-tool-slug="${slug}"]`)).toBeVisible();
});

for (const intent of ['empty','wishlist']) test(`${intent}: no misleading whole-stack entry`, async ({page})=>{
 await page.addInitScript(({key,intent,seeds})=>localStorage.setItem(key,JSON.stringify({version:3,needs:[],pinnedToolSlugs:intent==='empty'?[]:seeds,toolEntries:intent==='empty'?[]:seeds.map(toolSlug=>({toolSlug,needIds:[],intent:'wishlist',addedAt:'2026-10-13T00:00:00Z',assignmentMode:'pending'}))})),{key,intent,seeds});
 await page.goto('/fr/ma-stack');await expect(page.getByRole('link',{name:'Explorer autour de ma stack',exact:true})).toHaveCount(0);
 await page.goto('/fr/explorer?type=stack&source=ma-stack');
 await expect(page.getByRole('heading',{name:'Ajoutez un outil pour explorer',exact:true})).toBeVisible();
 await page.locator('main').getByRole('link',{name:'Ma stack',exact:true}).click();await expect(page).toHaveURL(/\/fr\/ma-stack$/);
});
