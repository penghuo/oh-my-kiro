# oh-my-kiro Fork Specification

## Goal

Fork oh-my-kiro into oh-my-kiro: copy the entire codebase, rebrand omk→omk, and add kiro-cli as a first-class team worker CLI alongside codex/claude/gemini. Keep all features: prompts, skills, MCP servers, team mode, HUD, notifications, ralph, pipeline.

## Architecture

Copy-then-transform approach. rsync the oh-my-kiro source tree (from `/Users/penghuo/oss/oh-my-kiro/`) into this repo, apply systematic sed-based renames (longest match first to avoid partial replacements), handle file renames and package.json metadata manually, then build and verify.

The kiro-cli worker support is already partially implemented in the oh-my-kiro codebase (`TeamWorkerCli` type includes `'kiro'`, `translateWorkerLaunchArgsForCli` has a kiro branch, `generateKiroWorkerAgentConfig` exists in runtime.ts). The rename pass transforms `omk-worker-{N}` → `omk-worker-{N}` and `OMK_` → `OMK_` env vars throughout.

## Tech Stack

- TypeScript, Node.js ≥20
- tmux (team session management)
- MCP SDK (@modelcontextprotocol/sdk)
- Zod (schema validation)
- Biome (linting)

## Requirements

### Rename Rules (longest match first)

| Original | Replacement | Scope |
|---|---|---|
| `oh-my-kiro` | `oh-my-kiro` | package name, README, comments, URLs |
| `Oh-My-Kiro` | `Oh-My-Kiro` | title-cased references |
| `OH_MY_KIRO` | `OH_MY_KIRO` | env vars if any |
| `OMK_` | `OMK_` | all env var prefixes |
| `omk` (CLI) | `omk` | bin name, help text, usage, scripts |
| `.omk/` | `.omk/` | state directory paths |
| `.omk/` | `.omk/` | legacy state dir references |
| `omk.js` | `omk.js` | bin entry point |
| `penghuo/oh-my-kiro` | `penghuo/oh-my-kiro` | GitHub URLs |

### NOT Renamed

- `codex` as a `TeamWorkerCli` value — still a valid worker backend
- `CODEX_BYPASS_FLAG` and constants referring to codex CLI's own flags
- `.codex/` in gitignore — kept for compat
- "Codex CLI" as a product name in docs describing worker backends

### kiro-cli Worker CLI

- Binary name: `kiro-cli` (NOT `kiro`)
- Launch args: `kiro-cli chat --trust-all-tools --agent omk-worker-{N}`
- Agent config generated at `.kiro/agents/omk-worker-{N}.json` before launch
- Cleanup: remove agent configs on team shutdown

### Gitignore

Keep all legacy entries (`.omk/`, `.omk/`, `.codex/`, `.claude/`, `.agents/`), add `.omk/` and `.kiro/`.
