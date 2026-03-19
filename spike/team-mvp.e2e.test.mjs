#!/usr/bin/env node
/**
 * E2E smoke test for spike/team-mvp.mjs
 *
 * WHY: team-mvp.mjs is the critical path for the entire team review workflow.
 * Unit tests verify pure functions in isolation, but only an E2E test can catch
 * integration failures: ACP spawn issues, agent config I/O, prompt/response
 * streaming, and cleanup. If this test passes, the full pipeline works.
 *
 * What it does:
 *   1. Generates a real git diff from the latest commit as context
 *   2. Runs team-mvp.mjs as a child process (same as kiro-cli would)
 *   3. Verifies stdout contains review output (non-empty, meaningful)
 *   4. Verifies the temp agent config was cleaned up
 *   5. Verifies a log file was created in tmpdir
 *
 * Requirements: kiro-cli >= 1.27, Node.js >= 20
 * Timeout: 3 minutes (ACP + LLM response time)
 *
 * Usage: node spike/team-mvp.e2e.test.mjs
 */

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

// Compute agent config path inline to avoid importing team-mvp.mjs,
// which runs main() unconditionally at module level.
function agentConfigPath(role) {
  return join(homedir(), '.kiro', 'agents', `omk-review-${role}.json`);
}

const TIMEOUT_MS = 180_000;
const ROLE = 'e2etest';
let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (!condition) { failed++; console.error(`  ❌ FAIL: ${msg}`); }
  else { passed++; console.log(`  ✅ ${msg}`); }
}

/** Run team-mvp.mjs as a child process, capture stdout/stderr. */
function runTeamMvp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['spike/team-mvp.mjs', ...args], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`team-mvp.mjs timed out after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);

    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

async function run() {
  console.log('=== team-mvp.mjs E2E Smoke Test ===\n');

  // --- Setup: generate a real diff from the latest commit ---
  console.log('Setup: generating diff from latest commit');
  const contextFile = join(tmpdir(), `omk-e2e-diff-${Date.now()}.txt`);
  try {
    const diff = execSync('git diff HEAD~1 HEAD', { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    if (!diff.trim()) throw new Error('empty diff');
    writeFileSync(contextFile, diff);
    console.log(`  Context file: ${contextFile} (${diff.length} bytes)\n`);
  } catch (err) {
    console.error(`  ⚠ Could not generate diff: ${err.message}`);
    console.error('  Skipping E2E test (need at least 2 commits)');
    process.exit(0);
  }

  // --- Test 1: team-mvp.mjs runs and produces review output ---
  console.log('Test 1: full pipeline produces review output');
  const { code, stdout, stderr } = await runTeamMvp([
    '--role', ROLE,
    '--task', 'Review this diff for any issues. Be brief.',
    '--context-file', contextFile,
  ]);

  assert(code === 0, `exit code = ${code} (expected 0)${code !== 0 ? `, stderr: ${stderr.slice(0, 200)}` : ''}`);
  assert(stdout.length > 0, `stdout is non-empty (${stdout.length} chars)`);
  assert(stdout.length > 20, `stdout has meaningful content (not just whitespace)`);

  // --- Test 2: agent config was cleaned up ---
  console.log('\nTest 2: temp agent config cleaned up');
  const configPath = agentConfigPath(ROLE);
  assert(!existsSync(configPath), `agent config removed: ${configPath}`);

  // --- Test 3: log file was created in tmpdir ---
  console.log('\nTest 3: log file created in tmpdir');
  const logFiles = readdirSync(tmpdir()).filter(f => f.startsWith(`omk-review-${ROLE}-`) && f.endsWith('.log'));
  assert(logFiles.length > 0, `found ${logFiles.length} log file(s) for role "${ROLE}"`);

  // Clean up log files
  for (const f of logFiles) {
    try { unlinkSync(join(tmpdir(), f)); } catch {}
  }

  // Clean up context file
  try { unlinkSync(contextFile); } catch {}

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (stdout.length > 0) {
    console.log(`\n--- Review output preview (first 300 chars) ---`);
    console.log(stdout.slice(0, 300));
    if (stdout.length > 300) console.log('...');
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(`\n❌ E2E test crashed: ${err.message}`);
  // Clean up agent config if it was left behind
  try { unlinkSync(agentConfigPath(ROLE)); } catch {}
  process.exit(1);
});
