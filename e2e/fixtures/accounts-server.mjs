// Playwright-only loopback Auth/API simulation. No application imports this file.
import { createServer } from 'vite';
import { randomUUID } from 'node:crypto';
const port = 8192;
const origin = `http://127.0.0.1:${port}`;
const users = new Map(), tokens = new Map(), stacks = new Map(), faults = [], requests = [];
let oauthDenied = false;
const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));
const normalizeEmail = value => String(value).trim().toLowerCase();
function userFor(email, metadata = {}) {
  email = normalizeEmail(email);
  if (!email.endsWith('@example.invalid')) throw Error('Fixture identities only');
  if (!users.has(email)) users.set(email, { id: randomUUID(), aud: 'authenticated', role: 'authenticated', email,
    email_confirmed_at: now(), confirmed_at: now(), created_at: now(), app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: metadata, identities: [], is_anonymous: false });
  return users.get(email);
}
function session(user) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, session_id: randomUUID(), role: 'authenticated', aud: 'authenticated', exp })}.test-only`;
  tokens.set(access_token, user);
  return { access_token, refresh_token: access_token, token_type: 'bearer', expires_in: 3600, expires_at: exp, user };
}
async function body(req) {
  let raw = ''; for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 1048576) throw Error('Fixture body limit'); }
  return raw ? JSON.parse(raw) : {};
}
function send(res, status, data) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
  res.end(data === undefined ? '' : JSON.stringify(data));
}
const fail = (res, status, code) => send(res, status, { error: { code } });
const getRecord = user => stacks.get(user.id) || null;
const entries = record => record?.state?.selection?.toolEntries || record?.state?.toolEntries
  || (record?.state?.pinnedToolSlugs || []).map(toolSlug => ({ toolSlug, intent: 'stack' }));
function seed(input) {
  const user = userFor(input.email, input.metadata);
  if (input.state) stacks.set(user.id, { state: clone(input.state), revision: input.revision || 1, updatedAt: now() });
  return user;
}
const fixture = { name: 'playwright-account-fixture', configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, origin), path = url.pathname;
    if (!['/__accounts-test/', '/auth/v1/', '/api/', '/rest/v1/', '/functions/v1/'].some(prefix => path.startsWith(prefix))) return next();
    try {
      const input = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await body(req) : {};
      if (path.startsWith('/__accounts-test/')) {
        if (path.endsWith('/reset')) { users.clear(); tokens.clear(); stacks.clear(); faults.length = 0; requests.length = 0; oauthDenied = false; for (const item of input.users || []) seed(item); return send(res, 200, {}); }
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
      if (path === '/auth/v1/otp') { userFor(input.email); return send(res, 200, {}); }
      if (path === '/auth/v1/verify') {
        if (input.token !== '123456' || input.type !== 'email') return send(res, 400, { msg: 'Invalid fixture code', code: 'otp_expired' });
        return send(res, 200, session(userFor(input.email)));
      }
      if (path === '/auth/v1/authorize') {
        const target = new URL(url.searchParams.get('redirect_to') || '/fr/ma-stack', origin);
        if (target.origin !== origin) return fail(res, 400, 'EXTERNAL_FIXTURE_REDIRECT');
        if (oauthDenied) target.searchParams.set('error', 'access_denied');
        else { const value = session(userFor('google@example.invalid')); target.hash = new URLSearchParams({ access_token: value.access_token, refresh_token: value.refresh_token, token_type: 'bearer', expires_in: '3600' }).toString(); }
        res.statusCode = 302; res.setHeader('Location', target.href); return res.end();
      }
      if (path === '/auth/v1/token') {
        if (url.searchParams.get('grant_type') === 'password') {
          if (input.password !== 'fixture-password') return send(res, 400, { msg: 'Invalid fixture password' });
          return send(res, 200, session(userFor(input.email)));
        }
        const previous = tokens.get(input.refresh_token);
        return previous ? send(res, 200, session(previous)) : send(res, 401, { msg: 'Session expired' });
      }
      if (path === '/auth/v1/user') return send(res, user ? 200 : 401, user || { msg: 'Session expired' });
      if (path === '/auth/v1/logout') { tokens.delete(token); return send(res, 204); }
      if (path.startsWith('/rest/v1/')) return send(res, 200, []);
      if (!path.startsWith('/api/stack-account') && !path.startsWith('/api/backoffice-accounts')) return fail(res, 503, 'LEGACY_ENDPOINT_DISABLED_IN_RECIPE');
      if (!user || !users.has(user.email) || !tokens.has(token)) return fail(res, 401, 'ACCOUNT_SESSION_INVALID');
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
          stacks.delete(user.id); users.delete(user.email); for (const [key, value] of tokens) if (value.id === user.id) tokens.delete(key); return send(res, 204);
        }
      }
      if (path === '/api/backoffice-accounts') {
        if (user.email !== 'admin@example.invalid') return fail(res, 403, 'BACKOFFICE_FORBIDDEN');
        if (url.searchParams.get('mode') === 'detail') {
          const found = [...users.values()].find(item => item.id === url.searchParams.get('userId'));
          return send(res, 200, { account: found ? { userId: found.id, email: found.email, displayName: null, createdAt: found.created_at, stack: getRecord(found) } : null });
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
          topTools: [...top.values()], accounts: filtered.slice((page - 1) * pageSize, page * pageSize).map(item => ({ userId: item.id, email: item.email, displayName: null, createdAt: item.created_at, hasStack: stacks.has(item.id), stackUpdatedAt: getRecord(item)?.updatedAt || null })), page, pageSize, total: filtered.length, updatedAt: now() });
      }
      return fail(res, 404, 'UNKNOWN_FIXTURE_ENDPOINT');
    } catch { return fail(res, 400, 'INVALID_FIXTURE_REQUEST'); }
  });
} };
const server = await createServer({ root: process.cwd(),
  define: { 'import.meta.env.VITE_STACK_ACCOUNT_ENABLED': '"true"', 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(origin), 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"playwright-only-publishable-key"' },
  server: { host: '127.0.0.1', port, strictPort: true }, plugins: [fixture] });
await server.listen(); console.log(`Playwright-only accounts fixture: ${origin}`);
