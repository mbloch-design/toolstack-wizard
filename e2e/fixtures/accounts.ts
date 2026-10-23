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

}
export async function draft(page: Page, value: PersonalStackV4) {
  await page.addInitScript(value => {
    if (sessionStorage.getItem('accounts-draft-seeded')) return;
    sessionStorage.setItem('accounts-draft-seeded', '1');
    localStorage.setItem('tooltrim-personal-stack-v4:anonymous', JSON.stringify(value));
    localStorage.setItem('tooltrim-personal-stack-v4:anonymous-migrated', '1');
  }, value);
}
export async function dismissConsent(page: Page) {
  const reject = page.getByRole('button', { name: /^(Refuser|Refuse|Reject)$/ });
  if (await reject.isVisible()) await reject.click();
}
export async function login(page: Page, lang: 'fr' | 'en', email: string, password = 'fixture-password', expectedVisibleName = email) {
  const accounts = await control(page.request, 'state');
  if (!accounts.accounts.some((user: { email: string }) => user.email === email)) await control(page.request, 'seed', { email });
  await dismissConsent(page);
  await page.getByRole('button', { name: lang === 'fr' ? 'J’ai déjà un compte' : 'I already have an account', exact: true }).click();
  await page.getByRole('button', { name: lang === 'fr' ? 'Continuer avec l’e-mail' : 'Continue with email', exact: true }).click();
  await page.getByLabel(lang === 'fr' ? 'Adresse e-mail' : 'Email address', { exact: true }).fill(email);
  await page.getByLabel(lang === 'fr' ? 'Mot de passe' : 'Password', { exact: true }).fill(password);
  await page.getByRole('dialog').getByRole('button', { name: lang === 'fr' ? 'Se connecter' : 'Sign in', exact: true }).click();
  await expect(page.locator('.ac-header-trigger')).toHaveAttribute('aria-label', `${lang === 'fr' ? 'Compte : ' : 'Account: '}${expectedVisibleName}`);
}
export async function saved(page: Page, lang: 'fr' | 'en' = 'en') {
  // An empty account has synchronized, but must not claim a saved stack.
  await expect(page.locator('.ms-account [role=status], .ms-empty-autosave, .ms-save-indicator')).toHaveText(lang === 'fr'
    ? /^(Stack enregistrée|Vos ajouts seront enregistrés automatiquement\.)$/
    : /^(Stack saved|Your additions will be saved automatically\.)$/);
}
export async function signOut(page: Page, lang: 'fr' | 'en' = 'en') {
  await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.asv2-content')?.scrollTo(0, 0); });
  await page.locator('.ac-header-trigger').click();
  await page.getByRole('button', { name: lang === 'fr' ? 'Me déconnecter' : 'Sign out', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: lang === 'fr' ? 'Me déconnecter' : 'Sign out', exact: true }).click();
  await expect(page.locator('.ac-header-trigger--account')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
