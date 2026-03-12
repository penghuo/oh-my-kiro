# oh-my-kiro Fork Implementation Plan

> **For Kiro:** Use `#executing-plans` for sequential tasks — each step depends on the previous.

**Goal:** Fork oh-my-codex into oh-my-kiro, rebrand omx→omk, keep kiro-cli worker support already present in the codebase.

**Architecture:** Copy-then-transform. rsync the source tree, apply bulk sed renames, handle file renames and package.json manually, build and verify.

**Tech Stack:** TypeScript, Node.js ≥20, tmux, MCP SDK

---

### Task 1: Copy oh-my-codex source tree into oh-my-kiro

**Step 1: rsync the tree (excluding .git, node_modules, dist, existing docs/plans)**

```bash
cd /Users/penghuo/oss/oh-my-kiro
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='docs/plans' \
  /Users/penghuo/oss/oh-my-codex/ .
```

**Step 2: Verify the copy**

```bash
ls src/cli/index.ts src/team/runtime.ts package.json bin/omx.js
```

Expected: all four files exist.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: copy oh-my-codex source tree"
```

---

### Task 2: Rename bin/omx.js → bin/omk.js

**Step 1: Move the file**

```bash
cd /Users/penghuo/oss/oh-my-kiro
mv bin/omx.js bin/omk.js
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: rename bin/omx.js → bin/omk.js"
```

---

### Task 3: Bulk text rename — longest matches first

Apply sed replacements across all text files. Order matters — longest match first to avoid partial replacements.

**Step 1: Run the rename script**

```bash
cd /Users/penghuo/oss/oh-my-kiro

# Find all text files (exclude .git, node_modules, dist, images, the design docs we already wrote)
TEXT_FILES=$(find . -type f \
  -not -path './.git/*' \
  -not -path './node_modules/*' \
  -not -path './dist/*' \
  -not -path './docs/plans/2026-03-12-oh-my-kiro-fork*' \
  -not -name '*.png' -not -name '*.jpg' -not -name '*.gif' \
  -not -name 'package-lock.json')

# Pass 1: Multi-word / long patterns (case-sensitive)
echo "$TEXT_FILES" | xargs sed -i '' \
  -e 's/oh-my-codex/oh-my-kiro/g' \
  -e 's/Oh-My-Codex/Oh-My-Kiro/g' \
  -e 's/OH_MY_CODEX/OH_MY_KIRO/g' \
  -e 's/Yeachan-Heo\/oh-my-codex/penghuo\/oh-my-kiro/g' \
  -e 's/yeachan-heo\.github\.io\/oh-my-codex/penghuo.github.io\/oh-my-kiro/g'

# Pass 2: OMX_ env var prefix → OMK_ (careful: only the prefix, not "codex" inside values)
echo "$TEXT_FILES" | xargs sed -i '' 's/OMX_/OMK_/g'

# Pass 3: .omx/ and .omc/ state dirs → .omk/
echo "$TEXT_FILES" | xargs sed -i '' \
  -e "s/\.omx\//\.omk\//g" \
  -e "s/\.omc\//\.omk\//g"

# Pass 4: Bare "omx" references (CLI command name, tmux markers, log prefixes)
# Use word-boundary-aware patterns to avoid mangling "codex" or other words
echo "$TEXT_FILES" | xargs sed -i '' \
  -e "s/\[omx:/[omk:/g" \
  -e "s/omx team/omk team/g" \
  -e "s/omx setup/omk setup/g" \
  -e "s/omx doctor/omk doctor/g" \
  -e "s/omx launch/omk launch/g" \
  -e "s/omx resume/omk resume/g" \
  -e "s/omx ralph/omk ralph/g" \
  -e "s/omx ask/omk ask/g" \
  -e "s/omx uninstall/omk uninstall/g" \
  -e "s/omx update/omk update/g" \
  -e "s/omx hooks/omk hooks/g" \
  -e "s/omx catalog/omk catalog/g" \
  -e "s/omx hud/omk hud/g" \
  -e "s/'omx'/'omk'/g" \
  -e 's/"omx"/"omk"/g' \
  -e "s/omx\.js/omk.js/g" \
  -e "s/omx-worker/omk-worker/g" \
  -e "s/omx-setup/omk-setup/g" \
  -e "s/OMX /OMK /g"

