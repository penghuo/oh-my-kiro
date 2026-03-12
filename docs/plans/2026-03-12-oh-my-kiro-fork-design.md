# oh-my-kiro Fork Design

## Goal

Fork oh-my-codex into oh-my-kiro: copy the entire codebase, rebrand omx→omk, and add kiro-cli as a first-class team worker CLI alongside codex/claude/gemini. Keep all features: prompts, skills, MCP servers, team mode, HUD, notifications, ralph, pipeline.

## Decisions

- CLI command: `omk` (was `omx`)
- State directory: `.omk/` (was `.omx/`)
- Binary: `kiro-cli` (NOT `kiro`)
- Approach: copy-then-transform (Approach 1)
- Codex CLI support: kept as a worker backend
- Gitignore: keep all legacy entries (`.omc/`, `.codex/`, `.claude/`, `.agents/`), add `.omk/` and `.kiro/`
- Open questions (prompt char, trust prompt, auto-compaction, hook limits): discovered during implementation

## Section 1: Systematic Rename

Applied in order (longest match first):

| Original | Replacement | Scope |
|---|---|---|
| `oh-my-codex` | `oh-my-kiro` | package name, README, comments, URLs |
| `Oh-My-Codex` | `Oh-My-Kiro` | title-cased references |
| `OH_MY_CODEX` | `OH_MY_KIRO` | env vars if any |
| `OMX_` | `OMK_` | all env var prefixes |
| `omx` (CLI) | `omk` | bin name, help text, usage, scripts |
| `.omx/` | `.omk/` | state directory paths |
| `.omc/` | `.omk/` | legacy state dir references |
| `omx.js` | `omk.js` | bin entry point |
| `Yeachan-Heo/oh-my-codex` | `penghuo/oh-my-kiro` | GitHub URLs |

NOT renamed:
- `codex` as a `TeamWorkerCli` value (still a valid worker backend)
- `CODEX_BYPASS_FLAG` and constants referring to codex CLI's own flags
- `.codex/` in gitignore (compat)
- "Codex CLI" as a product name in docs describing worker backends

## Section 2: Add kiro-cli Worker CLI

### `src/team/tmux-session.ts`
- `TeamWorkerCli` type already includes `'kiro'`
- `assertTeamWorkerCliBinaryAvailable()`: `'kiro'` → resolve `'kiro-cli'`
- `resolveAbsoluteBinaryPath()`: `'kiro'` → `'kiro-cli'`
- `translateWorkerLaunchArgsForCli()`: kiro branch → `['chat', '--trust-all-tools', '--agent', agentName]`
- `paneLooksReady()`: add kiro-cli prompt character (TBD during implementation)

### `src/team/kiro-agent-generator.ts` — NEW
Generates `.kiro/agents/omk-worker-{N}.json` before worker launch:
- Prompt: `file://` URI to composed AGENTS.md
- MCP servers: omk_state, omk_memory, omk_trace
- Hooks: stop hook for heartbeat + mailbox
- Tool allowlist

### `scripts/omk-kiro-hooks.js` — NEW
Stop hook: heartbeat write, mailbox check, turn count update.

### `src/team/runtime.ts`
Worker bootstrap loop: if `workerCli === 'kiro'`, call `generateKiroWorkerAgent()` before launch.

### Cleanup
`shutdownTeam()`: remove `.kiro/agents/omk-worker-*.json`.

## Section 3: Unchanged (beyond omx→omk rename)

- 32 prompts in `prompts/`
- 36 skills in `skills/`
- `AGENTS.md` and `templates/AGENTS.md` (just omx→omk markers)
- 5 MCP servers (state, memory, trace, team, code-intel)
- HUD, notifications, pipeline, ralph, session history
- All test files (just rename pass)

## Implementation Order

1. Copy oh-my-codex tree into oh-my-kiro (exclude `.git/`, `node_modules/`, `dist/`)
2. Systematic rename pass (Section 1)
3. Add kiro-cli worker support (Section 2)
4. `npm install && npm run build` — verify compilation
5. Smoke test: `omk doctor`, `omk team 1:executor "hello"` with `OMK_TEAM_WORKER_CLI=kiro`
6. Discover kiro-cli prompt character, update `paneLooksReady()`
