import { expect, test as base, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { normalizePersonalStack, type PersonalStackV4 } from '../../src/lib/personalStack';

export const stamp = '2026-10-19T12:00:00.000Z';
export function state(slugs: string[] = ['notion']): PersonalStackV4 {
  return normalizePersonalStack({ version: 4, selection: { version: 3, needs: [], pinnedToolSlugs: slugs,
    toolEntries: slugs.map(toolSlug => ({ toolSlug, needIds: [], intent: 'stack', assignmentMode: 'pending', addedAt: stamp })) },
    billing: { paid: [], reviewed: [], choices: {} }, decisions: {} });
}
export async function control(request: APIRequestContext, path: string, data: object = {}) {
  const response = await request.post(`/__accounts-test/${path}`, { data });
  expect(response.ok()).toBe(true); return response.json();
}
export async function isolate(context: BrowserContext) {
  // Match the exact fixture origin, including port; localhost and other loopback services are blocked too.
  const origin = new URL(process.env.PLAYWRIGHT_BASE_URL!).origin;
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => localStorage.setItem('tooltrim-analytics-consent', JSON.stringify({ version: 1, choice: 'refused', decidedAt: Date.now(), expiresAt: Date.now() + 3600000 })));
}
export async function draft(page: Page, value: PersonalStackV4) {
  await page.addInitScript(value => {
    if (sessionStorage.getItem('accounts-draft-seeded')) return;
    sessionStorage.setItem('accounts-draft-seeded', '1');
    localStorage.setItem('tooltrim-personal-stack-v4:anonymous', JSON.stringify(value));
    localStorage.setItem('tooltrim-personal-stack-v4:anonymous-migrated', '1');
  }, value);
}
export async function login(page: Page, lang: 'fr' | 'en', email: string) {
  await page.getByRole('button', { name: lang === 'fr' ? 'Enregistrer ma stack' : 'Save my stack', exact: true }).click();
  await page.getByLabel(lang === 'fr' ? 'Adresse e-mail' : 'Email address', { exact: true }).fill(email);
  await page.getByRole('button', { name: lang === 'fr' ? 'Recevoir un code' : 'Send me a code', exact: true }).click();
  await page.getByLabel(lang === 'fr' ? 'Code reçu par e-mail' : 'Email code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: lang === 'fr' ? 'Vérifier le code' : 'Verify code', exact: true }).click();
  await expect(page.locator('.ms-account h2')).toHaveText(email);
}
export async function saved(page: Page, lang: 'fr' | 'en' = 'en') {
  await expect(page.locator('.ms-account-summary [role=status]')).toHaveText(lang === 'fr' ? 'Enregistré' : 'Saved');
}
export async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/lib/personalStackStore.ts';
    const store = await import(/* @vite-ignore */ path);
    return store.readPersonalStack();
  });
}
export async function change(page: Page, value: PersonalStackV4) {
  await page.evaluate(async value => {
    const path = '/src/lib/personalStackStore.ts';
    const store = await import(/* @vite-ignore */ path); store.replacePersonalStack(value);
  }, value);
}
export const test = base.extend({
  context: async ({ context }, runFixture) => { await isolate(context); await runFixture(context); },
  page: async ({ page, request }, runFixture) => {
    await control(request, 'reset'); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await runFixture(page); expect(errors).toEqual([]);
  },
});
export { expect };
