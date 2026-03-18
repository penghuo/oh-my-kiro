# OMK Team Skill Design

**Date:** 2026-03-18
**Status:** Approved
**Scope:** PR Review first, designed to generalize

## Overview

A kiro-cli skill that enables multi-agent team workflows. The first use case is parallel PR review (security, correctness, maintenance), but the underlying infrastructure generalizes to any team task.

User experience:
```
User (in kiro-cli): "omk, spawn agent team to review this PR — security, correctness, maintenance"
→ 3 kiro-cli workers launch in tmux, each reviews one aspect
→ orchestrator consolidates results into a single review summary
```

## Execution Model

There are two layers: the **skill** (instructions) and the **CLI** (infrastructure).

```
┌─ Orchestrator kiro-cli session ──────────────────────────────────┐
│                                                                   │
│  User: "spawn agent team to review PR"                            │
│                                                                   │
│  LLM reads team skill (SKILL.md), which tells it what to do.     │
│  LLM uses its built-in tools to carry out the steps:              │
│                                                                   │
│  Step 1: LLM calls execute_bash                                   │
│    → omk team launch --task "Review PR" \                         │
│        --workers "security,correctness,maintenance" \             │
│        --context-cmd "git diff main..HEAD"                        │
│    → omk CLI creates team dir, writes context file,               │
│      generates per-worker agent configs, launches MCP server,     │
│      spawns 3 kiro-cli instances in tmux panes                    │
│    → returns team-id to stdout                                    │
│                                                                   │
│  Step 2: LLM calls execute_bash                                   │
│    → omk team status <team-id>                                    │
│    → CLI checks results/ directory, returns completion count      │
│    → LLM repeats until all workers report done                    │
│                                                                   │
│  Step 3: LLM calls fs_read                                        │
│    → reads .omk/teams/<id>/results/worker-0.txt                   │
│    → reads .omk/teams/<id>/results/worker-1.txt                   │
│    → reads .omk/teams/<id>/results/worker-2.txt                   │
│                                                                   │
│  Step 4: LLM consolidates all results                             │
│    → synthesizes a single review summary for the user             │
│                                                                   │
│  (Advanced) Step 5: LLM sends clarification                       │
│    → calls execute_bash: omk team message <team-id> worker-0 ... │
│    → worker receives message, responds, posts updated result      │
│    → LLM re-reads and re-consolidates                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

Key point: the **LLM is the executor**. The skill teaches it what commands to run. The LLM uses `execute_bash` and `fs_read` (tools it already has) to interact with the `omk` CLI and result files. The `omk` CLI handles all deterministic infrastructure (tmux, MCP server, file layout).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Orchestrator kiro-cli                              │
│  (LLM reads team skill, calls omk CLI via bash)     │
└──────────┬──────────────────────────────────────────┘
           │ execute_bash: omk team launch ...
           │ (spawns tmux panes + MCP server)
           ▼
┌──────────────────┐
│ omk-team-server  │  MCP process (owns all file I/O with locking)
└──┬─────┬─────┬───┘
   │     │     │    MCP tool calls
   ▼     ▼     ▼
┌─────┐┌─────┐┌─────┐
│kiro ││kiro ││kiro │  3 tmux panes
│sec  ││corr ││maint│  each is a standalone kiro-cli
└─────┘└─────┘└─────┘
```

## Communication: MCP + Files

Learned from oh-my-codex (OMX). Agents don't touch files directly — they call MCP tools, and the MCP server handles locking and file I/O.

Why this approach over alternatives:

| Approach | Verdict |
|---|---|
| Gateway (OpenClaw style) | Overkill for local agents sharing a filesystem. Good for remote/cross-machine — future upgrade path. |
| MCP + Files (OMX style) | **Chosen.** kiro-cli speaks MCP natively. MCP server handles concurrency. Files give durability + debuggability. |
| Raw file I/O | No locking, breaks on concurrent writes. Falls apart with bidirectional communication. |

### MCP Server Tools

| Tool | Called by | Purpose |
|---|---|---|
| `omk_post_result` | Worker | Post review output when done |
| `omk_send_message` | Any agent | Send message to another agent (clarifications) |
| `omk_check_inbox` | Any agent | Check for incoming messages |
| `omk_team_status` | Orchestrator (via CLI) | Check how many workers are done |

## File Layout

