---
name: omk-setup
description: Setup and configure oh-my-kiro using current CLI behavior
---

# OMK Setup

Use this skill when users want to install or refresh oh-my-kiro for the **current project plus user-level OMK directories**.

## Command

```bash
omk setup [--force] [--dry-run] [--verbose] [--scope <user|project>]
```

If you only want lightweight `AGENTS.md` scaffolding for an existing repo or subtree, use `omk agents-init [path]` instead of full setup.

Supported setup flags (current implementation):
- `--force`: overwrite/reinstall managed artifacts where applicable
- `--dry-run`: print actions without mutating files
- `--verbose`: print per-file/per-step details
- `--scope`: choose install scope (`user`, `project`)

## What this setup actually does

`omk setup` performs these steps:

1. Resolve setup scope:
   - `--scope` explicit value
   - else persisted `./.omk/setup-scope.json` (with automatic migration of legacy values)
   - else interactive prompt on TTY (default `user`)
   - else default `user` (safe for CI/tests)
2. Create directories and persist effective scope
3. Install prompts, native agent configs, skills, and merge config.toml (scope determines target directories)
4. Verify Team CLI API interop markers exist in built `dist/cli/team.js`
5. Generate project-root `./AGENTS.md` from `templates/AGENTS.md` (or skip when existing and no force)
6. Configure notify hook references and write `./.omk/hud-config.json`

## Important behavior notes

- `omk setup` only prompts for scope when no scope is provided/persisted and stdin/stdout are TTY.
- Local project orchestration file is `./AGENTS.md` (project root).
- If `AGENTS.md` exists and `--force` is not used, interactive TTY runs ask whether to overwrite. Non-interactive runs preserve the file.
- Scope targets:
  - `user`: user directories (`~/.codex`, `~/.agents/skills`, `~/.omk/agents`)
  - `project`: local directories (`./.codex`, `./.agents/skills`, `./.omk/agents`)
- If persisted scope is `project`, `omk` launch automatically uses `CODEX_HOME=./.codex` unless user explicitly overrides `CODEX_HOME`.
- With `--force`, AGENTS overwrite may still be skipped if an active OMK session is detected (safety guard).
- Legacy persisted scope values (`project-local`) are automatically migrated to `project` with a one-time warning.

## Recommended workflow

1. Run setup:

```bash
omk setup --force --verbose
```

2. Verify installation:

```bash
omk doctor
```

3. Start Codex with OMK in the target project directory.

## Expected verification indicators

From `omk doctor`, expect:
- Prompts installed (scope-dependent: user or project)
- Skills installed (scope-dependent: user or project)
- AGENTS.md found in project root
- `.omk/state` exists
- OMK MCP servers configured in scope target `config.toml` (`~/.codex/config.toml` or `./.codex/config.toml`)

## Troubleshooting

- If using local source changes, run build first:

```bash
npm run build
```

- If your global `omk` points to another install, run local entrypoint:

```bash
node bin/omk.js setup --force --verbose
node bin/omk.js doctor
```

- If AGENTS.md was not overwritten during `--force`, stop active OMK session and rerun setup.
