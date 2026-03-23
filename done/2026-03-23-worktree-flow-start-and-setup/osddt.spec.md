# Spec: Fix Worktree Flow — Setup and Start

## Overview

The worktree workflow currently has two broken behaviours that prevent it from working correctly in practice:

1. **`osddt setup`** clones the bare repository into `.git` inside the current folder, which corrupts the directory structure and does not produce a proper working environment for `git worktree add`.
2. **`osddt start-worktree`** resolves the repo root via `git rev-parse --show-toplevel` from the current working directory — but in the bare-clone setup the current directory is never a git repository, so this always fails.

Additionally, after bare-clone setup there is no way for agents (Claude, Gemini) to access the project's agent instruction files (`CLAUDE.md`, `GEMINI.md`) because those files live inside the main/master worktree, not at the working directory root.

This feature corrects all three issues and adds package manager auto-install and state file elimination to make the worktree workflow functional end-to-end.

## Session Context

The following decisions were discussed and agreed during the session:

- The bare clone must go into a **`.bare` subfolder** of the current working directory (not `.git`).
- After cloning, a **main or master worktree** must be added immediately (via `git worktree add`) inside the `.bare` folder so the default branch is checked out and accessible.
- For each agent that was selected during setup, a **`CLAUDE.md` / `GEMINI.md`** file must be written at the working directory root pointing to the corresponding file inside the main/master worktree. Only files for selected agents are created.
- The `bare-path` must be saved in `.osddtrc` so that `start-worktree` and other commands can resolve the repo root without running `git rev-parse` from a non-git directory.
- `start-worktree` must read `bare-path` from `.osddtrc` and use it as the git repo root when running `git worktree add`.
- The **package manager** is detected once during `osddt setup` and saved in `.osddtrc`. `start-worktree` reads it and runs install automatically after creating each worktree.
- The **`.osddt-worktrees` state file is eliminated**. Worktree existence is checked via `git worktree list --porcelain` against `.bare`. The `workingDir` is derived on the fly from the worktree path and feature name using the naming convention `<worktreePath>/working-on/<featureName>`.

## Requirements

### Setup — bare clone

1. When `--worktree-repository <url>` is provided, `osddt setup` must clone the repository as a bare repo into `<cwd>/.bare`.
2. After cloning, `osddt setup` must detect the default branch (`main` or `master`) from the remote and add a worktree for it inside `.bare`, at `.bare/<default-branch>`.
3. `osddt setup` must save `"bare-path": "<cwd>/.bare"` in `.osddtrc`.

### Setup — package manager detection

4. During setup, `osddt setup` must detect which package manager the project uses and save it as `"packageManager"` in `.osddtrc`. Detection order: look for `pnpm-lock.yaml` → `yarn.lock` → `package-lock.json` inside the default-branch worktree (`.bare/<default-branch>`). If none found, default to `npm`.

### Setup — agent instruction files

5. After the worktree setup completes, pointer files are created **only for the agents selected during setup**:
   - If `claude` was selected: write `CLAUDE.md` at `<cwd>/CLAUDE.md` containing `@.bare/<default-branch>/CLAUDE.md`.
   - If `gemini` was selected: write `GEMINI.md` at `<cwd>/GEMINI.md` containing `@.bare/<default-branch>/GEMINI.md`.
   - If an agent was **not** selected, its pointer file is not created.
   - If the source file does not exist inside the worktree, the pointer file is still created (the `@`-import will simply resolve to a missing file — no error during setup).

### start-worktree — repo root resolution

6. `osddt start-worktree` must read `bare-path` from `.osddtrc` and use it as the git repo root for all git operations.
7. If `.osddtrc` does not contain `bare-path`, fall back to `git rev-parse --show-toplevel` (non-bare setups).
8. Worktree existence is checked by running `git worktree list --porcelain` against `bare-path` and looking for a worktree whose path ends with the feature name. No `.osddt-worktrees` state file is read or written.
9. After creating a new worktree, `start-worktree` must run the package manager install command (read from `"packageManager"` in `.osddtrc`) inside the new worktree directory. If `packageManager` is absent, skip install and print a reminder.
10. `workingDir` is derived as `<worktreePath>/working-on/<featureName>` — no state file is required.

### done — worktree cleanup

11. `osddt done --worktree` must locate the worktree path using `git worktree list --porcelain` against `bare-path` (same lookup as start-worktree) rather than reading `.osddt-worktrees`.

## Scope

### In scope

- `osddt setup`: clone into `.bare`, detect default branch, add default-branch worktree, detect package manager, write pointer `CLAUDE.md`/`GEMINI.md` per selected agent, save `bare-path` and `packageManager` in `.osddtrc`.
- `osddt start-worktree`: read `bare-path` from `.osddtrc`, use `git worktree list` instead of state file, run package manager install after worktree creation.
- `osddt done --worktree`: use `git worktree list` instead of state file.
- Removal of `.osddt-worktrees` state file reads/writes from all affected commands.

### Out of scope

- `osddt worktree-info`: keep as-is for now (reads state file; will be revisited separately).
- `osddt update` and template files.
- Support for default branch names other than `main` and `master`.
- Updating existing setups created before this fix.

## Acceptance Criteria

1. Running `osddt setup --worktree-repository <url>` in an empty directory creates a `.bare` folder containing the bare-cloned repository.
2. After setup, `.bare/main` (or `.bare/master`) exists as a checked-out worktree of the default branch.
3. After setup, `.osddtrc` contains `"bare-path"` and `"packageManager"` fields.
4. `CLAUDE.md` is created at `<cwd>/CLAUDE.md` only when `claude` was selected; `GEMINI.md` only when `gemini` was selected.
5. Running `osddt start-worktree <feature>` from the same directory successfully creates a new git worktree for the feature branch.
6. After `start-worktree`, the package manager install runs automatically inside the new worktree.
7. The feature worktree is placed at `<cwd>/<repo-name>-<feature>` (sibling of `.bare`).
8. No `.osddt-worktrees` file is created or read during `start-worktree` or `done --worktree`.
9. `osddt done --worktree` successfully removes the worktree using `git worktree list` to find its path.

## Decisions

1. **Pointer file format**: Use an `@`-import directive — e.g. `@.bare/main/CLAUDE.md`. Claude Code understands this natively; Gemini's `GEMINI.md` will use the same format.
2. **Default branch detection**: Read the default branch from the remote using `git remote show origin` after cloning (accurate, not guessed).
3. **Package manager install**: Run automatically after `git worktree add` in `start-worktree`. Package manager is detected during setup and stored in `.osddtrc` to avoid re-detection on every run.
4. **State file elimination**: Replace `.osddt-worktrees` with `git worktree list --porcelain` queries against `bare-path`. `workingDir` is derived on the fly as `<worktreePath>/working-on/<featureName>` — worktree name matches feature name by convention.
