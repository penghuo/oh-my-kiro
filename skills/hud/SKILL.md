---
name: "hud"
description: "Show or configure the OMK HUD (two-layer statusline)"
role: "display"
scope: ".omk/**"
---

# HUD Skill

The OMK HUD uses a two-layer architecture:

1. **Layer 1 - Codex built-in statusLine**: Real-time TUI footer showing model, git branch, and context usage. Configured via `[tui] status_line` in `~/.codex/config.toml`. Zero code required.

2. **Layer 2 - `omk hud` CLI command**: Shows OMK-specific orchestration state (ralph, ultrawork, autopilot, team, pipeline, ecomode, turns). Reads `.omk/state/` files.

## Quick Commands

| Command | Description |
|---------|-------------|
| `omk hud` | Show current HUD (modes, turns, activity) |
| `omk hud --watch` | Live-updating display (polls every 1s) |
| `omk hud --json` | Raw state output for scripting |
| `omk hud --preset=minimal` | Minimal display |
| `omk hud --preset=focused` | Default display |
| `omk hud --preset=full` | All elements |

## Presets

### minimal
```
[OMK] ralph:3/10 | turns:42
```

### focused (default)
```
[OMK] ralph:3/10 | ultrawork | team:3 workers | turns:42 | last:5s ago
```

### full
```
[OMK] ralph:3/10 | ultrawork | autopilot:execution | team:3 workers | pipeline:exec | turns:42 | last:5s ago | total-turns:156
```

## Setup

`omk setup` automatically configures both layers:
- Adds `[tui] status_line` to `~/.codex/config.toml` (Layer 1)
- Writes `.omk/hud-config.json` with default preset (Layer 2)
- Default preset is `focused`; if HUD/statusline changes do not appear, restart Codex CLI once.

## Layer 1: Codex Built-in StatusLine

Configured in `~/.codex/config.toml`:
```toml
[tui]
status_line = ["model-with-reasoning", "git-branch", "context-remaining"]
```

Available built-in items (Codex CLI v0.101.0+):
`model-name`, `model-with-reasoning`, `current-dir`, `project-root`, `git-branch`, `context-remaining`, `context-used`, `five-hour-limit`, `weekly-limit`, `codex-version`, `context-window-size`, `used-tokens`, `total-input-tokens`, `total-output-tokens`, `session-id`

## Layer 2: OMK Orchestration HUD

The `omk hud` command reads these state files:
- `.omk/state/ralph-state.json` - Ralph loop iteration
- `.omk/state/ultrawork-state.json` - Ultrawork mode
- `.omk/state/autopilot-state.json` - Autopilot phase
- `.omk/state/team-state.json` - Team workers
- `.omk/state/pipeline-state.json` - Pipeline stage
- `.omk/state/ecomode-state.json` - Ecomode active
- `.omk/state/hud-state.json` - Last activity (from notify hook)
- `.omk/metrics.json` - Turn counts

## Configuration

HUD config stored at `.omk/hud-config.json`:
```json
{
  "preset": "focused"
}
```

## Color Coding

- **Green**: Normal/healthy
- **Yellow**: Warning (ralph >70% of max)
- **Red**: Critical (ralph >90% of max)

## Troubleshooting

If the TUI statusline is not showing:
1. Ensure Codex CLI v0.101.0+ is installed
2. Run `omk setup` to configure `[tui]` section
3. Restart Codex CLI

If `omk hud` shows "No active modes":
- This is expected when no workflows are running
- Start a workflow (ralph, autopilot, etc.) and check again
