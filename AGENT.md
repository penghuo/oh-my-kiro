# Agent Notes

## Build
```bash
npm run build
```

## Test
```bash
npm run test:node
```

## Lint
```bash
npm run lint
```

## Notes
- Project created from plan: docs/plans/2026-03-12-oh-my-kiro-fork-implementation.md
- Design doc: docs/plans/2026-03-12-oh-my-kiro-fork-design.md
- Source codebase: /Users/penghuo/oss/oh-my-codex/
- Node.js ≥20 required
- Do NOT rename `codex` as a TeamWorkerCli value, CODEX_BYPASS_FLAG, or `.codex/` in gitignore — these refer to the codex CLI binary itself which remains a valid worker backend
- The kiro-cli worker support (generateKiroWorkerAgentConfig, translateWorkerLaunchArgsForCli kiro branch, etc.) already exists in the source — just needs the omx→omk rename applied
- Binary name for kiro is `kiro-cli` (NOT `kiro`)
