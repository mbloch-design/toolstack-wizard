import { expect, test } from "@playwright/test";

const draft = { toolName: "Sample", toolUrl: "https://example.com/", email: "ada@example.com", name: "Ada", submitterRole: "founder", message: "A useful tool", badgeUrl: "", verificationToken: "", paymentReference: "7ec2090a-9157-43c9-9238-f8931667420d", checkoutId: "" };

const browserErrors = new WeakMap<object,string[]>();
test.afterEach(async ({page}) => { expect(browserErrors.get(page)).toEqual([]); });
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  // No payment, email, analytics or backend write can leave this browser.
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/")) return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({success:true,verified:true})});
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
    return route.abort();
  });
});

for (const lang of ["fr", "en"] as const) {
  test(`verified return keeps its draft until final send (${lang})`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("tt_submit_draft", JSON.stringify(value)), draft);
    await page.goto(`/${lang}/submit?checkout_id=ch_local123`);
    await expect(page.getByText(lang === "fr" ? "Paiement confirmé : publication prioritaire" : "Payment confirmed: priority publication")).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem("tt_submit_draft"))).not.toBeNull();
    await page.getByRole("button",{name:lang === "fr" ? "Envoyer pour revue →" : "Submit for review →"}).click();
    await expect(page.getByRole("heading",{name:lang === "fr" ? "Ta publication prioritaire est lancée." : "Your priority publication is underway."})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem("tt_submit_draft"))).toBeNull();
    expect(page.url()).not.toContain("checkout_id");
  });
}

test("unavailable verification retains draft through reload and allows retry without payment", async ({ page }) => {
  let available = false;
  await page.route("**/api/verify-payment",route=>route.fulfill({status:available?200:503,contentType:"application/json",body:JSON.stringify(available?{verified:true}:{error:"payment_verification_unavailable"})}));
  await page.addInitScript(value=>{if(!localStorage.getItem("tt_submit_draft"))localStorage.setItem("tt_submit_draft",JSON.stringify(value));},draft);
  await page.goto("/fr/submit?paid=1&checkout_id=ch_local123");
  await expect(page.getByRole("alert")).toContainText("Ne repaie pas");
  expect(await page.evaluate(()=>localStorage.getItem("tt_submit_draft"))).not.toBeNull();
  await page.reload(); await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("[data-creem-checkout]")).toHaveCount(0);
  available = true; await page.getByRole("button",{name:"Réessayer la vérification"}).click();
  await expect(page.getByText("Paiement confirmé : publication prioritaire")).toBeVisible();
});

test("paid hint alone stays in recovery and never confirms payment", async ({ page }) => {
  await page.addInitScript(value=>localStorage.setItem("tt_submit_draft",JSON.stringify(value)),draft);
  await page.goto("/fr/submit?paid=1");
  await expect(page.getByRole("alert")).toContainText("Ne repaie pas");
  await expect(page.getByText("Paiement confirmé : publication prioritaire")).toHaveCount(0);
  await expect(page.locator("[data-creem-checkout]")).toHaveCount(0);
});

test("existing checkout link has bound metadata and a draft before navigation", async ({ page }) => {
  await page.goto("/fr/submit");
  await page.getByRole("button",{name:"Publier ma fiche · 29 $"}).first().click();
  await page.getByLabel("Site officiel").fill("example.com");
  await page.getByLabel("Nom de l'outil").fill("Sample");
  await page.getByLabel("Email",{exact:true}).fill("ada@example.com");
  await page.getByRole("button",{name:"Continuer vers le paiement →"}).click();
  const link=page.locator("[data-creem-checkout]");await expect(link).toBeVisible();
  const url=new URL((await link.getAttribute("href"))!);
  expect(url.origin+url.pathname).toBe("https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX");
  expect(url.searchParams.get("metadata[tooltrim_tool_url]")).toBe("https://example.com/");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("tt_submit_draft")!));
  expect(url.searchParams.get("metadata[tooltrim_submission_id]")).toBe(saved.paymentReference);
  expect(saved.paymentReference).toMatch(/^[a-f0-9-]{36}$/);
});

