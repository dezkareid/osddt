# Spec: Fix Done Workflow — Commit Before Worktree Removal

## Overview

When finishing a worktree-based feature with `osddt.done`, the agent is instructed to commit and push changes **before** removing the worktree. However, in practice agents have been running the git status check and the `osddt done --worktree` command in parallel, which removes the worktree before uncommitted changes can be detected or saved. This causes permanent, silent data loss — work done inside the worktree is gone with no way to recover it.

The fix must make the correct ordering impossible to get wrong, by moving the commit and push steps into the `osddt done` CLI command itself (before removing the worktree), so the sequence is enforced by the tool rather than relying solely on agent instruction-following.

## Requirements

1. When `osddt done <feature> --worktree` is run, the CLI must detect uncommitted changes inside the worktree **before** removing it.
2. If uncommitted changes are detected, the CLI must abort with a clear error message instructing the user to commit or stash changes first.
3. The worktree must only be removed after the working-on folder has been moved **and** the worktree is clean (no uncommitted changes).
4. The `osddt.done` agent template must be updated so it no longer runs `git status` and `osddt done --worktree` concurrently or in ambiguous order — the template must make the safe sequence unambiguous.
5. The template must still guide the agent to commit and push before invoking `osddt done --worktree`, but the CLI provides a safety net if the agent skips or reorders steps.

## Scope

**In scope:**
- Adding an uncommitted-changes guard to the `done` CLI command (worktree path only).
- Updating the `osddt.done` agent template to make the commit-before-done ordering explicit and unambiguous.
- Ensuring the guard produces a user-readable error message that tells the user what to do.

**Out of scope:**
- Automatically committing changes from within the CLI (the CLI should not make commit message decisions).
- Changing the standard (non-worktree) done workflow.
- Adding push enforcement to the CLI.

## Acceptance Criteria

1. Running `osddt done <feature> --worktree` when the worktree has uncommitted changes exits with a non-zero code and prints an error such as: `"Error: Worktree has uncommitted changes. Commit or stash them before running osddt done."` — and does **not** move or delete anything.
2. Running `osddt done <feature> --worktree` when the worktree is clean proceeds as before: moves the working-on folder, removes the worktree.
3. The `osddt.done` template, when read end-to-end, makes it impossible to misread the commit step as optional or parallelisable with `osddt done --worktree`.
4. Existing tests for `done.ts` continue to pass. New tests cover the uncommitted-changes guard (both the dirty and clean cases).

## Open Questions

None.
