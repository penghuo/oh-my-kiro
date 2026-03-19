#!/usr/bin/env node
/**
 * Integration test for spike/lib/acp-client.mjs
 *
 * WHY: The ACP client is the foundation of the team MVP — every worker agent
 * depends on it to communicate with kiro-cli. This test verifies the full
 * lifecycle (spawn → initialize → session → prompt → kill) works against
 * a real kiro-cli acp process, catching protocol regressions early.
 *
 * Usage: node spike/lib/acp-client.test.mjs
 */

import { createAcpClient } from './acp-client.mjs';

const TIMEOUT = 90_000;
let client;
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

async function run() {
  console.log('=== ACP Client Library Tests ===\n');

  // --- Test 1: createAcpClient returns expected API ---
  console.log('Test 1: createAcpClient returns expected API');
  client = createAcpClient({ name: 'test', timeoutMs: TIMEOUT });
  assert(typeof client.initialize === 'function', 'initialize is a function');
  assert(typeof client.newSession === 'function', 'newSession is a function');
  assert(typeof client.prompt === 'function', 'prompt is a function');
  assert(typeof client.kill === 'function', 'kill is a function');
  assert(client.proc !== undefined, 'proc is exposed');
  assert(client.name === 'test', 'name is set correctly');

  // --- Test 2: initialize succeeds ---
  console.log('\nTest 2: initialize returns capabilities');
  const caps = await client.initialize();
  assert(caps !== undefined, 'initialize returned a result');

  // --- Test 3: newSession returns a sessionId ---
  console.log('\nTest 3: newSession returns sessionId');
  const sessionId = await client.newSession({ cwd: process.cwd() });
  assert(typeof sessionId === 'string' && sessionId.length > 0, `sessionId: ${sessionId}`);

  // --- Test 4: prompt returns text and onChunk fires ---
  console.log('\nTest 4: prompt returns text, onChunk streams');
  let chunkCount = 0;
  const result = await client.prompt(sessionId, 'Reply with exactly: "ACP_TEST_OK". Nothing else.', {
    onChunk: () => { chunkCount++; },
    timeoutMs: TIMEOUT,
  });
  assert(typeof result === 'string', `prompt returned string (${result.length} chars)`);
  assert(result.includes('ACP_TEST_OK'), `response contains ACP_TEST_OK`);
  assert(chunkCount > 0, `onChunk fired ${chunkCount} times`);

  // --- Test 5: kill terminates process ---
  console.log('\nTest 5: kill terminates process');
  client.kill();
  await new Promise(r => setTimeout(r, 1000));
  assert(client.proc.killed || client.proc.exitCode !== null, 'process terminated');

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(`\n❌ Test crashed: ${err.message}`);
  if (client) client.kill();
  process.exit(1);
});
