// Only fictional records in a disposable tt:recipe:<UUID> namespace. No emails.
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { reserveSubmission, getSubmission, claimMail, finishMail, suspendSubmission, archiveSubmission, scanSubmissions, SUBMISSION_HASH } from '../api/_submission-store.ts';
import { receiptFixture } from '../tests/api/redis-fixture.ts';
import { recipeTarget, assertEmptyRegistry, isolateRecipeCommand } from './submission-recipe-guard.mjs';
const target = recipeTarget(process.env);
const key = `tt:recipe:${randomUUID()}`;
let requests = 0;
const originalFetch = globalThis.fetch;
const direct = async (command) => {
  requests++;
  const response = await originalFetch(target.endpoint, { method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${target.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Recipe transport failed');
  const body = await response.json();
  if (!body || Object.hasOwn(body, 'error') || !Object.hasOwn(body, 'result')) throw new Error('Recipe command failed');
  return body.result;
};
if (target.preactivation) assertEmptyRegistry(await direct(['HLEN', SUBMISSION_HASH]));
process.env.SUBMISSION_REDIS_URL = target.endpoint;
process.env.SUBMISSION_REDIS_TOKEN = target.token;
globalThis.fetch = async (_url, init) => {
  const command = isolateRecipeCommand(JSON.parse(init.body), key);
  // The second key is read only: stop each mutation atomically if activation occurred.
  if (target.preactivation && command[0] === 'EVAL') {
    command[1] = "if redis.call('HLEN',KEYS[2])~=0 then return redis.error_reply('recipe registry not empty') end\n" + command[1];
    command[2] = 2;
    command.splice(4, 0, SUBMISSION_HASH);
  }
  return new Response(JSON.stringify({ result: await direct(command) }));
};
const phases = {};
const phase = async (name, fn) => { const start = requests; await fn(); phases[name] = requests - start; };
try {
  await phase('reservation_concurrency_and_conflicts', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => reserveSubmission(structuredClone(receiptFixture))));
    assert.equal(results.filter(r => r.status === 'created').length, 1);
    assert.equal(results.filter(r => r.status === 'existing').length, 19);
    assert.equal((await reserveSubmission({ ...receiptFixture, submissionId: randomUUID() })).status, 'conflict');
    assert.equal((await reserveSubmission({ ...receiptFixture, fingerprint: 'b'.repeat(64) })).status, 'conflict');
    assert.equal(await direct(['HLEN', key]), 2);
  });
  const record = await getSubmission(receiptFixture.submissionId);
  assert.equal(record.checkoutId, 'ch_local');
  await phase('leases_uncertain_recovery_and_completed_job', async () => {
    const claims = await Promise.all(Array.from({ length: 20 }, (_, i) => claimMail(record.submissionId, 'internal', `recipe-${i}`)));
    const claimed = claims.filter(Boolean); assert.equal(claimed.length, 1);
    const owner = claimed[0].owner;
    assert.equal(await finishMail(record.submissionId, 'internal', 'wrong-owner', { providerId: 'fictional' }), false);
    assert.equal(await finishMail(record.submissionId, 'internal', owner, { uncertain: true }), true);
    const retried = await claimMail(record.submissionId, 'internal', 'retry-owner');
    assert.equal(retried.key, claimed[0].key); assert.equal(retried.firstAttemptAt, claimed[0].firstAttemptAt);
    assert.equal(await finishMail(record.submissionId, 'internal', 'retry-owner', { providerId: 'fictional-no-email' }), true);
    assert.equal(await claimMail(record.submissionId, 'internal', 'another-owner'), null);
  });
  await phase('suspended_receipt_not_released', async () => {
    assert.equal(await suspendSubmission(record.submissionId), true);
    assert.equal(await claimMail(record.submissionId, 'confirmation', 'owner'), null);
    assert.equal((await reserveSubmission({ ...receiptFixture, submissionId: randomUUID() })).status, 'conflict');
  });
  await phase('ambiguous_window', async () => {
    const aged = structuredClone(receiptFixture); aged.submissionId = randomUUID(); aged.checkoutId = 'ch_recipe_aged';
    aged.jobs.internal.firstAttemptAt = Date.now() - 25 * 3600000;
    await reserveSubmission(aged);
    assert.equal(await claimMail(aged.submissionId, 'internal', 'owner'), null);
    assert.equal((await getSubmission(aged.submissionId)).jobs.internal.state, 'reconcile');
  });
  await phase('archive_preserves_consumption', async () => {
    const archived = structuredClone(receiptFixture); archived.submissionId = randomUUID(); archived.checkoutId = 'ch_recipe_archive';
    for (const job of Object.values(archived.jobs)) { job.state = 'sent'; job.sentAt = Date.now() - 91 * 86400000; }
    await reserveSubmission(archived); assert.equal(await archiveSubmission(archived.submissionId), true);
    const saved = await getSubmission(archived.submissionId); assert.equal(saved.archived, true); assert.equal(saved.jobs.internal.payload, undefined);
    assert.equal((await reserveSubmission({ ...archived, submissionId: randomUUID() })).status, 'conflict');
  });
  await phase('maintenance_scan', async () => {
    let cursor = '0'; let iterations = 0; const ids = new Set();
    do { const page = await scanSubmissions(cursor, 1); for (const r of page.records) ids.add(r.submissionId); cursor = page.cursor; assert.ok(++iterations < 100); } while (cursor !== '0');
    assert.equal(ids.size, 3);
  });
  if (target.preactivation) assertEmptyRegistry(await direct(['HLEN', SUBMISSION_HASH]));
  console.log(JSON.stringify({ status: 'PASS', target: target.preactivation ? 'authorized preactivation isolated namespace' : 'dedicated recipe database', namespace: key, phasesRestRequests: phases, restRequestsBeforeCleanup: requests, fixtureRecordBytes: Buffer.byteLength(JSON.stringify(record)), realEmails: 0, realPayments: 0 }));
} finally {
  globalThis.fetch = originalFetch;
  await direct(['DEL', key]);
  assert.equal(await direct(['EXISTS', key]), 0);
  if (target.preactivation) assertEmptyRegistry(await direct(['HLEN', SUBMISSION_HASH]));
  console.log(JSON.stringify({ cleanup: 'PASS', totalRestRequests: requests, productionRegistryUnchanged: target.preactivation ? true : 'not accessed' }));
}
