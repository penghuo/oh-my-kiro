/**
 * Reusable ACP (Agent Communication Protocol) client for kiro-cli.
 *
 * Extracted from the proven spike/acp-spike.mjs. Communicates with kiro-cli
 * via JSON-RPC 2.0 over stdio to orchestrate worker agents.
 *
 * Usage:
 *   import { createAcpClient } from './acp-client.mjs';
 *   const client = createAcpClient({ name: 'reviewer' });
 *   await client.initialize();
 *   const sessionId = await client.newSession({ cwd: process.cwd() });
 *   const text = await client.prompt(sessionId, 'Review this code', { onChunk: t => process.stdout.write(t) });
 *   client.kill();
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Create an ACP client that spawns kiro-cli acp as a child process.
 *
 * @param {object} opts
 * @param {string} opts.name - Display name for logging
 * @param {string} [opts.agentName] - Agent config name to pass via --agent
 * @param {number} [opts.timeoutMs=120000] - Default timeout for RPC calls
 * @param {string} [opts.kiroCli='kiro-cli'] - Path to kiro-cli binary
 * @returns {{ initialize, newSession, prompt, kill, proc }}
 */
export function createAcpClient(opts = {}) {
  const {
    name = 'acp',
    agentName,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    kiroCli = process.env.KIRO_CLI || 'kiro-cli',
  } = opts;

  let requestId = 0;
  const args = ['acp'];
  if (agentName) args.push('--agent', agentName);

  const proc = spawn(kiroCli, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  const rl = createInterface({ input: proc.stdout });
  const pending = new Map(); // id → { resolve, reject }
  const notifications = [];

  rl.on('line', (line) => {
    let msg;
    try { msg = JSON.parse(line); } catch { return; }

    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    } else if (msg.method) {
      notifications.push(msg);
    }
  });

  proc.stderr.on('data', () => {}); // suppress stderr

  function send(method, params) {
    const id = ++requestId;
    const msg = { jsonrpc: '2.0', id, method, params };
    proc.stdin.write(JSON.stringify(msg) + '\n');
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`[${name}] timeout waiting for ${method} (id=${id})`));
        }
      }, timeoutMs);
    });
  }

  /** Extract text from a chunk notification's params. */
  function chunkText(params) {
    const content = params?.update?.content || params?.content;
    if (typeof content === 'object' && content?.text) return content.text;
    if (Array.isArray(content)) return content.filter(c => c.type === 'text').map(c => c.text).join('');
    return '';
  }

  /**
   * Initialize the ACP connection.
   * @returns {Promise<object>} Server capabilities
   */
  async function initialize() {
    const resp = await send('initialize', {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
      clientInfo: { name: `omk-${name}`, version: '0.1.0' },
    });
    if (resp.error) throw new Error(`initialize failed: ${JSON.stringify(resp.error)}`);
    return resp.result;
  }

  /**
   * Create a new session.
   * @param {object} [params]
   * @param {string} [params.cwd] - Working directory for the session
   * @returns {Promise<string>} sessionId
   */
  async function newSession(params = {}) {
    const resp = await send('session/new', {
      cwd: params.cwd || process.cwd(),
      mcpServers: [],
    });
    if (resp.error) throw new Error(`session/new failed: ${JSON.stringify(resp.error)}`);
    const sessionId = resp.result?.sessionId;
    if (!sessionId) throw new Error(`session/new returned no sessionId`);
    return sessionId;
  }

  /**
   * Send a prompt and collect the full response.
   *
   * The RPC call blocks until the turn completes (returns {stopReason:"end_turn"}).
   * Chunks arrive as session/update notifications while the RPC is in flight.
   *
   * @param {string} sessionId
   * @param {string} text - Prompt text
   * @param {object} [opts]
   * @param {function} [opts.onChunk] - Called with each text chunk as it streams
   * @param {number} [opts.timeoutMs] - Override default timeout
   * @returns {Promise<string>} Collected response text
   */
  async function prompt(sessionId, text, opts = {}) {
    const { onChunk, timeoutMs: promptTimeout = timeoutMs } = opts;
    const startIdx = notifications.length;
    let delivered = startIdx; // track which chunks we've delivered via onChunk

    // Stream chunks to onChunk callback while the RPC is in flight
    let poller;
    if (onChunk) {
      poller = setInterval(() => {
        while (delivered < notifications.length) {
          const n = notifications[delivered];
          const ut = n.params?.update?.sessionUpdate;
          if (ut === 'agent_message_chunk') {
            const t = chunkText(n.params);
            if (t) onChunk(t);
          }
          delivered++;
        }
      }, 50);
    }

    // The RPC blocks until the turn ends (stopReason: "end_turn")
    let resp;
    try {
      resp = await send('session/prompt', { sessionId, prompt: [{ type: 'text', text }] });
    } finally {
      if (poller) clearInterval(poller);
    }

    if (resp.error) throw new Error(`prompt failed: ${JSON.stringify(resp.error)}`);

    // Deliver any remaining chunks that arrived after the last poll
    if (onChunk) {
      while (delivered < notifications.length) {
        const n = notifications[delivered];
        if (n.params?.update?.sessionUpdate === 'agent_message_chunk') {
          const t = chunkText(n.params);
          if (t) onChunk(t);
        }
        delivered++;
      }
    }

    // Collect all chunk text
    return notifications.slice(startIdx)
      .filter(n => n.params?.update?.sessionUpdate === 'agent_message_chunk')
      .map(n => chunkText(n.params))
      .join('');
  }

  /**
   * Kill the kiro-cli acp child process.
   */
  function kill() {
    proc.kill('SIGTERM');
  }

  return { initialize, newSession, prompt, kill, proc, name };
}
