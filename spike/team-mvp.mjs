#!/usr/bin/env node
/**
 * Team MVP — Orchestrator script that spawns a code review worker via ACP.
 *
 * Flow:
 *   1. Parse CLI args (--role, --task, --context-file)
 *   2. Write a temporary worker agent config to ~/.kiro/agents/
 *   3. Open a tmux pane tailing a log file for live progress
 *   4. Spawn kiro-cli acp, initialize, create session, send prompt
 *   5. Stream response chunks to the log file (visible in tmux)
 *   6. Print final result to stdout for the orchestrator LLM
 *   7. Clean up (kill process, remove temp agent config)
 *
 * Usage:
 *   node spike/team-mvp.mjs --role security --task "Review for vulnerabilities" --context-file /tmp/diff.txt
 */

import { createAcpClient } from './lib/acp-client.mjs';
import { readFileSync, writeFileSync, unlinkSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { execSync } from 'child_process';
import { parseArgs } from 'util';

// --- Arg parsing ---

export function parseCliArgs(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      role:         { type: 'string' },
      task:         { type: 'string' },
      'context-file': { type: 'string' },
      help:         { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    console.log(`Usage: node spike/team-mvp.mjs --role <role> --task <task> --context-file <path>

Options:
  --role          Worker focus area (e.g. security, performance, maintenance)
  --task          Task description for the worker
  --context-file  Path to file containing context (e.g. a git diff)
  -h, --help      Show this help`);
    process.exit(0);
  }

  if (!values.role) throw new Error('--role is required');
  if (!values.task) throw new Error('--task is required');
  if (!values['context-file']) throw new Error('--context-file is required');

  return { role: values.role, task: values.task, contextFile: values['context-file'] };
}

// --- Agent config generation ---

export function buildWorkerAgentConfig(role) {
  return {
    name: `omk-review-${role}`,
    description: `Code reviewer focusing on ${role}`,
    prompt: `You are a code reviewer. Focus on ${role}. Review the code diff provided. Give specific, actionable findings with file and line references. Be concise.`,
    tools: ['read', 'shell', 'grep', 'glob'],
    allowedTools: ['read', 'shell', 'grep', 'glob'],
    model: null,
  };
}

export function agentConfigPath(role) {
  return join(homedir(), '.kiro', 'agents', `omk-review-${role}.json`);
}

// --- Tmux pane ---

function hasTmux() {
  try {
    execSync('tmux info', { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function openTmuxTail(logFile, role) {
  if (!hasTmux()) return;
  try {
    execSync(`tmux split-window -h -l 80 "tail -f ${logFile}; read"`, { stdio: 'ignore' });
    execSync(`tmux select-pane -T "review:${role}"`, { stdio: 'ignore' });
  } catch { /* tmux not available or not in a session — skip silently */ }
}

// --- Main ---

async function main() {
  const { role, task, contextFile } = parseCliArgs();

  // Read context
  const context = readFileSync(contextFile, 'utf-8');

  // Write agent config
  const config = buildWorkerAgentConfig(role);
  const configPath = agentConfigPath(role);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  // Set up log file
  const logFile = join(tmpdir(), `omk-review-${role}-${Date.now()}.log`);
  writeFileSync(logFile, `=== Review: ${role} ===\nTask: ${task}\n\n`);

  // Open tmux pane
  openTmuxTail(logFile, role);

  // Spawn ACP worker
  const client = createAcpClient({ name: `review-${role}`, agentName: config.name });
  let result = '';

  try {
    await client.initialize();
    const sessionId = await client.newSession({ cwd: process.cwd() });

    const promptText = `${task}\n\nHere is the code diff to review:\n\n${context}`;

    result = await client.prompt(sessionId, promptText, {
      onChunk: (text) => appendFileSync(logFile, text),
      timeoutMs: 300_000, // 5 min for large reviews
    });

    appendFileSync(logFile, '\n\n=== Review complete ===\n');
  } finally {
    client.kill();
    // Clean up temp agent config
    try { unlinkSync(configPath); } catch { /* already removed */ }
  }

  // Print result to stdout for orchestrator
  process.stdout.write(result);
}

main().catch(err => {
  console.error(`team-mvp error: ${err.message}`);
  process.exit(1);
});
