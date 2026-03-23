# Spec: Unified Setup and Start Flow for Worktrees

## Overview

Currently OSDDT requires users to run two separate commands before using the worktree workflow: `osddt setup` (to generate agent command files and write `.osddtrc`) and `osddt setup-worktree` (to validate the git environment and initialise the `.osddt-worktrees` state file). Similarly, starting a feature requires choosing between two separate agent templates: `/osddt.start` (for standard branch-based development) and `/osddt.start-worktree` (for parallel worktree-based development).

This creates unnecessary friction: users must know upfront whether they want worktrees, run an extra validation step, and mentally track two parallel command surfaces that do the same job in slightly different contexts.

The goal is to consolidate the setup phase into a single `osddt setup` command that handles both standard and worktree configuration, and to provide a single `osddt.start` entry point that transparently supports both workflows.

## Session Context

From the conversation session:
- The recent work already made `setup-worktree` initialise the `.osddt-worktrees` state file on success.
- The `start-worktree` template was updated to read `.osddtrc` and navigate into the worktree directory — but it will now be removed entirely and its behaviour merged into `osddt.start`.
- The motivation is to reduce the number of commands a user must learn and run, not to remove worktree support.
- When using worktrees the user is **not** working inside the repository — detecting the remote URL from `git remote` is therefore unreliable. The URL must always be supplied explicitly.
- The field name is `"worktree-repository"` and its value is the plain repository URL (no prefix). Its presence is the sole worktree indicator.

## Requirements

1. **Single setup command**: Running `osddt setup` must be sufficient to configure both the standard and the worktree workflows — no separate `osddt setup-worktree` step should be required.
2. **Repository URL as the worktree switch**: `osddt setup` must ask (or accept a flag `--worktree-repository <url>`) for the remote repository URL. Providing a URL enables worktree mode; omitting it keeps the standard workflow.
3. **URL is the source of truth**: The `"worktree-repository"` field in `.osddtrc` holds the plain repository URL. Its presence is the sole indicator that worktree mode is active. All commands that check workflow mode must read this field.
4. **Single start entry point**: The agent-facing `osddt.start` command template must read `.osddtrc` and, based on whether `"worktree-repository"` is present, transparently use either the worktree workflow or the standard branch workflow — without prompting the user to choose.
5. **Backward compatibility**: Projects that do not use worktrees must not be affected. The existing `osddt setup` non-interactive flags (`--agents`, `--repo-type`) must continue to work.
6. **Config persistence**: The repository URL must be saved in `.osddtrc` as `"worktree-repository": "<url>"` so that `osddt start-worktree` and other commands can use it without re-prompting.
7. **State file lifecycle**: The `.osddt-worktrees` state file must be created during setup (when `--worktree-repository` is provided) and must not be created otherwise.
8. **Documentation update**: `README.md` and `AGENTS.md` must be updated to reflect the new `.osddtrc` shape, the unified `osddt.start` behaviour, the removal of `osddt setup-worktree` and `osddt.start-worktree`, and the new `--worktree-repository <url>` flag.

## Scope

### In scope
- Merging the setup phase: `osddt setup` absorbs the environment checks and state-file initialisation currently in `osddt setup-worktree`.
- Adding `--worktree-repository <url>` to `osddt setup` as the non-interactive worktree flag; adding a corresponding URL prompt in interactive mode.
- Persisting the URL as `"worktree-repository": "<url>"` in `.osddtrc`.
- Merging the `osddt.start-worktree` agent template into `osddt.start`: the unified template reads `.osddtrc` and routes to the worktree or standard flow transparently.
- Removing the `osddt.start-worktree` template file from all agent command directories.
- Removing `osddt setup-worktree` from the CLI (its logic is absorbed into `osddt setup`).
- Updating `README.md` and `AGENTS.md` to reflect all changes.

### Out of scope
- Removing the `start-worktree` CLI command (`osddt start-worktree`) — it remains as the underlying mechanism invoked by the unified `osddt.start` template.
- Changing how `osddt done` or `osddt continue` resolve worktree paths (they already read `.osddt-worktrees`).
- Modifying the Gemini template surface (can be done in a follow-up).

## Acceptance Criteria

1. A user running `osddt setup` in interactive mode is asked for the remote repository URL (optional). Providing a URL enables worktree support: environment checks run and `.osddt-worktrees` is initialised. Leaving it blank skips worktree setup.
2. `osddt setup --worktree-repository <url>` enables worktree support non-interactively; omitting the flag keeps the standard workflow.
3. After setup with a URL provided, `.osddtrc` contains `"worktree-repository": "<url>"`. After setup without a URL, the field is absent.
4. Running `/osddt.start` when `"worktree-repository"` is present in `.osddtrc` automatically uses the worktree workflow (calls `osddt start-worktree` under the hood) — no user prompt.
5. Running `/osddt.start` when `"worktree-repository"` is absent uses the standard branch workflow (same behaviour as today).
6. The `osddt.start-worktree` template file no longer exists in any agent command directory after this change.
7. Users do not need to know about or run `osddt setup-worktree` or `/osddt.start-worktree` to use worktrees.
8. Existing projects whose `.osddtrc` has no `"worktree-repository"` field continue to work as before.
9. `README.md` and `AGENTS.md` accurately document the new `.osddtrc` shape, the `--worktree-repository <url>` flag, the unified `osddt.start` behaviour, and the removal of `osddt setup-worktree` and `osddt.start-worktree`.

## Decisions

1. **Field name and shape**: `"worktree-repository": "<url>"` — a plain URL string. The field name is self-documenting. No prefix on the value, no separate boolean field.
2. **`osddt setup-worktree` fate**: Remove entirely from the CLI — its logic is absorbed into `osddt setup`.
3. **`/osddt.start` mode selection**: Always determined by `.osddtrc` at setup time, never prompted at start time.
4. **Remote URL detection**: Always prompt explicitly — auto-detecting from `git remote` is unreliable because worktree setup runs outside the repository.
5. **Documentation**: `README.md` and `AGENTS.md` must be updated as part of this feature, not deferred.
