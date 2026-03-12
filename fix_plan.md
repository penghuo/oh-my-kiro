# Fix Plan

## TODO
- [x] Rename bin/omx.js → bin/omk.js: mv the file, commit. Done (6b6cda1).
- [ ] Bulk text rename pass 1 — long patterns: sed replace oh-my-codex→oh-my-kiro, Oh-My-Codex→Oh-My-Kiro, OH_MY_CODEX→OH_MY_KIRO, Yeachan-Heo/oh-my-codex→penghuo/oh-my-kiro, yeachan-heo.github.io/oh-my-codex→penghuo.github.io/oh-my-kiro across all text files (exclude .git, node_modules, dist, images, package-lock.json, docs/plans/2026-03-12-oh-my-kiro-fork*).
- [ ] Bulk text rename pass 2 — OMX_ env vars: sed replace OMX_→OMK_ across all text files.
- [ ] Bulk text rename pass 3 — state dirs: sed replace .omx/→.omk/ and .omc/→.omk/ across all text files.
- [ ] Bulk text rename pass 4 — bare omx references: sed replace [omx:→[omk:, omx team→omk team, omx setup→omk setup, omx doctor→omk doctor, omx launch→omk launch, omx resume→omk resume, omx ralph→omk ralph, omx ask→omk ask, omx uninstall→omk uninstall, omx update→omk update, omx hooks→omk hooks, omx catalog→omk catalog, omx hud→omk hud, 'omx'→'omk', "omx"→"omk", omx.js→omk.js, omx-worker→omk-worker, omx-setup→omk-setup, "OMX "→"OMK ".
- [ ] Bulk text rename pass 5 — tmux markers: sed replace OMX:RUNTIME→OMK:RUNTIME, OMX:TEAM→OMK:TEAM, OMX:GUIDANCE→OMK:GUIDANCE, OMX_TMUX_INJECT→OMK_TMUX_INJECT, OMX_LANG_REMINDER→OMK_LANG_REMINDER, omx-worktrees→omk-worktrees, omx-config→omk-config.
- [ ] Bulk text rename pass 6 — tmux session prefix: sed replace omx-$→omk-$, /^omx-/→/^omk-/.
- [ ] Verify rename completeness: grep for stale OMX_ and .omx/ references. Fix any remaining hits. Commit all rename changes.
- [ ] Update package.json metadata: set description to "Multi-agent orchestration layer for Kiro CLI", verify bin field is {"omk":"bin/omk.js"}, verify GitHub URLs point to penghuo/oh-my-kiro, replace keywords codex/openai with kiro/kiro-cli, set author to "Peng Huo". Commit.
- [ ] Update .gitignore: add .omk/ and .kiro/ entries, keep all existing entries (.omc/, .omx/, .codex/, .claude/, .agents/). Commit.
- [ ] Regenerate package-lock.json: rm package-lock.json, npm install. Commit.
- [ ] Build: run npm run build. Fix any compilation errors from missed renames. Rebuild until clean.
- [ ] Run tests: run npm run test:node. Fix any test failures from stale env var names or path references. Commit fixes.
- [ ] Smoke test CLI: run node bin/omk.js --help (expect omk commands in output), run node bin/omk.js doctor (expect no crash). Commit final state.

## Completed
- [x] Copy oh-my-codex source tree: rsync from /Users/penghuo/oss/oh-my-codex/ excluding .git, node_modules, dist, docs/plans. Verified src/cli/index.ts, src/team/runtime.ts, package.json, bin/omx.js. Committed (023a620).
