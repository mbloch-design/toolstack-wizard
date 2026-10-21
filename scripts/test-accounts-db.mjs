import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

// An ephemeral PostgreSQL engine, never connected to Supabase or any remote DB.
// Auth is a local fixture: this does not test GoTrue, OAuth, email, JWTs or PostgREST.
const db = new PGlite();
try {
  await db.exec(await readFile(new URL('../supabase/tests/accounts-auth.fixture.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20260825124355_ma_stack_account_sync.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/tests/accounts-contributions.fixture.sql', import.meta.url), 'utf8'));
  // Seed a genuine pre-migration v3 snapshot to detect destructive migration/rollback.
  await db.exec(`insert into auth.users(id) values ('00000000-0000-0000-0000-000000000009');
    insert into public.stack_snapshots(owner_id,state) values
      ('00000000-0000-0000-0000-000000000009','{"version":3,"pinnedToolSlugs":["historical-only"]}');`);
  if (!process.argv.includes('--baseline')) {
    const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(file => file.endsWith('_personal_stack_v4.sql')).sort();
    if (files.length !== 1) throw new Error(`Expected one personal_stack_v4 migration; found ${files.length}`);
    await db.exec(await readFile(new URL(`../supabase/migrations/${files[0]}`, import.meta.url), 'utf8'));
    const deletionFiles = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(file => file.endsWith('_personal_account_deletion.sql')).sort();
    for (const file of deletionFiles) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  if (!process.argv.includes('--baseline')) {
    await db.exec(await readFile(new URL('../supabase/migrations/20261021073601_account_profile_settings.sql', import.meta.url), 'utf8'));
  }
  await db.exec(await readFile(new URL('../supabase/tests/account_profile_settings.test.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/tests/personal_stack_v4.test.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/tests/personal_account_deletion.test.sql', import.meta.url), 'utf8'));
  assert.deepEqual((await db.query(`select state from public.stack_snapshots
    where owner_id='00000000-0000-0000-0000-000000000009'`)).rows[0].state,
    { version: 3, pinnedToolSlugs: ['historical-only'] });
  await db.exec(`insert into public.profiles(id,account_status,display_name) values
    ('00000000-0000-0000-0000-000000000009','deleting','Preserved name');
    insert into auth.users(id) values ('00000000-0000-0000-0000-000000000008');
    insert into public.stack_snapshots(owner_id,state,state_version,revision) values
    ('00000000-0000-0000-0000-000000000008','{"version":4,"selection":{"version":3,"needs":[],"toolEntries":[],"pinnedToolSlugs":[]},"billing":{"paid":[],"reviewed":[],"choices":{}},"decisions":{}}',4,7);`);
  const beforeProfileRollback = (await db.query('select * from public.profiles order by id')).rows;
  const beforeAuthRollback = (await db.query('select * from auth.users order by id')).rows;
  const beforeStackRollback = (await db.query('select * from public.stack_snapshots order by owner_id')).rows;
  await db.exec(await readFile(new URL('../supabase/rollback/20261021073601_account_profile_settings.sql', import.meta.url), 'utf8'));
  assert.deepEqual((await db.query('select * from public.profiles order by id')).rows, beforeProfileRollback);
  assert.deepEqual((await db.query('select * from auth.users order by id')).rows, beforeAuthRollback);
  assert.deepEqual((await db.query('select * from public.stack_snapshots order by owner_id')).rows, beforeStackRollback);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    for (const signature of ['public.read_personal_profile(uuid,uuid)', 'public.update_personal_profile(uuid,uuid,text)']) {
      assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, signature])).rows[0].allowed, false);
    }
  }
  await db.exec(await readFile(new URL('../supabase/rollback/20261019081436_personal_stack_v4.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/rollback/20261020064858_personal_account_deletion.sql', import.meta.url), 'utf8'));
  assert.deepEqual((await db.query(`select state_version,revision from public.stack_snapshots order by state_version`)).rows,
    [{ state_version: 3, revision: 1 }, { state_version: 4, revision: 7 }]);
  assert.equal((await db.query(`select account_status from public.profiles`)).rows[0].account_status, 'deleting');
  assert.equal((await db.query(`select has_function_privilege('service_role',
    'public.save_personal_stack(uuid,uuid,bigint,jsonb)','EXECUTE') as allowed`)).rows[0].allowed, false);
  assert.equal((await db.query(`select has_function_privilege('service_role',
    'public.personal_account_has_contributions(uuid,uuid)','EXECUTE') as allowed`)).rows[0].allowed, false);
  console.log('PASS personal stack, deletion and profile SQL assertions + rollback preserves profiles/Auth/v3/v4 snapshots (ephemeral PostgreSQL)');
  console.log('Not validated: actual Supabase Auth/provider flows or multiple concurrent DB connections.');
} catch (error) {
  console.error(`FAIL ${error.code ?? ''}: ${error.message}`);
  if (error.where) console.error(error.where);
  process.exitCode = 1;
} finally {
  await db.close();
}
