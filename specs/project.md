# oh-my-kiro Fork Specification

## Goal

Fork oh-my-codex into oh-my-kiro: copy the entire codebase, rebrand omx→omk, and add kiro-cli as a first-class team worker CLI alongside codex/claude/gemini. Keep all features: prompts, skills, MCP servers, team mode, HUD, notifications, ralph, pipeline.

## Architecture

Copy-then-transform approach. rsync the oh-my-codex source tree (from `/Users/penghuo/oss/oh-my-codex/`) into this repo, apply systematic sed-based renames (longest match first to avoid partial replacements), handle file renames and package.json metadata manually, then build and verify.

The kiro-cli worker support is already partially implemented in the oh-my-codex codebase (`TeamWorkerCli` type includes `'kiro'`, `translateWorkerLaunchArgsForCli` has a kiro branch, `generateKiroWorkerAgentConfig` exists in runtime.ts). The rename pass transforms `omx-worker-{N}` → `omk-worker-{N}` and `OMX_` → `OMK_` env vars throughout.

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
| `oh-my-codex` | `oh-my-kiro` | package name, README, comments, URLs |
| `Oh-My-Codex` | `Oh-My-Kiro` | title-cased references |
| `OH_MY_CODEX` | `OH_MY_KIRO` | env vars if any |
| `OMX_` | `OMK_` | all env var prefixes |
| `omx` (CLI) | `omk` | bin name, help text, usage, scripts |
| `.omx/` | `.omk/` | state directory paths |
| `.omc/` | `.omk/` | legacy state dir references |
| `omx.js` | `omk.js` | bin entry point |
| `Yeachan-Heo/oh-my-codex` | `penghuo/oh-my-kiro` | GitHub URLs |

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

Keep all legacy entries (`.omc/`, `.omx/`, `.codex/`, `.claude/`, `.agents/`), add `.omk/` and `.kiro/`.
