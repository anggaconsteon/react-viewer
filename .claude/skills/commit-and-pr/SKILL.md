---
name: commit-and-pr
description: Stage, commit, push the current branch, and open a GitHub pull request in one flow. Use when the user says "commit and PR", "commit dan PR", "push and make a pull request", or similar.
when_to_use: Use whenever the user asks to commit current work AND open/create a pull request for it (any phrasing, English or Indonesian).
allowed-tools: Bash, Read, Grep, Glob
---

# Commit and PR

One-shot workflow: stage → commit → push → open PR. Mirrors the system git/PR conventions; this skill just chains them so the user can trigger it with a single phrase.

## Preconditions

- `gh` must be authenticated. If PATH lacks `gh`, use the full path `C:\Program Files\GitHub CLI\gh.exe`.
- Check auth once: `& "C:\Program Files\GitHub CLI\gh.exe" auth status`. If not logged in, STOP and tell the user to run:
  `! & "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol ssh --web`

## Steps

1. **Inspect** (parallel): `git status`, `git diff` (staged+unstaged), `git log --oneline -10`, and `git rev-parse --abbrev-ref HEAD`. Determine base branch (`main` unless told otherwise).
2. **Stage** specific files by name — never `git add -A`/`.`. Skip secrets (`.env`, credentials). If unrelated untracked files exist, leave them.
3. **Commit** via HEREDOC, message focused on *why*, ending with:
   `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`
   - If a pre-commit hook fails: fix the cause, re-stage, make a NEW commit (never `--amend`, never `--no-verify`).
4. **Push**: `git push -u origin <current-branch>`. Never force-push.
5. **Create PR**:
   ```
   & "C:\Program Files\GitHub CLI\gh.exe" pr create --base <base> --title "<short title <70 chars>" --body "$(cat <<'EOF'
   ## Summary
   <2-3 bullets>

   ## Test Plan
   - [ ] <verification>
   EOF
   )"
   ```
   Title summarizes ALL commits on the branch, not just the latest.
6. **Return the PR URL** to the user.

## Rules

- Only commit when the user asked (they did, by invoking this).
- Analyze every commit on the branch since it diverged from base — title/body reflect the whole branch.
- Caveman mode: chat terse, but the commit message + PR body are written normally.
- If on `main`/`master`, STOP and ask for a feature branch name before committing.
