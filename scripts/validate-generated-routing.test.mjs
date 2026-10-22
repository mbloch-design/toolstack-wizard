import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const validator = path.resolve('scripts/validate-generated-routing.mjs');
const directories = [];
const accountPaths = [
  '/fr/connexion', '/fr/inscription', '/fr/connexion/retour', '/fr/compte/reinitialiser', '/fr/compte/parametres',
  '/en/sign-in', '/en/sign-up', '/en/sign-in/callback', '/en/account/reset-password', '/en/account/settings',
];
function validate({ missingAccount = false, wrongAlias = false, missingPublic = false } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'tooltrim-route-validator-')); directories.push(directory);
  mkdirSync(path.join(directory, 'src'), { recursive: true });
  const routes = ['tools', ...accountPaths.map(route => route.slice(4))];
  writeFileSync(path.join(directory, 'src/App.tsx'), routes.map(route => `<Route path="${route}" element={<Page />} />`).join('\n'));
  for (const lang of ['fr', 'en']) {
    mkdirSync(path.join(directory, 'dist', lang, 'tools'), { recursive: true });
    if (!(missingPublic && lang === 'en')) writeFileSync(path.join(directory, 'dist', lang, 'tools/index.html'), '<h1>Tools</h1>');
  }
  // The missing public document is deliberately outside the sitemap: App-route validation must still catch it.
  writeFileSync(path.join(directory, 'dist/sitemap.xml'), '<urlset><url><loc>https://tooltrim.com/fr/tools</loc></url></urlset>');
  for (const file of ['404.html', 'client-only.html']) writeFileSync(path.join(directory, 'dist', file), '<meta name="robots" content="noindex, nofollow">');
  const rewrites = accountPaths.filter(route => !(missingAccount && route === '/en/account/settings')).map(source => ({ source, destination: '/client-only.html' }));
  if (wrongAlias) rewrites.push({ source: '/fr/account/settings', destination: '/client-only.html' });
  writeFileSync(path.join(directory, 'vercel.json'), JSON.stringify({ redirects: [], rewrites }));
  const reportPath = path.join(directory, 'report.json');
  const process = spawnSync(globalThis.process.execPath, [validator], { cwd: directory, env: { ...globalThis.process.env, R11_ROUTE_REPORT: reportPath }, encoding: 'utf8' });
  return { ...process, report: JSON.parse(readFileSync(reportPath, 'utf8')) };
}
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

it('accepts exact localized account paths while verifying all ten wrong-language aliases as direct 404s', () => {
  const result = validate();
  expect(result.status, result.stderr).toBe(0); expect(result.report.failures).toEqual([]);
  expect(result.report.results).toHaveLength(22);
  const actual = pathname => result.report.results.find(result => result.route === pathname)?.chain[0].status;
  for (const pathname of accountPaths) expect(actual(pathname), pathname).toBe(200);
  for (const pathname of ['/fr/sign-in', '/fr/sign-up', '/fr/sign-in/callback', '/fr/account/reset-password', '/fr/account/settings', '/en/connexion', '/en/inscription', '/en/connexion/retour', '/en/compte/reinitialiser', '/en/compte/parametres']) expect(actual(pathname), pathname).toBe(404);
  expect(actual('/fr/tools')).toBe(200); expect(actual('/en/tools')).toBe(200);
});
it.each([
  [{ missingAccount: true }, '/en/account/settings'],
  [{ wrongAlias: true }, '/fr/account/settings'],
  [{ missingPublic: true }, '/en/tools'],
])('rejects a broken localized contract without hiding other App routes: %j', (options, failedRoute) => {
  const result = validate(options);
  expect(result.status).toBe(1); expect(result.report.failures).toHaveLength(1);
  expect(result.report.failures[0]).toMatch(new RegExp(`^${failedRoute}:`));
});
