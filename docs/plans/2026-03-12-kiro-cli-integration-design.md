# OMX + Kiro CLI Integration Design

## Goal

Add `kiro` as a first-class team worker CLI in OMX, alongside `codex`, `claude`, and `gemini`. Kiro workers run in tmux panes (same as existing workers), receive tasks via `send-keys`, and communicate state through OMX MCP servers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        OMX Control Plane                        │
│                                                                 │
│  omx team 3:executor "task"                                     │
│    │                                                            │
│    ├─ resolveTeamWorkerCliPlan()  ← adds 'kiro' option         │
│    ├─ generateKiroAgentConfig()   ← NEW: writes .kiro/agents/  │
│    ├─ buildWorkerProcessLaunchSpec() ← extends for kiro        │
│    └─ createTeamSession()         ← unchanged (tmux)           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     tmux Session Layout                         │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Leader   │ │ Worker-1 │ │ Worker-2 │ │ Worker-3 │          │
│  │ (codex/  │ │ kiro-cli │ │ kiro-cli │ │ kiro-cli │          │
│  │  kiro)   │ │  chat    │ │  chat    │ │  chat    │          │
│  │          │ │ --agent  │ │ --agent  │ │ --agent  │          │
│  │          │ │ omx-w-1  │ │ omx-w-2  │ │ omx-w-3  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │            │             │                │
│       │    tmux send-keys / capture-pane       │                │
│       │             │            │             │                │
├───────┴─────────────┴────────────┴─────────────┴────────────────┤
│                      MCP Server Layer                           │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ omx_state  │ │ omx_memory │ │ omx_trace  │ │ omx_team_run│ │
│  │ (per-proc) │ │ (per-proc) │ │ (per-proc) │ │ (per-proc)  │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────┬──────┘ │
│        └───────────────┴──────────────┴───────────────┘        │
│                         .omx/ (shared filesystem state)         │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Model: Codex vs Kiro Side-by-Side

```
Codex Worker Launch:
  codex \
    -c model_instructions_file=".omx/state/team/{name}/workers/worker-1/AGENTS.md" \
    -c model_reasoning_effort="high" \
    --dangerously-bypass-approvals-and-sandbox

Kiro Worker Launch:
  kiro-cli chat \
    --agent omx-worker-1 \
    --trust-all-tools
```

The key insight: Codex uses CLI flags + config.toml for everything. Kiro uses an agent config JSON file that bundles prompt, MCP servers, hooks, tools, and skills into one unit. This is actually cleaner — one file per worker instead of scattered config.

## Modules to Change

### 1. `src/team/tmux-session.ts` — Minimal changes

```
TeamWorkerCli type:  'codex' | 'claude' | 'gemini'
                  →  'codex' | 'claude' | 'gemini' | 'kiro'

normalizeTeamWorkerCliMode():  add 'kiro' to valid values
resolveTeamWorkerCliFromLaunchArgs():  detect kiro model names
assertTeamWorkerCliBinaryAvailable():  'kiro' → check 'kiro-cli'
resolveAbsoluteBinaryPath():  'kiro' → resolve 'kiro-cli'
translateWorkerLaunchArgsForCli():  add kiro branch
buildWorkerProcessLaunchSpec():  add kiro-specific env/args
```

`translateWorkerLaunchArgsForCli` for kiro:
```typescript
if (workerCli === 'kiro') {
  // Kiro uses --agent for config, --trust-all-tools for bypass
  // Model/reasoning are in the agent config, not CLI args
  const agentName = extraEnv?.OMX_KIRO_AGENT_NAME ?? `omx-worker-${workerIndex}`;
  return ['chat', '--trust-all-tools', '--agent', agentName];
}
```

### 2. `src/team/kiro-agent-generator.ts` — NEW module

Generates `.kiro/agents/omx-worker-{N}.json` before worker launch.

```typescript
interface KiroWorkerAgentConfig {
  name: string;
  description: string;
  prompt: string;                    // file:///path or inline
  tools: string[];
  allowedTools: string[];
  resources: string[];               // skill:// URIs
  hooks: {
    agentSpawn?: HookEntry[];
    stop?: HookEntry[];
    userPromptSubmit?: HookEntry[];
  };
  mcpServers: Record<string, McpServerEntry>;
}

async function generateKiroWorkerAgent(opts: {
  teamName: string;
  workerName: string;
  workerIndex: number;
  instructionsFilePath: string;      // the composed AGENTS.md + overlay
  cwd: string;
  teamStateRoot: string;
}): Promise<string>  // returns path to generated agent config
```

What it generates:

```json
{
  "name": "omx-worker-1",
  "description": "OMX team worker (executor) for team ship-oauth",
  "prompt": "file:///path/to/.omx/state/team/ship-oauth/workers/worker-1/AGENTS.md",
  "tools": [
    "fs_read", "fs_write", "execute_bash",
    "grep", "glob", "code"
  ],
  "allowedTools": ["*"],
  "resources": [
    "skill://.agents/skills/worker/SKILL.md",
    "skill://.agents/skills/executor/SKILL.md"
  ],
  "hooks": {
    "agentSpawn": [{
      "command": "node /path/to/omx-kiro-hooks.js agentSpawn",
      "description": "OMX worker init"
    }],
    "stop": [{
      "command": "node /path/to/omx-kiro-hooks.js stop",
      "description": "OMX per-turn state sync"
    }]
  },
  "mcpServers": {
    "omx_state": {
      "command": "node",
      "args": ["/path/to/dist/mcp/state-server.js"]
    },
    "omx_memory": {
      "command": "node",
      "args": ["/path/to/dist/mcp/memory-server.js"]
    },
    "omx_trace": {
      "command": "node",
      "args": ["/path/to/dist/mcp/trace-server.js"]
    }
  }
}
```

