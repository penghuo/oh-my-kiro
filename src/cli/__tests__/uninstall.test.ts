import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runOmk(
  cwd: string,
  argv: string[],
  envOverrides: Record<string, string> = {}
): { status: number | null; stdout: string; stderr: string; error: string } {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(testDir, '..', '..', '..');
  const omkBin = join(repoRoot, 'bin', 'omk.js');
  const resolvedHome = envOverrides.HOME ?? process.env.HOME;
  const result = spawnSync(process.execPath, [omkBin, ...argv], {
    cwd,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...(resolvedHome && !envOverrides.CODEX_HOME ? { CODEX_HOME: join(resolvedHome, '.codex') } : {}),
      ...envOverrides,
    },
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error?.message || '',
  };
}

function shouldSkipForSpawnPermissions(err: string): boolean {
  return typeof err === 'string' && /(EPERM|EACCES)/i.test(err);
}

/** Build a realistic OMK config.toml for testing */
function buildOmkConfig(): string {
  return [
    '# oh-my-kiro top-level settings (must be before any [table])',
    'notify = ["node", "/path/to/notify-hook.js"]',
    'model_reasoning_effort = "high"',
    'developer_instructions = "You have oh-my-kiro installed."',
    '',
    '[features]',
    'multi_agent = true',
    'child_agents_md = true',
    '',
    '# ============================================================',
    '# oh-my-kiro (OMK) Configuration',
    '# Managed by omk setup - manual edits preserved on next setup',
    '# ============================================================',
    '',
    '# OMK State Management MCP Server',
    '[mcp_servers.omk_state]',
    'command = "node"',
    'args = ["/path/to/state-server.js"]',
    'enabled = true',
    'startup_timeout_sec = 5',
    '',
    '# OMK Project Memory MCP Server',
    '[mcp_servers.omk_memory]',
    'command = "node"',
    'args = ["/path/to/memory-server.js"]',
    'enabled = true',
    'startup_timeout_sec = 5',
    '',
    '# OMK Code Intelligence MCP Server',
    '[mcp_servers.omk_code_intel]',
    'command = "node"',
    'args = ["/path/to/code-intel-server.js"]',
    'enabled = true',
    'startup_timeout_sec = 10',
    '',
    '# OMK Trace MCP Server',
    '[mcp_servers.omk_trace]',
    'command = "node"',
    'args = ["/path/to/trace-server.js"]',
    'enabled = true',
    'startup_timeout_sec = 5',
    '',
    '[agents.executor]',
    'description = "Code implementation"',
    'config_file = "/path/to/executor.toml"',
    '',
    '# OMK TUI StatusLine (Codex CLI v0.101.0+)',
    '[tui]',
    'status_line = ["model-with-reasoning", "git-branch"]',
    '',
    '# ============================================================',
    '# End oh-my-kiro',
    '',
  ].join('\n');
}

/** Build a config with OMK entries mixed with user entries */

function buildConfigWithSeededModelContext(): string {
  return [
    '# oh-my-kiro top-level settings (must be before any [table])',
    'notify = ["node", "/path/to/notify-hook.js"]',
    'model_reasoning_effort = "high"',
    'developer_instructions = "You have oh-my-kiro installed."',
    'model = "gpt-5.4"',
    'model_context_window = 1000000',
    'model_auto_compact_token_limit = 900000',
    '',
    '[features]',
    'multi_agent = true',
    'child_agents_md = true',
    '',
    '# ============================================================',
    '# oh-my-kiro (OMK) Configuration',
    '# Managed by omk setup - manual edits preserved on next setup',
    '# ============================================================',
    '',
    '[mcp_servers.omk_state]',
    'command = "node"',
    'args = ["/path/to/state-server.js"]',
    'enabled = true',
    '',
    '# ============================================================',
    '# End oh-my-kiro',
    '',
  ].join('\n');
}

function buildMixedConfig(): string {
  return [
    '# User settings',
    'model = "o4-mini"',
    '',
    '# oh-my-kiro top-level settings (must be before any [table])',
    'notify = ["node", "/path/to/notify-hook.js"]',
    'model_reasoning_effort = "high"',
    'developer_instructions = "You have oh-my-kiro installed."',
    '',
    '[features]',
    'multi_agent = true',
    'child_agents_md = true',
    'web_search = true',
    '',
    '[mcp_servers.user_custom]',
    'command = "custom"',
    'args = ["--flag"]',
    '',
    '# ============================================================',
    '# oh-my-kiro (OMK) Configuration',
    '# Managed by omk setup - manual edits preserved on next setup',
    '# ============================================================',
    '',
    '[mcp_servers.omk_state]',
    'command = "node"',
    'args = ["/path/to/state-server.js"]',
    'enabled = true',
    '',
    '[mcp_servers.omk_memory]',
    'command = "node"',
    'args = ["/path/to/memory-server.js"]',
    'enabled = true',
    '',
    '[mcp_servers.omk_code_intel]',
    'command = "node"',
    'args = ["/path/to/code-intel-server.js"]',
    'enabled = true',
    '',
    '[mcp_servers.omk_trace]',
    'command = "node"',
    'args = ["/path/to/trace-server.js"]',
    'enabled = true',
    '',
    '[agents.executor]',
    'description = "Code implementation"',
    'config_file = "/path/to/executor.toml"',
    '',
    '[tui]',
    'status_line = ["model-with-reasoning"]',
    '',
    '# ============================================================',
    '# End oh-my-kiro',
    '',
  ].join('\n');
}

