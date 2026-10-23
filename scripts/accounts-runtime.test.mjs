import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

test('account functions load as emitted Node ESM without a bundler resolver', async () => {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const directory = await mkdtemp(join(tmpdir(), 'tooltrim-account-runtime-'));
  try {
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir');
    const entries = ['stack-account', 'account-profile', 'backoffice-accounts'];
    const program = ts.createProgram(entries.map(name => join(root, 'api', name + '.ts')), {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      strict: true,
      esModuleInterop: true,
      rootDir: root,
      outDir: directory,
      noEmitOnError: true,
    });
    const emitted = program.emit();
    assert.equal(emitted.emitSkipped, false, ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
      getCanonicalFileName: name => name, getCurrentDirectory: () => root, getNewLine: () => '\n',
    }));
    for (const name of entries) {
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(join(directory, 'api', name + '.js'))})`], { encoding: 'utf8' });
      assert.equal(result.status, 0, `${name} failed to load in native Node ESM:\n${result.stderr}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