File location: `.kiro/agents/omx-worker-{N}.json` (workspace-scoped, auto-cleaned on shutdown).

### 3. `src/team/worker-bootstrap.ts` — Small addition

Add `generateKiroWorkerBootstrap()` that:
1. Calls `generateKiroWorkerAgent()` to write the agent config
2. Returns the agent name for use in launch args
3. Reuses existing `writeTeamWorkerInstructionsFile()` for the prompt file (unchanged)

### 4. `src/team/runtime.ts` — Wire it together

In the `startTeam` worker bootstrap loop, add a branch:

```typescript
if (plan.workerCli === 'kiro') {
  // Generate .kiro/agents/ config (bundles prompt + MCP + hooks)
  await generateKiroWorkerAgent({
    teamName: sanitized,
    workerName: plan.workerName,
    workerIndex: i,
    instructionsFilePath: plan.instructionsFilePath,
    cwd: leaderCwd,
    teamStateRoot,
  });
}
```

### 5. `scripts/omx-kiro-hooks.js` — NEW: Kiro stop hook

Lightweight hook script that runs on each Kiro worker turn:

```javascript
// Receives hook event via STDIN: {"hook_event_name":"stop","cwd":"/path"}
// Responsibilities:
//   1. Write worker heartbeat to .omx/state/team/{name}/workers/{worker}/heartbeat.json
//   2. Check mailbox for new messages, output to stdout (injected into agent context)
//   3. Write turn count to worker status
// stdout → injected into next agent turn context
```

This replaces the Codex `notify` hook for Kiro workers. Simpler because:
- No token tracking (not available in Kiro stop hook payload)
- No tmux injection (worker IS the tmux pane)
- Just heartbeat + mailbox check

### 6. `scripts/tmux-hook-engine.js` — Adapt ready detection

`paneLooksReady()` needs to recognize Kiro's prompt character:

```javascript
// Current: matches › (Codex) and ❯ (Claude)
// Add: match Kiro's prompt indicator
const hasKiroPromptLine = lines.some((line) => /^\s*[>›❯]\s*/u.test(line));
```

Need to verify what Kiro CLI's interactive prompt looks like.

### 7. Cleanup on shutdown

In `shutdownTeam()` / `cleanupTeamState()`, add:
```typescript
// Remove generated .kiro/agents/omx-worker-*.json files
```

## What Does NOT Change

- `createTeamSession()` — tmux session/pane creation: identical
- `sendToWorker()` — tmux send-keys: identical
- `isWorkerAlive()` / `getWorkerPanePid()` — pane health: identical
- `killWorkerByPaneId()` — cleanup: identical
- `capturePane` / scrollback reading: identical
- Team state machine (orchestrator.ts): identical
- Task lifecycle (state/tasks.ts): identical
- Mailbox system (state/mailbox.ts): identical
- MCP servers (all 5): identical (stdio, filesystem-backed)
- HUD: identical
- Notification system: identical

## Usage

```bash
# All workers as kiro
OMX_TEAM_WORKER_CLI=kiro omx team 3:executor "ship the feature"

# Mixed: kiro leader + codex workers
OMX_TEAM_WORKER_CLI_MAP=kiro,codex,codex omx team 3:executor "ship the feature"

# Auto-detect from model name (future)
OMX_TEAM_WORKER_LAUNCH_ARGS='--model kiro-model-name' omx team 2:executor "task"
```

## Open Questions

1. **Kiro prompt character**: What does `kiro-cli chat` show as its input prompt? Need this for `paneLooksReady()` detection.

2. **Kiro trust prompt**: Does `--trust-all-tools` suppress all approval prompts, or is there still a workspace trust prompt on first launch? Affects `waitForWorkerReady()`.

3. **Kiro auto-compaction**: Long-running workers may trigger Kiro's auto-compaction. Does this lose the injected `agentSpawn` hook context? If so, may need `chat.disableAutoCompaction` or periodic re-injection via `stop` hook.

4. **MCP server startup time**: Each Kiro worker process starts its own MCP server instances. With 4 workers × 3 MCP servers = 12 Node.js processes. Acceptable?

5. **Kiro `stop` hook stdout size limit**: Is there a limit on how much stdout from a stop hook gets injected into agent context? Mailbox messages could be large.

6. **Kiro skills format compatibility**: OMX skills use `SKILL.md` without YAML frontmatter. Kiro skills require frontmatter (`name`, `description`). Need a converter or dual-format support.

## Implementation Order

1. Add `'kiro'` to `TeamWorkerCli` type + CLI resolution (tmux-session.ts)
2. Create `kiro-agent-generator.ts` module
3. Create `omx-kiro-hooks.js` stop hook script
4. Wire into `runtime.ts` startTeam flow
5. Adapt `paneLooksReady()` for Kiro prompt detection
6. Add cleanup in shutdown path
7. Test with `OMX_TEAM_WORKER_CLI=kiro omx team 1:executor "simple task"`