for(const lang of ['fr','en'] as const){
 test(`storage failure keeps a stable draft through retry (${lang})`,async({page})=>{
  const bodies:Record<string,unknown>[]=[];
  await page.route('**/api/contact',route=>{bodies.push(route.request().postDataJSON());return route.fulfill({status:bodies.length===1?503:200,contentType:'application/json',body:JSON.stringify(bodies.length===1?{error:'submission_store_unavailable'}:{success:true})});});
  await page.addInitScript(value=>localStorage.setItem('tt_submit_draft',JSON.stringify(value)),draft);
  await page.goto(`/${lang}/submit?checkout_id=ch_local123`);
  const send=page.getByRole('button',{name:lang==='fr'?'Envoyer pour revue →':'Submit for review →'});
  await send.click();await expect(page.getByRole('alert')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tt_submit_draft')!));expect(saved.submissionId).toBe(draft.paymentReference);
  await send.click();await expect(page.getByRole('heading',{name:lang==='fr'?'Ta publication prioritaire est lancée.':'Your priority publication is underway.'})).toBeVisible();
  expect(bodies).toHaveLength(2);expect(bodies[0]).toEqual(bodies[1]);expect(await page.evaluate(()=>localStorage.getItem('tt_submit_draft'))).toBeNull();
 });
 test(`payment conflict preserves the draft (${lang})`,async({page})=>{
  await page.route('**/api/contact',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'submission_conflict'})}));
  await page.addInitScript(value=>localStorage.setItem('tt_submit_draft',JSON.stringify(value)),draft);
  await page.goto(`/${lang}/submit?checkout_id=ch_local123`);
  await page.getByRole('button',{name:lang==='fr'?'Envoyer pour revue →':'Submit for review →'}).click();await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('tt_submit_draft'))).not.toBeNull();expect(page.url()).toContain('checkout_id');
 });
 test(`intermediate email outage does not block checkout (${lang})`,async({page})=>{
  await page.route('**/api/submission-progress',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'down'})}));
  await page.goto(`/${lang}/submit`);
  await page.getByRole('button',{name:lang==='fr'?'Publier ma fiche · 29 $':'Publish my listing · $29'}).first().click();
  await page.getByLabel(lang==='fr'?'Site officiel':'Official website').fill('example.com');await page.getByLabel(lang==='fr'?"Nom de l'outil":'Tool name').fill('Sample');await page.getByLabel('Email',{exact:true}).fill('ada@example.com');
  await page.getByRole('button',{name:lang==='fr'?'Continuer vers le paiement →':'Continue to payment →'}).click();await expect(page.locator('[data-creem-checkout]')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tt_submit_draft')!));expect(saved.submissionId).toMatch(/^[a-f0-9-]{36}$/);
 });
}

for(const lang of ['fr','en'] as const){
 test(`accepted paid request survives a lost reply and Creem outage on reload (${lang})`,async({page})=>{
  let accepted=false;let creemCallsAfterAcceptance=0;
  await page.route('**/api/verify-payment',route=>{if(accepted)creemCallsAfterAcceptance++;return route.fulfill({status:accepted?503:200,contentType:'application/json',body:JSON.stringify(accepted?{error:'payment_verification_unavailable'}:{verified:true})});});
  await page.route('**/api/contact',route=>{const body=route.request().postDataJSON();if(body.replayOnly===true)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})});accepted=true;return route.abort('failed');});
  await page.addInitScript(value=>{if(!localStorage.getItem('tt_submit_draft'))localStorage.setItem('tt_submit_draft',JSON.stringify(value));},draft);
  await page.goto(`/${lang}/submit?checkout_id=ch_local123`);await page.getByRole('button',{name:lang==='fr'?'Envoyer pour revue →':'Submit for review →'}).click();await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:lang==='fr'?'Ta publication prioritaire est lancée.':'Your priority publication is underway.'})).toBeVisible();expect(creemCallsAfterAcceptance).toBe(0);
 });
}
test('free badge notification outage and lost accepted reply preserve recovery',async({page})=>{
 let accepted=false;let badgeCallsAfterAcceptance=0;
 await page.route('**/api/submission-progress',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'down'})}));
 await page.route('**/api/verify-badge',route=>{if(accepted)badgeCallsAfterAcceptance++;return route.fulfill({status:accepted?503:200,contentType:'application/json',body:JSON.stringify(accepted?{error:'page_unreachable'}:{token:'recipe-only-badge-proof'})});});
 await page.route('**/api/contact',route=>{const body=route.request().postDataJSON();if(body.replayOnly===true)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true})});accepted=true;return route.abort('failed');});
 await page.goto('/fr/submit');await page.getByRole('button',{name:'Rejoindre la revue standard →'}).click();await page.getByLabel('Site officiel').fill('example.com');await page.getByLabel("Nom de l'outil").fill('Sample');await page.getByLabel('Email',{exact:true}).fill('ada@example.com');await page.getByRole('button',{name:'Continuer vers le badge →'}).click();
 await page.getByLabel("J'ai ajouté le badge sur mon site").check();await page.getByLabel('URL de la page avec le badge').fill('https://example.com/badge');await page.getByRole('button',{name:'Valider et continuer →'}).click();await expect(page.getByText('Badge vérifié : file standard')).toBeVisible();
 await page.getByLabel("Ton lien avec l'outil").selectOption('founder');await page.getByLabel('Ton nom').fill('Ada');await page.getByLabel('Ce que nous devons comprendre').fill('Complete free details');await page.getByRole('button',{name:'Envoyer pour revue →'}).click();await expect(page.getByRole('alert')).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tt_submit_draft')!));expect(saved.message).toBe('Complete free details');
 await page.reload();await expect(page.getByRole('heading',{name:'Ton outil rejoint la file éditoriale.'})).toBeVisible();expect(badgeCallsAfterAcceptance).toBe(0);
});