describe('omk uninstall', () => {
  it('removes OMK block from config.toml with --dry-run', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());

      const res = runOmk(wd, ['uninstall', '--dry-run'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /dry-run mode/);
      assert.match(res.stdout, /OMK configuration block/);
      assert.match(res.stdout, /omk_state/);

      // Config should NOT have been modified
      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      assert.match(config, /oh-my-kiro \(OMK\) Configuration/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('removes OMK block from config.toml', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /Removed OMK configuration block/);

      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      assert.doesNotMatch(config, /oh-my-kiro \(OMK\) Configuration/);
      assert.doesNotMatch(config, /omk_state/);
      assert.doesNotMatch(config, /omk_memory/);
      assert.doesNotMatch(config, /omk_code_intel/);
      assert.doesNotMatch(config, /omk_trace/);
      assert.doesNotMatch(config, /\[agents\.executor\]/);
      assert.doesNotMatch(config, /\[tui\]/);
      assert.doesNotMatch(config, /notify\s*=/);
      assert.doesNotMatch(config, /model_reasoning_effort\s*=/);
      assert.doesNotMatch(config, /developer_instructions\s*=/);
      assert.doesNotMatch(config, /multi_agent\s*=/);
      assert.doesNotMatch(config, /child_agents_md\s*=/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });


  it('preserves user config entries when removing OMK', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildMixedConfig());

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);

      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      // User settings preserved
      assert.match(config, /model = "o4-mini"/);
      assert.match(config, /\[mcp_servers\.user_custom\]/);
      assert.match(config, /web_search = true/);
      // OMK entries removed
      assert.doesNotMatch(config, /omk_state/);
      assert.doesNotMatch(config, /omk_memory/);
      assert.doesNotMatch(config, /notify\s*=.*node/);
      assert.doesNotMatch(config, /multi_agent/);
      assert.doesNotMatch(config, /child_agents_md/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });


  it('preserves seeded model/context keys during uninstall', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildConfigWithSeededModelContext());

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);

      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      assert.match(config, /^model = "gpt-5\.4"$/m);
      assert.match(config, /^model_context_window = 1000000$/m);
      assert.match(config, /^model_auto_compact_token_limit = 900000$/m);
      assert.doesNotMatch(config, /notify\s*=/);
      assert.doesNotMatch(config, /model_reasoning_effort\s*=/);
      assert.doesNotMatch(config, /developer_instructions\s*=/);
      assert.doesNotMatch(config, /oh-my-kiro \(OMK\) Configuration/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('--keep-config skips config.toml cleanup', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());

      const res = runOmk(wd, ['uninstall', '--keep-config'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /--keep-config/);

      // Config should NOT have been modified
      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      assert.match(config, /oh-my-kiro \(OMK\) Configuration/);
      assert.match(config, /omk_state/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('--purge removes .omk/ cache directory', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });
      // Create .omk/ directory with some files
      const omkDir = join(wd, '.omk');
      await mkdir(join(omkDir, 'state'), { recursive: true });
      await writeFile(join(omkDir, 'setup-scope.json'), JSON.stringify({ scope: 'user' }));
      await writeFile(join(omkDir, 'notepad.md'), '# notes');
      await writeFile(join(omkDir, 'state', 'ralph-state.json'), '{}');

      const res = runOmk(wd, ['uninstall', '--keep-config', '--purge'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /\.omk\/ cache directory/);

      assert.equal(existsSync(omkDir), false, '.omk/ directory should be removed');
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('works with project scope', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });

      // Create project-scoped setup
      const omkDir = join(wd, '.omk');
      const codexDir = join(wd, '.codex');
      await mkdir(omkDir, { recursive: true });
      await mkdir(join(codexDir, 'prompts'), { recursive: true });
      await writeFile(join(omkDir, 'setup-scope.json'), JSON.stringify({ scope: 'project' }));
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());
      // Install a prompt
      await writeFile(join(codexDir, 'prompts', 'executor.md'), '# executor');

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /Resolved scope: project/);

      // Project-local config.toml should be cleaned
      const config = await readFile(join(codexDir, 'config.toml'), 'utf-8');
      assert.doesNotMatch(config, /oh-my-kiro \(OMK\) Configuration/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('handles missing config.toml gracefully', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /Nothing to remove/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('shows summary of what was removed', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /Uninstall summary/);
      assert.match(res.stdout, /MCP servers: omk_state, omk_memory, omk_code_intel, omk_trace/);
      assert.match(res.stdout, /Agent entries: 1/);
      assert.match(res.stdout, /TUI status line section/);
      assert.match(res.stdout, /Top-level keys/);
      assert.match(res.stdout, /Feature flags/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('--dry-run --purge does not actually remove .omk/ directory', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });
      const omkDir = join(wd, '.omk');
      await mkdir(join(omkDir, 'state'), { recursive: true });
      await writeFile(join(omkDir, 'setup-scope.json'), JSON.stringify({ scope: 'user' }));
      await writeFile(join(omkDir, 'notepad.md'), '# notes');

      const res = runOmk(wd, ['uninstall', '--keep-config', '--purge', '--dry-run'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);
      assert.match(res.stdout, /dry-run mode/);
      assert.match(res.stdout, /\.omk\/ cache directory/);

      // .omk/ should still exist
      assert.equal(existsSync(omkDir), true, '.omk/ should NOT be removed in dry-run');
      assert.equal(existsSync(join(omkDir, 'notepad.md')), true);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('second uninstall run reports nothing to remove (idempotent)', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      const codexDir = join(home, '.codex');
      await mkdir(codexDir, { recursive: true });
      await writeFile(join(codexDir, 'config.toml'), buildOmkConfig());

      const first = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(first.error)) return;
      assert.equal(first.status, 0, first.stderr || first.stdout);
      assert.match(first.stdout, /Removed OMK configuration block/);

      const second = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(second.error)) return;
      assert.equal(second.status, 0, second.stderr || second.stdout);
      assert.match(second.stdout, /Nothing to remove/);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('does not delete user AGENTS.md that merely mentions oh-my-kiro', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });
      const userAgentsMd = '# My Agents\n\nDo not use oh-my-kiro for this project.\n';
      await writeFile(join(wd, 'AGENTS.md'), userAgentsMd);

      const res = runOmk(wd, ['uninstall'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);

      // User AGENTS.md should be preserved
      assert.equal(existsSync(join(wd, 'AGENTS.md')), true);
      const content = await readFile(join(wd, 'AGENTS.md'), 'utf-8');
      assert.equal(content, userAgentsMd);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });

  it('removes setup-scope.json and hud-config.json without --purge', async () => {
    const wd = await mkdtemp(join(tmpdir(), 'omk-uninstall-'));
    try {
      const home = join(wd, 'home');
      await mkdir(home, { recursive: true });
      const omkDir = join(wd, '.omk');
      await mkdir(omkDir, { recursive: true });
      await writeFile(join(omkDir, 'setup-scope.json'), JSON.stringify({ scope: 'user' }));
      await writeFile(join(omkDir, 'hud-config.json'), JSON.stringify({ preset: 'focused' }));
      await writeFile(join(omkDir, 'notepad.md'), '# keep this');

      const res = runOmk(wd, ['uninstall', '--keep-config'], { HOME: home });
      if (shouldSkipForSpawnPermissions(res.error)) return;
      assert.equal(res.status, 0, res.stderr || res.stdout);

      assert.equal(existsSync(join(omkDir, 'setup-scope.json')), false);
      assert.equal(existsSync(join(omkDir, 'hud-config.json')), false);
      // notepad.md should still exist (not purged)
      assert.equal(existsSync(join(omkDir, 'notepad.md')), true);
    } finally {
      await rm(wd, { recursive: true, force: true });
    }
  });
});

describe('stripOmkFeatureFlags', () => {
  it('removes OMK feature flags and preserves user flags', async () => {
    const { stripOmkFeatureFlags } = await import('../../config/generator.js');

    const config = [
      '[features]',
      'multi_agent = true',
      'child_agents_md = true',
      'web_search = true',
      '',
    ].join('\n');

    const result = stripOmkFeatureFlags(config);
    assert.doesNotMatch(result, /multi_agent/);
    assert.doesNotMatch(result, /child_agents_md/);
    assert.match(result, /web_search = true/);
    assert.match(result, /\[features\]/);
  });

  it('removes [features] section if it becomes empty', async () => {
    const { stripOmkFeatureFlags } = await import('../../config/generator.js');

    const config = [
      '[features]',
      'multi_agent = true',
      'child_agents_md = true',
      '',
    ].join('\n');

    const result = stripOmkFeatureFlags(config);
    assert.doesNotMatch(result, /\[features\]/);
    assert.doesNotMatch(result, /multi_agent/);
  });

  it('handles config without [features] section', async () => {
    const { stripOmkFeatureFlags } = await import('../../config/generator.js');

    const config = 'model = "o4-mini"\n';
    const result = stripOmkFeatureFlags(config);
    assert.equal(result, config);
  });
});
