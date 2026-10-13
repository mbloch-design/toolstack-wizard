import { test, expect } from '@playwright/test';
const key = 'tooltrim-ma-stack-mvp-v3';
for (const lang of ['fr', 'en']) for (const width of [390, 1440]) {
 test(`stack → explore → add → return ${lang}/${width}`, async ({ page }) => {
  await page.setViewportSize({width, height:1000});
  await page.route('**/*supabase.co/**', route => route.abort());
  await page.addInitScript(({key}) => {
   localStorage.setItem('tooltrim-analytics-consent','refused');
   if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify({version:3,needs:[],pinnedToolSlugs:['figma'],toolEntries:[{toolSlug:'figma',needIds:[],intent:'stack',addedAt:'2026-10-13T00:00:00Z',assignmentMode:'pending'}]}));
  },{key});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/${lang}/ma-stack?outil=figma`,{waitUntil:'domcontentloaded'});
  const sheet=page.locator('.ms-tool-sheet');await expect(sheet).toBeVisible();
  const explore=sheet.getByRole('link',{name:lang==='fr'?'Explorer autour de Figma':'Explore around Figma',exact:true});
  await expect(explore).toBeVisible();await explore.click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/explorer/around/figma`));
  const card=page.locator('[data-tool-slug]').filter({has:page.locator('button:not([disabled])')}).first();
  await expect(card).toBeVisible();
  const added=await card.getAttribute('data-tool-slug');expect(added).toBeTruthy();
  await card.getByRole('button').click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:lang==='fr'?'Créer une nouvelle collection':'Create a new collection',exact:true}).click();
  await dialog.getByRole('textbox').fill('Client');
  await dialog.getByRole('button',{name:lang==='fr'?'Créer':'Create',exact:true}).click();
  await dialog.getByRole('button',{name:lang==='fr'?'Terminer':'Done',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(`[data-tool-slug="${added}"]`).getByRole('button')).toBeDisabled();
  await page.getByRole('button',{name:lang==='fr'?'Retour à Ma stack':'Back to My stack',exact:true}).click();
  await expect.poll(()=>new URL(page.url()).pathname).toBe(`/${lang}/ma-stack`);expect(new URL(page.url()).searchParams.get('outil')).toBe('figma');
  await expect(page.locator('.ms-tool-sheet .ms-ts-title')).toHaveText('Figma');
  await page.locator('.ms-tool-sheet').getByRole('link',{name:lang==='fr'?'Explorer autour de Figma':'Explore around Figma',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`/private/tmp/stack-explorer-inspector-${lang}-${width}.png`});
  await page.keyboard.press('Escape');
  await expect(page.locator('.ms-tool-sheet')).toHaveCount(0);
  await expect(page.locator('.ms-tool[data-tool-id="figma"]')).toBeFocused();
  await expect(page.locator('.ms-tool')).toHaveCount(2);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.ms-tool')).toHaveCount(2);
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),key);
  expect(stored.pinnedToolSlugs).toEqual(expect.arrayContaining(['figma',added]));
  const collection=stored.needs.find((need:{id:string;labelFr:string})=>need.labelFr==='Client');expect(collection).toBeTruthy();
  expect(stored.toolEntries.find((entry:{toolSlug:string})=>entry.toolSlug===added).needIds).toContain(collection.id);
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.screenshot({path:`/private/tmp/stack-explorer-journey-${lang}-${width}.png`});
 });
}