# Pass 5: tmux markers and injection tokens
echo "$TEXT_FILES" | xargs sed -i '' \
  -e 's/OMX:RUNTIME/OMK:RUNTIME/g' \
  -e 's/OMX:TEAM/OMK:TEAM/g' \
  -e 's/OMX:GUIDANCE/OMK:GUIDANCE/g' \
  -e 's/OMX_TMUX_INJECT/OMK_TMUX_INJECT/g' \
  -e 's/OMX_LANG_REMINDER/OMK_LANG_REMINDER/g' \
  -e 's/omx-worktrees/omk-worktrees/g' \
  -e "s/omx-config/omk-config/g"

# Pass 6: tmux session name prefix
echo "$TEXT_FILES" | xargs sed -i '' \
  -e 's/omx-\$/omk-\$/g' \
  -e "s/replace(\/\^omx-\//replace(\/\^omk-\//g"
```

**Step 2: Verify no stale OMX_ env vars remain (except in codex-specific contexts)**

```bash
grep -r 'OMX_' --include='*.ts' --include='*.js' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . | head -20
```

Expected: zero or near-zero hits (only if inside string literals describing the old project).

**Step 3: Verify .omx/ references are gone**

```bash
grep -r '\.omx/' --include='*.ts' --include='*.js' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . | head -20
```

Expected: zero hits (gitignore is handled separately).

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: bulk rename omx→omk, oh-my-codex→oh-my-kiro"
```

---

### Task 4: Update package.json manually

The bulk sed handles most of it, but verify and fix these fields:

**Step 1: Edit package.json**

- `"name": "oh-my-kiro"` (should be done by sed)
- `"description": "Multi-agent orchestration layer for Kiro CLI"` — update manually
- `"bin": { "omk": "bin/omk.js" }` — verify sed got this
- `"repository.url": "git+https://github.com/penghuo/oh-my-kiro.git"` — verify
- `"homepage": "https://penghuo.github.io/oh-my-kiro"` — verify
- `"bugs.url": "https://github.com/penghuo/oh-my-kiro/issues"` — verify
- `"keywords"`: replace `"codex", "openai"` with `"kiro", "kiro-cli"`
- `"author": "Peng Huo"` — update

**Step 2: Commit**

```bash
git add package.json && git commit -m "chore: update package.json metadata for oh-my-kiro"
```

---

### Task 5: Update .gitignore

**Step 1: Add .omk/ and .kiro/ entries, keep all existing entries**

Add to .gitignore:
```
.omk/
.kiro/
```

Keep existing: `.omc/`, `.omx/`, `.codex/`, `.claude/`, `.agents/`

**Step 2: Commit**

```bash
git add .gitignore && git commit -m "chore: add .omk/ and .kiro/ to gitignore"
```

---

### Task 6: Regenerate package-lock.json

**Step 1: Install dependencies**

```bash
cd /Users/penghuo/oss/oh-my-kiro
rm -f package-lock.json
npm install
```

**Step 2: Commit**

```bash
git add package-lock.json && git commit -m "chore: regenerate package-lock.json"
```

---

### Task 7: Build and verify

**Step 1: Build**

```bash
npm run build
```

Expected: clean compilation, no errors.

**Step 2: If build errors, fix remaining rename issues**

Common issues:
- Import paths referencing old filenames
- String literals in tests expecting old env var names
- Template strings with hardcoded `.omx/` paths

Fix each error, rebuild, repeat until clean.

**Step 3: Run tests**

```bash
npm run test:node
```

Expected: all tests pass (tests reference OMK_ env vars and .omk/ paths after the rename).

**Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve post-rename build/test issues"
```

---

### Task 8: Smoke test the CLI

**Step 1: Verify CLI launches**

```bash
node bin/omk.js --help
```

Expected: help text shows `omk` commands.

**Step 2: Verify doctor command**

```bash
node bin/omk.js doctor
```

Expected: runs without crash (some checks may fail if codex/kiro-cli not installed — that's fine).

**Step 3: Commit final state**

```bash
git add -A && git commit -m "feat: oh-my-kiro fork complete — omk CLI with kiro-cli worker support"
```