```
.omk/teams/<team-id>/
├── config.json              # team metadata (worker names, pane ids, status)
├── context/
│   └── diff.txt             # shared PR diff (written once by orchestrator)
├── agents/
│   ├── worker-0.json        # dynamically composed kiro-cli agent config
│   ├── worker-1.json
│   └── worker-2.json
├── results/
│   ├── worker-0.txt         # free-form review output (one writer per file)
│   ├── worker-1.txt
│   └── worker-2.txt
├── mailbox/
│   ├── worker-0.json        # messages for worker-0
│   ├── worker-1.json
│   └── orchestrator.json
└── events.jsonl             # append-only event log
```

## Worker Task Assignment

The orchestrator dynamically composes a per-worker agent config at launch time. Each worker's agent JSON contains:

- The specific review aspect (security / correctness / maintenance)
- Instructions to read shared context from `context/diff.txt`
- MCP server connection config (to call `omk_post_result`, etc.)
- Instructions to post results when done

Example generated agent config for worker-0:
```json
{
  "name": "omk-review-security",
  "description": "Reviews PR diff for security issues",
  "prompt": "You are a security review expert. Read the PR diff from .omk/teams/<id>/context/diff.txt. Review it for security vulnerabilities, injection risks, auth issues, secret exposure, etc. When done, call omk_post_result with your findings.",
  "mcpServers": {
    "omk-team": {
      "command": "node",
      "args": [".omk/teams/<id>/mcp-server.js"],
      "transportType": "stdio"
    }
  }
}
```

Why dynamic composition (not static configs or task files):
- One generic template, orchestrator fills in the specifics
- No bootstrap step — worker starts and already knows its job
- Orchestrator has full control over what each worker sees
- Generalizes: swap review prompt for any task prompt

## Result Consolidation

Plain text, LLM-driven. When all workers finish:

1. Orchestrator LLM reads all result files via `fs_read`
2. LLM synthesizes a single consolidated review summary
3. LLM presents to user

No structured JSON schema for results. Workers write free-form text. The LLM is better at synthesizing unstructured expert opinions than parsing rigid schemas.

## Advanced: Bidirectional Communication

For clarification loops (orchestrator ↔ worker) and worker ↔ worker:

1. Sender calls `omk_send_message` MCP tool → MCP server writes to target's mailbox JSON
2. MCP server sends tmux keystroke nudge to target pane (triggers target to check inbox)
3. Target calls `omk_check_inbox` → reads messages → responds via `omk_send_message`

The mailbox protocol supports:
- Orchestrator → Worker (clarification requests)
- Worker → Orchestrator (questions, escalations)
- Worker → Worker (cross-review coordination)

## CLI Commands

```bash
# Launch a team
omk team launch --task "Review PR" --workers "security,correctness,maintenance" --context-cmd "git diff main..HEAD"

# Check status
omk team status <team-id>

# Send message to a worker
omk team message <team-id> <worker-name> "Can you elaborate on the SQL injection finding?"

# Shutdown team
omk team shutdown <team-id>
```

## Skill File

`~/.kiro/skills/team/SKILL.md` instructs the orchestrator LLM to:

1. Parse user request → extract task description + worker roles
2. Call `omk team launch` via `execute_bash` → get team-id
3. Poll `omk team status` via `execute_bash` until all workers done
4. Read result files via `fs_read`
5. Synthesize consolidated output
6. If results need clarification → use `omk team message` → re-read → re-consolidate

## What Generalizes

| Component | PR-review specific? | Reusable? |
|---|---|---|
| tmux spawn | No | ✅ Any team task |
| MCP server | No | ✅ Any team task |
| File layout | No | ✅ Any team task |
| Polling + consolidation flow | No | ✅ Any team task |
| Worker prompt content | **Yes** | Swap for any task |
| Team skill (SKILL.md) | Partially | Template works, prompts change |

Future team workflows (refactoring, testing, documentation) just compose different worker prompts. Everything else stays the same.

## Implementation Components

1. **`omk team` CLI commands** — launch, status, message, shutdown
2. **omk-team-server** — lightweight MCP server (~200-300 lines) wrapping file ops with locking
3. **Agent config generator** — composes per-worker kiro-cli agent JSON from template + task
4. **Team skill** — `SKILL.md` teaching the orchestrator LLM the workflow
5. **tmux session manager** — create session, spawn panes, send keys (adapt from existing OMK code)
