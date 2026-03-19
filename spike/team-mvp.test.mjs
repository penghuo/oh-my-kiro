#!/usr/bin/env node
/**
 * Tests for spike/team-mvp.mjs
 *
 * WHY: team-mvp.mjs is the orchestrator that ties together ACP, tmux, and
 * agent config generation. If arg parsing or config generation breaks, the
 * entire team review workflow fails silently or produces wrong agent configs.
 * These tests verify the pure logic without requiring kiro-cli or tmux.
 *
 * Usage: node spike/team-mvp.test.mjs
 */

import { parseCliArgs, buildWorkerAgentConfig, agentConfigPath } from './team-mvp.mjs';
import { homedir } from 'os';
import { join } from 'path';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (!condition) {
    failed++;
    console.error(`  ❌ FAIL: ${msg}`);
  } else {
    passed++;
    console.log(`  ✅ ${msg}`);
  }
}

function assertThrows(fn, expectedMsg, label) {
  try {
    fn();
    failed++;
    console.error(`  ❌ FAIL: ${label} — did not throw`);
  } catch (err) {
    if (expectedMsg && !err.message.includes(expectedMsg)) {
      failed++;
      console.error(`  ❌ FAIL: ${label} — threw "${err.message}" but expected "${expectedMsg}"`);
    } else {
      passed++;
      console.log(`  ✅ ${label}`);
    }
  }
}

console.log('=== team-mvp.mjs Unit Tests ===\n');

// --- Test 1: parseCliArgs with valid args ---
console.log('Test 1: parseCliArgs parses valid arguments');
{
  const args = parseCliArgs(['--role', 'security', '--task', 'Find vulns', '--context-file', '/tmp/diff.txt']);
  assert(args.role === 'security', `role = "${args.role}"`);
  assert(args.task === 'Find vulns', `task = "${args.task}"`);
  assert(args.contextFile === '/tmp/diff.txt', `contextFile = "${args.contextFile}"`);
}

// --- Test 2: parseCliArgs rejects missing --role ---
console.log('\nTest 2: parseCliArgs rejects missing required args');
assertThrows(() => parseCliArgs(['--task', 'x', '--context-file', '/tmp/x']), '--role is required', 'missing --role throws');
assertThrows(() => parseCliArgs(['--role', 'x', '--context-file', '/tmp/x']), '--task is required', 'missing --task throws');
assertThrows(() => parseCliArgs(['--role', 'x', '--task', 'x']), '--context-file is required', 'missing --context-file throws');

// --- Test 3: buildWorkerAgentConfig produces correct structure ---
console.log('\nTest 3: buildWorkerAgentConfig produces correct agent config');
{
  const config = buildWorkerAgentConfig('performance');
  assert(config.name === 'omk-review-performance', `name = "${config.name}"`);
  assert(config.description.includes('performance'), `description mentions role`);
  assert(config.prompt.includes('performance'), `prompt mentions role`);
  assert(Array.isArray(config.tools) && config.tools.includes('read'), 'tools includes read');
  assert(Array.isArray(config.allowedTools) && config.allowedTools.includes('shell'), 'allowedTools includes shell');
  assert(config.model === null, 'model is null');
}

// --- Test 4: agentConfigPath points to ~/.kiro/agents/ ---
console.log('\nTest 4: agentConfigPath returns correct path');
{
  const p = agentConfigPath('security');
  const expected = join(homedir(), '.kiro', 'agents', 'omk-review-security.json');
  assert(p === expected, `path = "${p}"`);
}

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
