import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('unchanged Git source skips normally but an explicit configuration rebuild proceeds', () => {
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });
  assert.equal(head.status, 0);
  for (const [force, expected] of [['', 0], ['1', 1]]) {
    const result = spawnSync('bash', ['scripts/vercel-ignore-build.sh'], {
      cwd, encoding: 'utf8', env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: head.stdout.trim(), TOOLTRIM_FORCE_BUILD: force },
    });
    assert.equal(result.status, expected, result.stdout + result.stderr);
  }
});
