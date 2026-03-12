# Fix Plan

## TODO
- [x] Rename bin/omx.js → bin/omk.js: mv the file, commit. Done (6b6cda1).
- [x] Bulk text rename pass 1 — long patterns. Done (ef152e4).
- [x] Bulk text rename pass 2 — OMX_ env vars → OMK_. Done (ef152e4).
- [x] Bulk text rename pass 3 — state dirs .omx/→.omk/ and .omc/→.omk/. Done (ef152e4).
- [x] Bulk text rename pass 4 — bare omx references. Done (ef152e4).
- [x] Bulk text rename pass 5 — tmux markers. Done (ef152e4).
- [x] Bulk text rename pass 6 — tmux session prefix. Done (ef152e4).
- [x] Verify rename completeness: grep confirmed zero stale OMX_, .omx/, oh-my-codex references. Also renamed skills/omx-setup→skills/omk-setup, omx_→omk_ MCP names, Omx→Omk title case. Done (ef152e4).
- [ ] Update package.json metadata: set description to "Multi-agent orchestration layer for Kiro CLI", verify bin field is {"omk":"bin/omk.js"}, verify GitHub URLs point to penghuo/oh-my-kiro, replace keywords codex/openai with kiro/kiro-cli, set author to "Peng Huo". Commit.
- [ ] Update .gitignore: add .omk/ and .kiro/ entries, keep all existing entries (.omc/, .omx/, .codex/, .claude/, .agents/). Commit.
- [ ] Regenerate package-lock.json: rm package-lock.json, npm install. Commit.
- [ ] Build: run npm run build. Fix any compilation errors from missed renames. Rebuild until clean.
- [ ] Run tests: run npm run test:node. Fix any test failures from stale env var names or path references. Commit fixes.
- [ ] Smoke test CLI: run node bin/omk.js --help (expect omk commands in output), run node bin/omk.js doctor (expect no crash). Commit final state.

## Completed
- [x] Copy oh-my-codex source tree: rsync from /Users/penghuo/oss/oh-my-codex/ excluding .git, node_modules, dist, docs/plans. Verified src/cli/index.ts, src/team/runtime.ts, package.json, bin/omx.js. Committed (023a620).
- [x] Bulk rename passes 1-6 + verification: 332 files changed, 5710 insertions(+), 5710 deletions(-). All omx→omk, OMX→OMK, oh-my-codex→oh-my-kiro, Yeachan-Heo→penghuo URL renames applied. Committed (ef152e4).
