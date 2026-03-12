# OMK Team Mutation Contract for Interop Brokers

This document defines the supported **mutation path** for external interoperability brokers.

## Rule of record

External systems must mutate team state through CLI interop:

```bash
omk team api <operation> --input '<json-object>' --json
```

Legacy `team_*` MCP APIs are hard-deprecated and return a deprecation error with a CLI hint.
Direct writes to `.omk/state/team/...` are unsupported and may violate runtime invariants.

## Required task mutation flow

1. Read current task:
   - `omk team api read-task --json`
2. Claim with optimistic version:
   - `omk team api claim-task --json`
3. Transition terminal state with claim token:
   - `omk team api transition-task-status --json` (`in_progress -> completed|failed`)
4. Use `omk team api release-task-claim --json` only for rollback/requeue-to-pending flows.

## Legacy MCP -> CLI migration table

| Legacy `team_*` tool | CLI operation |
|---|---|
| `team_send_message` | `omk team api send-message --json` |
| `team_broadcast` | `omk team api broadcast --json` |
| `team_mailbox_list` | `omk team api mailbox-list --json` |
| `team_mailbox_mark_notified` | `omk team api mailbox-mark-notified --json` |
| `team_mailbox_mark_delivered` | `omk team api mailbox-mark-delivered --json` |
| `team_create_task` | `omk team api create-task --json` |
| `team_read_task` | `omk team api read-task --json` |
| `team_list_tasks` | `omk team api list-tasks --json` |
| `team_update_task` | `omk team api update-task --json` |
| `team_claim_task` | `omk team api claim-task --json` |
| `team_transition_task_status` | `omk team api transition-task-status --json` |
| `team_release_task_claim` | `omk team api release-task-claim --json` |
| `team_read_config` | `omk team api read-config --json` |
| `team_read_manifest` | `omk team api read-manifest --json` |
| `team_read_worker_status` | `omk team api read-worker-status --json` |
| `team_read_worker_heartbeat` | `omk team api read-worker-heartbeat --json` |
| `team_update_worker_heartbeat` | `omk team api update-worker-heartbeat --json` |
| `team_write_worker_inbox` | `omk team api write-worker-inbox --json` |
| `team_write_worker_identity` | `omk team api write-worker-identity --json` |
| `team_append_event` | `omk team api append-event --json` |
| `team_get_summary` | `omk team api get-summary --json` |
| `team_cleanup` | `omk team api cleanup --json` |
| `team_write_shutdown_request` | `omk team api write-shutdown-request --json` |
| `team_read_shutdown_ack` | `omk team api read-shutdown-ack --json` |
| `team_read_monitor_snapshot` | `omk team api read-monitor-snapshot --json` |
| `team_write_monitor_snapshot` | `omk team api write-monitor-snapshot --json` |
| `team_read_task_approval` | `omk team api read-task-approval --json` |
| `team_write_task_approval` | `omk team api write-task-approval --json` |

## Message lifecycle operations

- send: `send-message`, `broadcast`
- inspect: `mailbox-list`
- delivery markers: `mailbox-mark-notified`, `mailbox-mark-delivered`

## Dispatch policy (authoritative path)

- Use `omk team api ... --json` + team state files as the authoritative delivery/control path.
- Direct tmux typing (`tmux send-keys`, repeated Enter injection) is operational fallback only, not a mutation contract.
- Interop brokers and worker automations should never assume tmux keystroke delivery implies successful mailbox/task mutation; always verify via JSON envelope + state reads.

## JSON envelope contract

`--json` output is machine-readable and stable:

- success:
  - `{"schema_version":"1.0","timestamp":"<ISO>","command":"omk team api <operation>","ok":true,"operation":"<operation>","data":{...}}`
- failure:
  - `{"schema_version":"1.0","timestamp":"<ISO>","command":"omk team api ...","ok":false,"operation":"<operation|unknown>","error":{"code":"<code>","message":"<message>"}}`

## Notes

- `transition-task-status` is the claim-safe terminal transition path.
  - Runtime enforces `in_progress -> completed|failed`; other transitions return `invalid_transition`.
- `release-task-claim` intentionally resets the task to `pending`; it is not a completion operation.
- `update-task` only accepts `subject`, `description`, `blocked_by`, and `requires_code_change` as mutable fields.
- `append-event.type` and `write-task-approval.status` enforce strict enum validation.
