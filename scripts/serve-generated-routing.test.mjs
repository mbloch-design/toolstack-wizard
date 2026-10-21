import { afterAll, beforeAll, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
let server, directory;
const base = 'http://127.0.0.1:8194';
beforeAll(async () => {
 directory = await mkdtemp(path.join(tmpdir(), 'tooltrim-routing-'));
 await mkdir(path.join(directory, 'dist'));
 await writeFile(path.join(directory, 'dist/client-only.html'), '<h1>private shell</h1>');
 await writeFile(path.join(directory, 'dist/404.html'), '<h1>unknown</h1>');
 await writeFile(path.join(directory, 'vercel.json'), JSON.stringify({ redirects: [], rewrites: [{ source: '/en/account/settings', destination: '/client-only.html' }], headers: [
  { source: '/en/account/settings', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'public, max-age=3600' }] },
  { source: '/:lang(fr|en)/tool/:slug', headers: [{ key: 'Link', value: '<https://tooltrim.com/:lang/tool/:slug>; rel="canonical"' }] }
 ] }));
 server = spawn(process.execPath, [path.resolve('scripts/serve-generated-routing.mjs')], { cwd: directory, env: { ...process.env, PORT: '8194' }, stdio: ['ignore', 'pipe', 'pipe'] });
 await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(Error(`server exit ${code}`))); });
});
afterAll(async () => { server?.kill(); if (directory) await rm(directory, { recursive: true, force: true }); });
it('applies matched configured response headers while keeping local responses no-store', async () => {
 const response = await fetch(`${base}/en/account/settings`);
 expect(response.status).toBe(200); expect(await response.text()).toContain('private shell');
 expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
 expect(response.headers.get('cache-control')).toBe('no-store');
 const unknown = await fetch(`${base}/en/account/unknown`); expect(unknown.status).toBe(404); expect(unknown.headers.get('x-robots-tag')).toBeNull();
 const tool = await fetch(`${base}/fr/tool/notion`); expect(tool.headers.get('link')).toBe('<https://tooltrim.com/fr/tool/notion>; rel="canonical"');
});
