import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runOmk(cwd: string, argv: string[]) {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(testDir, '..', '..', '..');
  const omkBin = join(repoRoot, 'bin', 'omk.js');
  return spawnSync(process.execPath, [omkBin, ...argv], {
    cwd,
    encoding: 'utf-8',
    env: process.env,
  });
}

describe('omk session help', () => {
  it('documents the session search command in help output', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'omk-session-help-'));
    try {
      const mainHelp = runOmk(cwd, ['--help']);
      assert.equal(mainHelp.status, 0, mainHelp.stderr || mainHelp.stdout);
      assert.match(mainHelp.stdout, /omk resume\s+Resume a previous interactive Codex session/i);
      assert.match(mainHelp.stdout, /omk session\s+Search prior local session transcripts/i);

      const sessionHelp = runOmk(cwd, ['session', '--help']);
      assert.equal(sessionHelp.status, 0, sessionHelp.stderr || sessionHelp.stdout);
      assert.match(sessionHelp.stdout, /omk session search <query>/i);
      assert.match(sessionHelp.stdout, /--since <spec>/i);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
