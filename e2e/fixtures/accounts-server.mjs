// Playwright-only loopback Auth/API simulation. No application imports this file.
import { createServer } from 'vite';
import { randomUUID } from 'node:crypto';
const port = 8192;
const origin = `http://127.0.0.1:${port}`;
const users = new Map(), tokens = new Map(), stacks = new Map(), faults = [], requests = [];
let oauthDenied = false;
const passwords = new Map(), profiles = new Map(), mail = [];
function mailLink(user, type, redirectTo) {
  const target = new URL(redirectTo || '/en/sign-in/callback', origin);
  if (target.origin !== origin) throw Error('External fixture mail redirect');
  const id = randomUUID(); mail.unshift({ id, email: user.email, type, target: target.href, consumed: false, expired: false });
}
function redirectSession(res, target, value, type) {
  target.hash = new URLSearchParams({ access_token: value.access_token, refresh_token: value.refresh_token,
    token_type: 'bearer', expires_in: '3600', ...(type ? { type } : {}) }).toString();
  res.writeHead(302, { Location: target.href, 'Cache-Control': 'no-store' }); res.end();
}
const authFail = (res, status, code) => send(res, status, { msg: code, code });
const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));
const normalizeEmail = value => String(value).trim().toLowerCase();
function userFor(email, metadata = {}) {
  email = normalizeEmail(email);
  if (!email.endsWith('@example.invalid')) throw Error('Fixture identities only');
  if (!users.has(email)) users.set(email, { id: randomUUID(), aud: 'authenticated', role: 'authenticated', email,
    email_confirmed_at: now(), confirmed_at: now(), created_at: now(), app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: metadata, identities: [{ id: randomUUID(), provider: 'email', identity_data: { email }, created_at: now(), updated_at: now() }], is_anonymous: false });
  return users.get(email);
}
function session(user) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, session_id: randomUUID(), role: 'authenticated', aud: 'authenticated', exp })}.${Buffer.from('test-only').toString('base64url')}`;
  tokens.set(access_token, user);
  return { access_token, refresh_token: access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, user };
}
async function body(req) {
  let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 1048576) throw Error('Fixture body limit'); }
  return raw ? JSON.parse(raw) : {};
}
function send(res, status, data) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('X-Supabase-Api-Version', '2024-01-01'); res.setHeader('Cache-Control', 'no-store');
  res.end(data === undefined ? '' : JSON.stringify(data));
}
const fail = (res, status, code) => send(res, status, { error: { code } });
const getRecord = user => stacks.get(user.id) || null;
const entries = record => record?.state?.selection?.toolEntries || record?.state?.toolEntries
  || (record?.state?.pinnedToolSlugs || []).map(toolSlug => ({ toolSlug, intent: 'stack' }));
function seed(input) {
  const user = userFor(input.email, input.metadata);
  passwords.set(user.id, input.password || 'fixture-password');
  if (input.displayName !== undefined) profiles.set(user.id, input.displayName);
  if (input.confirmed === false) { user.email_confirmed_at = null; user.confirmed_at = null; }
  if (input.state) stacks.set(user.id, { state: clone(input.state), revision: input.revision || 1, updatedAt: now() });
  return user;
}
const fixture = { name: 'playwright-account-fixture', configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, origin), path = url.pathname;
    if (!['/__accounts-test/', '/auth/v1/', '/api/', '/rest/v1/', '/functions/v1/'].some(prefix => path.startsWith(prefix))) return next();
    try {
      const input = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await body(req) : {};
      if (typeof input.email === 'string' && !normalizeEmail(input.email).endsWith('@example.invalid')) return fail(res, 400, 'FIXTURE_IDENTITIES_ONLY');
      if (path.startsWith('/__accounts-test/')) {
        if (path.endsWith('/reset')) { users.clear(); tokens.clear(); stacks.clear(); passwords.clear(); profiles.clear(); mail.length = 0; faults.length = 0; requests.length = 0; oauthDenied = false; for (const item of input.users || []) seed(item); return send(res, 200, {}); }
        if (path.endsWith('/mailbox')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          return res.end('<!doctype html><title>Local test mailbox</title><h1>Local test mailbox</h1>' + mail.map(item => `<p><a href="/__accounts-test/mail/${item.id}">${item.type === 'recovery' ? 'Recover' : 'Confirm'} ${item.email}</a></p>`).join(''));
        }
        if (path.includes('/mail/')) {
          const item = mail.find(item => path.endsWith(item.id));
          if (!item) return fail(res, 404, 'MAIL_NOT_FOUND');
          const target = new URL(item.target), found = users.get(item.email);
          if (item.expired || item.consumed || !found) {
            target.hash = 'error=access_denied&error_code=otp_expired';
            res.writeHead(302, { Location: target.href }); return res.end();
          }
          item.consumed = true; found.email_confirmed_at = now(); found.confirmed_at = now();
          return redirectSession(res, target, session(found), item.type);
        }
        if (path.endsWith('/expire-mail')) { if (mail[0]) mail[0].expired = true; return send(res, 200, {}); }
        if (path.endsWith('/seed')) return send(res, 200, { user: seed(input) });
        if (path.endsWith('/fault')) { faults.push(input); return send(res, 200, {}); }
        if (path.endsWith('/oauth')) { oauthDenied = !!input.denied; return send(res, 200, {}); }
        if (path.endsWith('/revoke')) { const user = users.get(normalizeEmail(input.email)); for (const [key, value] of tokens) if (value.id === user?.id) tokens.delete(key); return send(res, 200, {}); }
        if (path.endsWith('/state')) return send(res, 200, { accounts: [...users.values()].map(user => ({ ...user, stack: getRecord(user) })), requests });
        return fail(res, 404, 'UNKNOWN_TEST_CONTROL');
      }
      const token = String(req.headers.authorization || '').replace(/^Bearer /i, '');
      const user = tokens.get(token);
      requests.push({ method: req.method, path, email: user?.email || input.email || null, input: path.startsWith('/api/') ? input : undefined });
      const faultIndex = faults.findIndex(item => item.path === path && item.method === req.method);
      const fault = faultIndex < 0 ? null : faults.splice(faultIndex, 1)[0];
      if (fault?.delayMs) await new Promise(resolve => setTimeout(resolve, fault.delayMs));
      if (fault?.status && !fault.commitThenFail) return fail(res, fault.status, fault.code || 'STACK_ACCOUNT_UNAVAILABLE');
      if (path === '/auth/v1/signup') {
        const found = userFor(input.email); passwords.set(found.id, input.password);
        found.email_confirmed_at = null; found.confirmed_at = null;
        mailLink(found, 'signup', url.searchParams.get('redirect_to'));
        return send(res, 200, found);
      }
      if (path === '/auth/v1/resend' || path === '/auth/v1/recover') {
        const found = users.get(normalizeEmail(input.email));
        if (found) mailLink(found, path.endsWith('recover') ? 'recovery' : 'signup', url.searchParams.get('redirect_to'));
        return send(res, 200, {});
      }
      if (path === '/auth/v1/authorize') {
        const target = new URL(url.searchParams.get('redirect_to') || '/fr/ma-stack', origin);
        if (target.origin !== origin) return fail(res, 400, 'EXTERNAL_FIXTURE_REDIRECT');
        const provider = url.searchParams.get('provider');
        if (!['google', 'github'].includes(provider)) return fail(res, 400, 'UNKNOWN_PROVIDER');
        if (oauthDenied) { target.searchParams.set('error', 'access_denied'); res.writeHead(302, { Location: target.href }); return res.end(); }
        const found = userFor(`${provider}@example.invalid`);
        found.app_metadata = { provider, providers: [provider] }; found.identities = [{ id: randomUUID(), provider, identity_data: { email: found.email } }];
        return redirectSession(res, target, session(found));
      }
      if (path === '/auth/v1/token') {
        if (url.searchParams.get('grant_type') === 'password') {
          // Legacy recipes seed confirmed fictional accounts via their helper, never production signup.
          const found = users.get(normalizeEmail(input.email));
          if (!found || passwords.get(found.id) !== input.password) return authFail(res, 400, 'invalid_credentials');
          if (!found.email_confirmed_at) return authFail(res, 400, 'email_not_confirmed');
          return send(res, 200, session(found));
        }
        const previous = tokens.get(input.refresh_token);
        return previous ? send(res, 200, session(previous)) : authFail(res, 401, 'refresh_token_not_found');
      }
      if (path === '/auth/v1/user') {
        if (!user) return authFail(res, 401, 'session_not_found');
        if (req.method === 'PUT' && typeof input.password === 'string') passwords.set(user.id, input.password);
        return send(res, 200, user);
      }
      if (path === '/auth/v1/logout') { if (url.searchParams.get('scope') !== 'others') tokens.delete(token); return send(res, 204); }
      if (path.startsWith('/rest/v1/')) return send(res, 200, []);
      if (!path.startsWith('/api/stack-account') && !path.startsWith('/api/backoffice-accounts') && path !== '/api/account-profile') return fail(res, 503, 'LEGACY_ENDPOINT_DISABLED_IN_RECIPE');
      if (!user || !users.has(user.email) || !tokens.has(token)) return fail(res, 401, 'ACCOUNT_SESSION_INVALID');
      if (path === '/api/account-profile') {
        if (user.deleting) return fail(res, 409, 'ACCOUNT_DELETING');
        if (req.method === 'PUT') profiles.set(user.id, input.displayName || null);
        return send(res, 200, { profile: { userId: user.id, displayName: profiles.get(user.id) || null,
          email: user.email, emailConfirmed: !!user.email_confirmed_at, createdAt: user.created_at, updatedAt: now(), canAccessBackoffice: user.email === 'admin@example.invalid' } });
      }
      if (path === '/api/stack-account') {
        if (req.method !== 'DELETE' && user.deleting) return fail(res, 409, 'ACCOUNT_DELETING');
        if (req.method === 'GET') return send(res, 200, { stack: getRecord(user) });
        if (req.method === 'PUT') {
          const previous = getRecord(user);
          if (input.expectedRevision !== (previous?.revision || 0)) return fail(res, 409, 'STACK_REVISION_CONFLICT');
          if (input.state?.version !== 4) return fail(res, 400, 'INVALID_PERSONAL_STACK');
          const record = { state: input.state, revision: (previous?.revision || 0) + 1, updatedAt: now() }; stacks.set(user.id, record);
          return fault?.commitThenFail ? fail(res, 503, 'STACK_ACCOUNT_NETWORK_ERROR') : send(res, 200, { stack: record });
        }
        if (req.method === 'DELETE') {
          stacks.delete(user.id); profiles.delete(user.id); passwords.delete(user.id); users.delete(user.email); for (const [key, value] of tokens) if (value.id === user.id) tokens.delete(key); return send(res, 204);
        }
      }
      if (path === '/api/backoffice-accounts') {
        if (user.email !== 'admin@example.invalid') return fail(res, 403, 'BACKOFFICE_FORBIDDEN');
        if (url.searchParams.get('mode') === 'detail') {
          const found = [...users.values()].find(item => item.id === url.searchParams.get('userId'));
          return send(res, 200, { account: found ? { userId: found.id, email: found.email, displayName: profiles.get(found.id) || null, createdAt: found.created_at, stack: getRecord(found) } : null });
        }
        const all = [...users.values()], search = (url.searchParams.get('search') || '').toLowerCase();
        const filtered = all.filter(item => item.email.includes(search));
        const page = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 25);
        const top = new Map();
        for (const saved of stacks.values()) for (const entry of entries(saved)) {
          const row = top.get(entry.toolSlug) || { toolSlug: entry.toolSlug, usedAccounts: 0, wishlistAccounts: 0 };
          row[entry.intent === 'wishlist' ? 'wishlistAccounts' : 'usedAccounts']++; top.set(entry.toolSlug, row);
        }
        return send(res, 200, { totals: { accounts: all.length, accountsWithStack: stacks.size, nonemptyStacks: [...stacks.values()].filter(saved => entries(saved).length).length },
          topTools: [...top.values()], accounts: filtered.slice((page - 1) * pageSize, page * pageSize).map(item => ({ userId: item.id, email: item.email, displayName: profiles.get(item.id) || null, createdAt: item.created_at, hasStack: stacks.has(item.id), stackUpdatedAt: getRecord(item)?.updatedAt || null })), page, pageSize, total: filtered.length, updatedAt: now() });
      }
      return fail(res, 404, 'UNKNOWN_FIXTURE_ENDPOINT');
    } catch { return fail(res, 400, 'INVALID_FIXTURE_REQUEST'); }
  });
} };
const server = await createServer({ root: process.cwd(), cacheDir: 'node_modules/.vite-accounts-8192',
  define: { 'import.meta.env.VITE_STACK_ACCOUNT_ENABLED': '"true"', 'import.meta.env.VITE_ACCOUNT_GOOGLE_ENABLED': '"true"', 'import.meta.env.VITE_ACCOUNT_GITHUB_ENABLED': '"true"', 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(origin), 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"playwright-only-publishable-key"' },
  server: { host: '127.0.0.1', port, strictPort: true }, plugins: [fixture] });
await server.listen(); console.log(`Playwright-only accounts fixture: ${origin}`);
