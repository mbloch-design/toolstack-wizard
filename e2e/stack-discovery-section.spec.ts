import { test, expect, control, state, login, saved, snapshot } from './fixtures/accounts';
for(const lang of ['fr','en'] as const) for(const width of [320,1440]) test(`discovery doorway ${lang} ${width}: Firefly opens beyond its suite, renew, discover and add`,async({page,request})=>{
 const fr=lang==='fr';await page.setViewportSize({width,height:1000});
 const value=state(['firefly','notion']);
 await control(request,'seed',{email:'discovery@example.invalid',state:value});
 await page.goto(`/${lang}/ma-stack`);await login(page,lang,'discovery@example.invalid');await saved(page,lang);
 const section=page.locator('[data-section="discovery"]');await expect(section).toBeVisible();await section.evaluate(el=>el.scrollIntoView({block:'center'}));
 const cards=section.locator('[data-discovery-tool]');await expect(cards).toHaveCount(3);
 const firstSlugs=await cards.evaluateAll(items=>items.map(item=>item.getAttribute('data-discovery-tool')));
 expect(firstSlugs.filter(slug=>slug?.startsWith('adobe-')).length).toBeLessThanOrEqual(1);
 expect(firstSlugs.some(slug=>!slug?.startsWith('adobe-'))).toBe(true);
 await expect(section).not.toContainText(fr?'Aucun ne fait doublon':'None overlaps');
 const targets=await section.locator('a,button').evaluateAll(items=>items.map(item=>({class:item.className,height:item.getBoundingClientRect().height})));
 expect(targets.every(item=>item.height>=44),JSON.stringify(targets)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await cards.locator('.tce-card').evaluateAll(items=>items.every(item=>getComputedStyle(item).borderTopWidth==='0px'&&getComputedStyle(item).backgroundColor==='rgba(0, 0, 0, 0)'))).toBe(true);
 expect(await cards.locator('.tc-image').evaluateAll(items=>items.every(item=>Math.abs(item.getBoundingClientRect().width/item.getBoundingClientRect().height-1.6)<.01))).toBe(true);
 if(width===320) expect(await section.locator('ul').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 await section.screenshot({path:test.info().outputPath(`discovery-${lang}-${width}.png`)});
 if(width===320) await section.locator('ul').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
 await section.getByRole('button',{name:fr?'D’autres pistes':'More ideas',exact:true}).click();
 await expect(cards.first().getByRole('link')).toBeFocused();
 expect(await section.locator('ul').evaluate(el=>el.scrollLeft)).toBe(0);
 const secondSlugs=await cards.evaluateAll(items=>items.map(item=>item.getAttribute('data-discovery-tool')));
 expect(secondSlugs.some(slug=>firstSlugs.includes(slug))).toBe(false);
 expect((await snapshot(page)).selection.pinnedToolSlugs).toEqual(['firefly','notion']);
 const selectedCard=cards.first(), slug=await selectedCard.getAttribute('data-discovery-tool');
 await selectedCard.getByRole('link',{name:/^(Voir la fiche de|View) /}).click();
 await expect(page).toHaveURL(new RegExp(`/${lang}/tool/${slug}`));await page.goBack();
 // Route remount starts its curated round again; use its first currently visible pick.
 const addCard=section.locator('[data-discovery-tool]').first(), addedSlug=await addCard.getAttribute('data-discovery-tool');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
 await addCard.hover();await addCard.getByRole('button').click();
 await expect(addCard.getByRole('button')).toBeDisabled();
 await page.clock.runFor(1500);await saved(page,lang);
 await expect(addCard.getByRole('button')).toBeDisabled();await expect(addCard).toHaveAttribute('data-discovery-tool',addedSlug!);
 expect((await snapshot(page)).selection.pinnedToolSlugs).toContain(addedSlug);
 await section.getByRole('link',{name:fr?'Explorer les pistes':'Explore more ideas',exact:true}).click();
 await expect(page.locator('#explorer-title')).toContainText(fr?'votre stack':'your stack');
 await page.getByRole('button',{name:fr?'Retour à Ma stack':'Back to My stack',exact:true}).click();
 await page.reload();await saved(page,lang);expect((await snapshot(page)).selection.pinnedToolSlugs).toContain(addedSlug);
});

test.describe('touch discovery',()=>{
 test.use({hasTouch:true});
 test('keeps media actions visible and at least 44px on a coarse pointer',async({page,request})=>{
  await page.setViewportSize({width:390,height:844});
  await control(request,'seed',{email:'touch-discovery@example.invalid',state:state(['firefly','notion'])});
  await page.goto('/fr/ma-stack');await login(page,'fr','touch-discovery@example.invalid');await saved(page,'fr');
  expect(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)).toBe(true);
  const add=page.locator('[data-section="discovery"] .tce-hover-action').first();await expect(add).toBeVisible();
  const rect=await add.boundingBox();expect(rect!.width).toBeGreaterThanOrEqual(44);expect(rect!.height).toBeGreaterThanOrEqual(44);
 });
});
