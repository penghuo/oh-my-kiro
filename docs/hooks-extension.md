# Hooks Extension (Custom Plugins)

OMK supports an additive hooks extension point for user plugins under `.omk/hooks/*.mjs`.

> Compatibility guarantee: `omk tmux-hook` remains fully supported and unchanged.
> The new `omk hooks` command group is additive and does **not** replace tmux-hook workflows.

## Quick start

```bash
omk hooks init
omk hooks status
omk hooks validate
OMK_HOOK_PLUGINS=1 omk hooks test
```

This creates a scaffold plugin at:

- `.omk/hooks/sample-plugin.mjs`

## Enablement model

Plugins are **disabled by default**.

Enable plugin dispatch explicitly:

```bash
export OMK_HOOK_PLUGINS=1
```

Optional timeout tuning (default: 1500ms):

```bash
export OMK_HOOK_PLUGIN_TIMEOUT_MS=1500
```

## Native event pipeline (v1)

Native events are emitted from existing lifecycle/notify paths:

- `session-start`
- `session-end`
- `turn-complete`
- `session-idle`

For clawhip-oriented operational routing, see [Clawhip Event Contract](./clawhip-event-contract.md).

Envelope fields include:

- `schema_version: "1"`
- `event`
- `timestamp`
- `source` (`native` or `derived`)
- `context`
- optional IDs: `session_id`, `thread_id`, `turn_id`, `mode`

## Derived signals (opt-in)

Best-effort derived events are gated and disabled by default.

```bash
export OMK_HOOK_DERIVED_SIGNALS=1
```

Derived signals include:

- `needs-input`
- `pre-tool-use`
- `post-tool-use`

Derived events are labeled with:

- `source: "derived"`
- `confidence`
- parser-specific context hints

## Team-safety behavior

In team-worker sessions (`OMK_TEAM_WORKER` set), plugin side effects are skipped by default.
This keeps the lead session as the canonical side-effect emitter and avoids duplicate sends.

## Plugin contract

Each plugin must export:

```js
export async function onHookEvent(event, sdk) {
  // handle event
}
```

SDK surface includes:

- `sdk.tmux.sendKeys(...)`
- `sdk.log.info|warn|error(...)`
- `sdk.state.read|write|delete|all(...)` (plugin namespace scoped)

## Logs

Plugin dispatch and plugin logs are written to:

- `.omk/logs/hooks-YYYY-MM-DD.jsonl`
