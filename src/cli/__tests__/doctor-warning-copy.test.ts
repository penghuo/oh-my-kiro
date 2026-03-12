import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runOmk(
  cwd: string,
  argv: string[],
  envOverrides: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string; error?: string } {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(testDir, '..', '..', '..');
  const omkBin = join(repoRoot, 'bin', 'omk.js');
  const r = spawnSync(process.execPath, [omkBin, ...argv], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, ...envOverrides },
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error?.message };
}

function shouldSkipForSpawnPermissions(err?: string): boolean {
  return typeof err === 'string' && /(EPERM|EACCES)/i.test(err);
}

describe('omk doctor onboarding warning copy', () => {
  it('explains first-setup expectation for config and MCP onboarding warnings', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-doctor-copy-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(
        join(codexDir, 'config.toml'),
        `
[mcp_servers.non_omk]
command = "node"
`.trimStart(),
      );

      const res = runOmk(wd, ['doctor'], {
        HOME: home,
        CODEX_HOME: join(home, '.codex'),
      });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(
        res.stdout,
        /Config: config\.toml exists but no OMK entries yet \(expected before first setup; run "omk setup --force" once\)/,
      );
      assert.match(
        res.stdout,
        /MCP Servers: 1 servers but no OMK servers yet \(expected before first setup; run "omk setup --force" once\)/,
      );
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});
