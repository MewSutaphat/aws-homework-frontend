---
name: git-commit-and-merge
description: |
  Use this skill whenever the user wants to commit code changes to Git and merge into the develop branch.
  Trigger this skill when the user says: commit, commit message, git commit, สร้าง commit, เขียน commit,
  merge to develop, merge เข้า develop, push ขึ้น develop, ส่งโค้ด, บันทึกการเปลี่ยนแปลง, เซฟโค้ด,
  or any variation of "I want to save/commit my changes".

  This skill will:
  1. Analyze what changed (git diff) and generate a Conventional Commit message
  2. Show the proposed message to the user for approval
  3. Stage and commit the changes on the current branch
  4. Merge the commit into the `develop` branch
  5. Stop — remind the user to push manually (which triggers auto-deploy to S3 via GitHub Actions)

  Works together with the `s3-deploy-github-actions` skill: pushing develop triggers the S3 deployment workflow automatically.
---

# Git Commit and Merge to Develop

This skill handles the full flow from "I made changes" to "ready to deploy" — stopping just before `git push` so the user stays in control of when changes go live.

The reason for stopping before push is deliberate: the `s3-deploy-github-actions` workflow fires the moment `develop` is pushed. Giving the user that one manual step prevents accidental deploys.

## The Workflow (5 steps)

```
1. Analyze changes (git status + git diff)
      ↓
2. Generate & confirm commit message
      ↓
3. Stage + commit on current branch
      ↓
4. Merge into develop
      ↓
5. Remind user to push → S3 auto-deploys
```

---

## Step 1 — Analyze the Changes

Run these to understand what changed:

```bash
git status
git diff HEAD          # shows all changes (staged + unstaged)
git diff --staged      # staged only
git diff               # unstaged only
```

Look at:
- Which files changed
- What kind of change (new feature, bug fix, style tweak, config change, etc.)
- Which component/module is affected (infer a scope from the file path)

If nothing is staged yet, that's fine — you'll stage everything in step 3 (or ask the user if they want to stage selectively).

---

## Step 2 — Generate the Commit Message

Use **Conventional Commits** format: `type(scope): short description`

### Type selection guide

| What changed | Type |
|---|---|
| New feature or capability | `feat` |
| Bug fix | `fix` |
| Code restructure, no behavior change | `refactor` |
| Styling / CSS / layout only | `style` |
| Build config, deps, tooling | `build` |
| Tests added/updated | `test` |
| Docs, comments, README | `docs` |
| Anything else (chore, cleanup) | `chore` |

### Scope — infer from file paths

| File path pattern | Scope suggestion |
|---|---|
| `src/components/Login*` | `(auth)` or `(login)` |
| `src/components/Header*` | `(layout)` |
| `src/views/Dashboard*` | `(dashboard)` |
| `src/store/*` or `src/composables/*` | `(state)` |
| `src/router/*` | `(router)` |
| `.github/workflows/*` | `(ci)` |
| `tailwind.config*`, `vite.config*` | `(config)` |
| Multiple unrelated files | omit scope |

### Message rules

- Subject line: imperative mood, lowercase, no period, max 72 chars
- If the change has meaningful context (why it was done), add a blank line + body
- Don't fabricate details — if you're unsure, keep it brief

**Good examples:**
```
feat(auth): add responsive login form with PrimeVue
fix(layout): correct sidebar overflow on mobile
style(dashboard): apply Tailwind breakpoints to card grid
build(ci): add GitHub Actions workflow for S3 deploy
refactor(login): extract form validation to composable
```

**Bad examples:**
```
updated files          ← too vague
Fixed bug              ← no type, capitalized
feat: changes          ← meaningless description
```

### Show the message to the user before committing

Present the proposed message clearly and ask for approval:

```
Proposed commit message:

  feat(auth): add responsive login form with PrimeVue

Does this look right? Say "yes" to proceed, or tell me what to change.
```

Wait for confirmation. If the user suggests a different message, use theirs.

---

## Step 3 — Stage and Commit

Once the message is approved:

```bash
# Stage everything (default — appropriate for most commits)
git add -A

# Or stage specific files if the user asked for selective staging:
git add <file1> <file2>

# Commit
git commit -m "feat(auth): add responsive login form with PrimeVue"
```

If there's nothing to commit (clean working tree), tell the user and stop.

If there are untracked files that look like they should NOT be committed (`.env`, `.DS_Store`, large binary files, `node_modules/`), mention them and skip them. Don't add them unless the user explicitly says to.

---

## Step 4 — Merge into Develop

```bash
# Save current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Switch to develop
git checkout develop

# Always create a merge commit (never fast-forward)
# Generate a merge commit message in the format:
#   Merge branch '<branch>' into develop
git merge "$CURRENT_BRANCH" --no-ff -m "Merge branch '$CURRENT_BRANCH' into develop"

# Go back to the feature branch so the user can keep working
git checkout "$CURRENT_BRANCH"
```

If the merge has conflicts, stop and tell the user exactly which files conflict and what they need to do:

```
❌ Merge conflict in: src/components/Login.vue

You need to resolve this manually:
1. Open the file and look for <<<<<<< HEAD markers
2. Edit to keep the version you want
3. Run: git add src/components/Login.vue
4. Run: git merge --continue
Then come back and I can handle the push reminder for you.
```

---

## Step 5 — Remind User to Push

After a successful merge, print this clearly:

```
✅ Committed and merged to develop.

To deploy to S3, push the develop branch:

  git push origin develop

This will trigger the GitHub Actions workflow which:
  → Verifies AWS credentials
  → Builds the project
  → Syncs to S3
  → (Optionally) Invalidates CloudFront cache

The push is intentionally manual — you control when it goes live.
```

Also show the current branch they're on so they know where they're working:

```
You're back on: feature/use-framework-css
```

---

## Edge Cases

**Already on develop:** If the user is already on `develop`, just commit directly — no merge step needed. Still stop before push.

**Detached HEAD:** Ask the user to check out a named branch first.

**Nothing staged, nothing unstaged:** Tell the user the working tree is clean and there's nothing to commit.

**Merge already up-to-date:** If develop already has the changes (e.g., already merged), tell the user and skip the merge step.

**User wants to squash commits before merging:** Mention `git merge --squash` as an option if they have multiple messy commits they want to clean up.
