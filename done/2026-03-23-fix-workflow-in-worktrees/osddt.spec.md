# Spec: Fix Worktree Workflow Issues in `done` Command

## Overview

The `osddt done` command has two bugs when used in the worktree workflow that cause it to fail or behave incorrectly:

1. **Wrong working directory lookup**: When `--dir <package>` is passed, `done` looks for `working-on/<feature>` inside that package directory. But in the worktree workflow, the working directory lives inside the worktree path — not in the current repo's package directory — so the path check fails with "does not exist".

2. **`worktree-info` reads a state file that is never written**: `start-worktree` never writes a `.osddt-worktrees` state file. `worktree-info` reads from this file and exits with code 1 when it's absent, making it unreliable. The solution is to derive worktree information directly from `git worktree list`.

Additionally, two improvements are needed:

3. **Main branch not stored in `.osddtrc`**: `start-worktree` creates new worktrees but has no reliable way to know which branch is the main branch (could be `main` or `master`). `setup` should prompt for and store the main branch name so other commands can use it.

4. **No feature selection when feature name is omitted**: When multiple worktrees exist, `worktree-info` and `done --worktree` need a way to identify which feature to act on. The feature name is resolved in order: (a) use the argument if provided, (b) infer from the current branch name. Only if both fail should the user be shown a list of active worktrees (excluding the main/master worktree) and asked to pick one.

## Requirements

1. `osddt setup` must persist the detected default branch as `"mainBranch"` in `.osddtrc` when the worktree workflow is enabled (i.e. when `worktree-repository` is provided). No new prompt or flag is needed — `detectDefaultBranch()` already resolves it.
2. `osddt start-worktree` must use the stored `mainBranch` as the base branch when creating a new worktree (instead of implicitly using whatever branch is current).
3. `osddt worktree-info <feature-name>` must use `git worktree list` to locate the worktree by feature name, then derive `workingDir` from the worktree path. No state file is needed.
4. When listing worktrees (for selection or output), the main/master worktree must be excluded from the list.
5. `osddt done <feature-name> --worktree` must locate `working-on/<feature-name>` using the git-derived worktree path, ignoring `--dir`.
6. When `--dir` is supplied alongside `--worktree`, it must not override the worktree-derived working directory; `--dir` only affects non-worktree invocations.

## Scope

**In scope**
- `osddt setup`: persist the already-detected default branch as `"mainBranch"` in `.osddtrc` (no new prompt or flag needed)
- `start-worktree`: read `mainBranch` from `.osddtrc` and use it as the base when creating worktrees
- `worktree-info`: rewrite to use `git worktree list`, filter out the main worktree, derive `workingDir`
- `done --worktree`: resolve working directory from git-derived worktree path, ignore `--dir`
- Feature selection UI: only when the feature name cannot be resolved (not passed as argument, and current branch doesn't match a known worktree), present an interactive list excluding the main branch worktree

**Out of scope**
- Changes to non-worktree (`done` without `--worktree`) path resolution
- Changes to `update`, `meta-info`, or template files
- Removing the `.osddt-worktrees` state file parsing code from `worktree-info` (can be deleted as dead code)

## Acceptance Criteria

1. After `osddt setup` with `--worktree-repository`, `.osddtrc` contains a `"mainBranch"` key matching the detected default branch (`main`, `master`, or whatever `detectDefaultBranch()` returned).
2. `osddt start-worktree <feature-name>` creates the new worktree branching off `mainBranch`, not the currently checked-out branch.
3. `osddt worktree-info <feature-name>` returns exit code 0 and valid JSON (with `worktreePath`, `workingDir`, `branch`) by reading `git worktree list` — no `.osddt-worktrees` file required.
4. `osddt worktree-info` (or any listing step) never shows the main/master worktree entry to the user.
5. `osddt done <feature-name> --worktree` succeeds regardless of whether `--dir` is passed, using the worktree path from `git worktree list`.
6. `osddt done <feature-name> --dir <path>` (without `--worktree`) continues to work exactly as before.
7. All existing tests pass; new/updated tests cover: `mainBranch` written by setup, worktree base branch usage in `start-worktree`, git-based resolution in `worktree-info`, and worktree path resolution in `done --worktree`.

## Decisions

1. **State file**: The `.osddt-worktrees` state file approach is dropped entirely. Worktree information is derived directly from `git worktree list` — no file needs to be written or read.
2. **`worktree-info`**: Must use `git worktree list` (via `findWorktreeByFeature`) to locate the worktree path, then derive `workingDir` from it. No state file dependency.
3. **`done --worktree`**: Must ignore `--dir` and use the git-derived worktree path to locate `working-on/<feature>`.
4. **Main branch in `.osddtrc`**: `setup` already detects the default branch via `detectDefaultBranch()` and creates a worktree for it, but never saves it to `.osddtrc`. The fix is simply to persist it as `"mainBranch"` — no new prompt or flag needed, the value is already available at setup time.
5. **Feature selection**: Only triggered as a last resort — first try the provided argument, then infer from the current branch. Only if both fail is the user shown a filtered list (main worktree excluded) to select from interactively.
