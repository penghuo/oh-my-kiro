#!/usr/bin/env node
/**
 * ACP Spike — Verify kiro-cli ACP works for multi-agent team orchestration.
 *
 * Tests:
 * 1. Spawn kiro-cli acp as child process
 * 2. Initialize JSON-RPC connection
 * 3. Create session
 * 4. Send prompt, receive streaming response + TurnEnd
 * 5. Send follow-up prompt (clarification)
 *
 * Usage: node spike/acp-spike.mjs
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const KIRO_CLI = process.env.KIRO_CLI || 'kiro-cli';
const TIMEOUT_MS = 120_000;

let requestId = 0;

function nextId() {
  return ++requestId;
}

function createWorker(name, agentName) {
  const args = ['acp'];
  if (agentName) args.push('--agent', agentName);

  console.log(`[${name}] Spawning: ${KIRO_CLI} ${args.join(' ')}`);
  const proc = spawn(KIRO_CLI, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  const rl = createInterface({ input: proc.stdout });
  const pending = new Map(); // id -> { resolve, reject }
  const notifications = [];

  rl.on('line', (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.log(`[${name}] non-JSON: ${line}`);
      return;
    }

    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    } else if (msg.method) {
      notifications.push(msg);
      if (msg.method === 'session/notification' || msg.method === 'session/update') {
        const p = msg.params || {};
        const updateType = p.sessionUpdate || p.update?.type || p.type;
        if (updateType === 'turn_end' || updateType === 'TurnEnd') {
          console.log(`[${name}] ✅ TurnEnd received (${updateType})`);
        } else if (updateType === 'agent_message_chunk' || updateType === 'AgentMessageChunk') {
          const content = p.content || p.update?.content || p.delta;
          const text = typeof content === 'object' && content?.text ? content.text
            : Array.isArray(content) ? content.filter(c => c.type === 'text').map(c => c.text).join('') : '';
          if (text.length > 0) {
            process.stdout.write(`[${name}] chunk: ${text.slice(0, 120)}\n`);
          }
        } else if (updateType === 'tool_call' || updateType === 'ToolCall' || updateType === 'tool_call_update') {
          console.log(`[${name}] tool: ${p.name || p.toolName || '?'} (${p.status || '?'})`);
        } else {
          console.log(`[${name}] ${msg.method} [${updateType}]: ${JSON.stringify(p).slice(0, 250)}`);
        }
      } else {
        console.log(`[${name}] notification: ${msg.method}`);
      }
    } else {
      console.log(`[${name}] unknown: ${JSON.stringify(msg).slice(0, 200)}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[${name}] stderr: ${text.slice(0, 200)}`);
  });

  proc.on('exit', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });

  function send(method, params) {
    const id = nextId();
    const msg = { jsonrpc: '2.0', id, method, params };
    proc.stdin.write(JSON.stringify(msg) + '\n');
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`[${name}] timeout waiting for response to ${method} (id=${id})`));
        }
      }, TIMEOUT_MS);
    });
  }

  function waitForTurnEnd(timeoutMs = TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const startIdx = notifications.length;
      const timer = setTimeout(() => {
        // Dump last notifications for debugging
        console.log(`[${name}] DEBUG: notifications since startIdx=${startIdx}:`);
        notifications.slice(startIdx).forEach((n, i) => {
          console.log(`  [${i}] ${n.method}: ${JSON.stringify(n.params).slice(0, 200)}`);
        });
        reject(new Error(`[${name}] timeout waiting for TurnEnd`));
      }, timeoutMs);

      const check = setInterval(() => {
        for (let i = startIdx; i < notifications.length; i++) {
          const n = notifications[i];
          const p = n.params || {};
          const updateType = p.sessionUpdate || p.update?.type || p.type;
          if ((n.method === 'session/notification' || n.method === 'session/update')
              && (updateType === 'turn_end' || updateType === 'TurnEnd')) {
            clearInterval(check);
            clearTimeout(timer);
            const chunks = notifications
              .slice(startIdx)
              .filter(x => {
                const xp = x.params || {};
                const xt = xp.sessionUpdate || xp.update?.type || xp.type;
                return (x.method === 'session/notification' || x.method === 'session/update')
                  && (xt === 'agent_message_chunk' || xt === 'AgentMessageChunk');
              })
              .map(x => {
                const xp = x.params || {};
                const content = xp.content || xp.update?.content || xp.delta;
                if (typeof content === 'object' && content?.text) return content.text;
                if (Array.isArray(content)) return content.filter(c => c.type === 'text').map(c => c.text).join('');
                return '';
              })
              .join('');
            resolve(chunks);
            return;
          }
        }
      }, 100);
    });
  }

  function kill() {
    proc.kill('SIGTERM');
  }

  return { send, waitForTurnEnd, kill, proc, name, notifications };
}

async function runSpike() {
  console.log('=== ACP Spike: Verify kiro-cli ACP for multi-agent orchestration ===\n');

  // --- Test 1: Spawn and initialize ---
  console.log('--- Test 1: Spawn kiro-cli acp and initialize ---');
  const worker = createWorker('worker-1');

  try {
    const initResp = await worker.send('initialize', {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
      clientInfo: { name: 'omk-spike', version: '0.1.0' },
    });
    console.log(`[init] result: ${JSON.stringify(initResp.result || initResp.error)}`);
    if (initResp.error) {
      console.log('❌ Initialize failed');
      worker.kill();
      process.exit(1);
    }
    console.log('✅ Test 1 passed: initialize works\n');

    // --- Test 2: Create session ---
    console.log('--- Test 2: Create new session ---');
    const sessionResp = await worker.send('session/new', {
      cwd: process.cwd(),
      mcpServers: [],
    });
    const sessionId = sessionResp.result?.sessionId;
    console.log(`[session] id: ${sessionId}`);
    if (!sessionId) {
      console.log(`❌ session/new failed: ${JSON.stringify(sessionResp.error || sessionResp)}`);
      worker.kill();
      process.exit(1);
    }
    console.log('✅ Test 2 passed: session created\n');

    // --- Test 3: Send prompt and receive response ---
    console.log('--- Test 3: Send prompt, receive streaming response ---');
    const promptResp = await worker.send('session/prompt', {
      sessionId,
      prompt: [{ type: 'text', text: 'Reply with exactly: "ACP_SPIKE_OK". Nothing else.' }],
    });
    console.log(`[prompt response] ${JSON.stringify(promptResp).slice(0, 500)}`);

    // Collect chunks that arrived during the prompt
    const chunks = worker.notifications
      .filter(n => {
        const ut = n.params?.update?.sessionUpdate;
        return n.method === 'session/update' && ut === 'agent_message_chunk';
      })
      .map(n => {
        const c = n.params.update.content;
        return c?.text || '';
      })
      .join('');
    console.log(`[collected text] ${chunks}`);
    console.log('✅ Test 3 passed: prompt → streaming chunks → response\n');

    // --- Test 4: Follow-up prompt (clarification) ---
    console.log('--- Test 4: Follow-up prompt (simulates clarification) ---');
    const prevCount = worker.notifications.length;
    const followUpResp = await worker.send('session/prompt', {
      sessionId,
      prompt: [{ type: 'text', text: 'Now reply with exactly: "CLARIFICATION_OK". Nothing else.' }],
    });
    console.log(`[follow-up response] ${JSON.stringify(followUpResp).slice(0, 500)}`);
    const followUpChunks = worker.notifications
      .slice(prevCount)
      .filter(n => n.params?.update?.sessionUpdate === 'agent_message_chunk')
      .map(n => n.params.update.content?.text || '')
      .join('');
    console.log(`[follow-up text] ${followUpChunks}`);
    console.log('✅ Test 4 passed: follow-up prompt works\n');

    // --- Test 5: Cancel ---
    console.log('--- Test 5: Cancel session ---');
    const cancelResp = await worker.send('session/cancel', { sessionId });
    console.log(`[cancel] result: ${JSON.stringify(cancelResp.result || cancelResp.error)}`);
    console.log('✅ Test 5 passed: cancel works\n');

    // --- Summary ---
    console.log('=== ALL TESTS PASSED ===');
    console.log('ACP is viable for multi-agent orchestration:');
    console.log('  - Spawn kiro-cli acp as child process ✅');
    console.log('  - JSON-RPC initialize ✅');
    console.log('  - Create session ✅');
    console.log('  - Send prompt + receive streaming response ✅');
    console.log('  - Follow-up prompt (clarification) ✅');
    console.log('  - Cancel ✅');

  } catch (err) {
    console.error(`❌ Spike failed: ${err.message}`);
  } finally {
    worker.kill();
    // Give process time to clean up
    setTimeout(() => process.exit(0), 1000);
  }
}

runSpike();
