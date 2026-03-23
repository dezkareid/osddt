# Spec: Fix `osddt.continue` Feature Selection in Worktree Mode

## Overview

Two related bugs exist in the `osddt.continue` flow when no feature name argument is provided:

**Bug 1 — Interactive prompt in `worktree-info` CLI:**
`npx osddt worktree-info` (without arguments) calls an interactive `readline` prompt when multiple worktrees exist. AI agents cannot respond to interactive prompts, so the command hangs. The CLI must instead print the list and exit with a non-zero code, leaving selection to the caller.

**Bug 2 — Wrong directory scanned by `osddt.continue` template in worktree mode:**
When `worktree-repository` is present in `.osddtrc` and no arguments are given, the `osddt.continue` template runs `npx osddt worktree-info` without arguments. If that call fails (or falls through), the template falls back to the standard block which scans `<project-path>/working-on/` — the **main repo root**, not the worktree's project path. Working directories for worktree features live inside each worktree, not in the main repo root.

Both bugs surface during the "no arguments, multiple features" case in worktree mode, but each has its own fix.

## Requirements

### `worktree-info` CLI (Bug 1)

1. When called without a feature name argument and multiple worktrees exist, `worktree-info` **must not** use interactive `readline` selection.
2. Instead it must print the list of available feature worktrees (feature name and branch) to stderr and exit with code `1`.
3. When called without a feature name argument and exactly one worktree exists, the existing auto-select behaviour (exit 0, print JSON) is unchanged.
4. When called without a feature name argument and no worktrees exist, the existing error behaviour (exit 1, print error message) is unchanged.

### `osddt.continue` template (Bug 2)

5. In worktree mode with no arguments, the template must call `npx osddt worktree-info` without arguments to discover available features.
   - exit code **0** (one worktree auto-selected): use the returned `workingDir` directly.
   - exit code **1** (multiple or no worktrees): read the list printed by `worktree-info` and present it to the user as a formatted list, then stop and instruct the user to re-run with the chosen feature name (e.g. `/osddt.continue <feature-name>`).
6. The template must **not** fall back to scanning `<project-path>/working-on/` in worktree mode when `worktree-info` returns no selection — that path belongs to the main repo root, not any worktree.
7. The standard mode (no `worktree-repository`) multi-folder path must also display the list non-interactively and stop, not prompt.

## Scope

**In scope:**
- Changing `worktree-info.ts`: replace the interactive `selectWorktree()` call with a non-interactive list-and-exit behaviour.
- Updating the `osddt.continue` command template in `shared.ts`:
  - Clarify the worktree-mode no-argument path to handle `worktree-info` exit code 1 by displaying the list and stopping (not falling through to the standard block).
  - Clarify the standard-mode multi-folder path to display the list and stop (not prompt interactively).

**Out of scope:**
- Changes to any other CLI commands or templates.
- Changes to how `.osddtrc` or the worktree state file are written.
- Adding new CLI flags or output formats beyond what is needed for the fix.

## Acceptance Criteria

1. Running `npx osddt worktree-info` (no args) with multiple worktrees prints the list to stderr and exits with code `1` — no interactive prompt.
2. The `osddt.continue` template in worktree mode, when `worktree-info` exits with code `1`, shows the user the available features and instructs them to re-run with a specific feature name — it does **not** fall through to the standard `working-on/` scan.
3. The `osddt.continue` template in standard mode, when multiple `working-on/` folders exist, displays the list and stops — it does **not** use interactive language ("ask them to pick one").
4. Single-worktree and no-worktree paths for `worktree-info` remain unchanged.
5. Single-folder and no-folder paths for standard mode remain unchanged.
6. All existing unit and template tests pass after the changes.
