# Spec: Fix continue workflow for worktrees

## Overview

The `osddt.continue` command (and any other command that needs to locate a feature's working directory) fails to find the `working-on/` folder when the repository uses a bare-clone + worktree setup. Instead of searching inside the feature's worktree directory, the agent searches inside the main worktree (e.g. `.bare/main/`), which never contains any `working-on/` folder.

The root cause is that `osddt continue` resolves the project path from `.osddtrc` as though it is a standard (non-worktree) repository. In a bare-clone setup the `.osddtrc` is read from the current working directory — which is the main worktree — so the working directory lookup starts from the main worktree root instead of the feature worktree root.

The `npx osddt worktree-info <feature-name>` CLI command already returns the correct `workingDir` for a registered feature. The `osddt.continue` template already documents that it should call `worktree-info` when `worktree-repository` is present in `.osddtrc`. The bug is that the agent does not have a feature name at the point where it reads `.osddtrc` (when no arguments are provided), so it falls through to the standard path-resolution logic before it has a chance to call `worktree-info`.

## Requirements

1. When `worktree-repository` is present in `.osddtrc` **and** no feature name argument is provided, the agent must use `npx osddt worktree-info` (without a feature name argument) to enumerate all active worktrees and let the user select one, rather than listing folders under the main worktree's `working-on/` path.
2. When `worktree-repository` is present and a feature name **is** provided, the agent must call `npx osddt worktree-info <feature-name>` and use the returned `workingDir` — the current behaviour is already correct for this case, but must be preserved.
3. When `worktree-repository` is **absent**, the existing standard path-resolution logic must be unchanged.
4. When `worktree-info` exits with code 1 (feature not found in any worktree), the agent must fall back to the standard `working-on/` lookup in the main project path — the same fallback documented in the existing template.
5. The fix is scoped to the `osddt.continue` command template only.

## Scope

**In scope**
- Updating the `osddt.continue` template instruction set to resolve the working directory via `worktree-info` when in worktree mode and no feature name is supplied.
- No changes to `osddt.done`, `osddt.implement`, or `osddt.tasks` — those are only invoked after context is already loaded.
- No changes to the `worktree-info` CLI command itself (it already supports the no-argument case and returns a selection prompt).

**Out of scope**
- Changes to the TypeScript CLI source (unless a gap in `worktree-info`'s no-argument JSON output is discovered during implementation).
- Changes to setup, start-worktree, or any other templates not affected by the path-resolution bug.

## Acceptance Criteria

1. Running `/osddt.continue` (no arguments) in a bare-clone worktree repository with an active feature worktree successfully locates the `working-on/<feature-name>/` folder inside the feature worktree and reports the correct phase.
2. Running `/osddt.continue <feature-name>` in a bare-clone worktree repository resolves the working directory via `worktree-info` and reports the correct phase.
3. Running `/osddt.continue` in a standard (non-worktree) repository is unaffected — the existing listing of `working-on/` folders under the main project path continues to work.
4. When multiple active worktrees exist and no argument is provided, `worktree-info` lists them and the user can select one; the selected working directory is then used.
5. When `worktree-info` returns exit code 1 for a given feature name, the agent falls back to the standard path and does not error out unexpectedly.

## Decisions

1. **Scope of fix**: Only `osddt.continue` is patched. `osddt.implement` and `osddt.tasks` are only invoked after context is already loaded, so they don't need worktree path resolution.
2. **worktree-info invocation context**: The agent always runs commands from the main worktree where `.osddtrc` (and its `bare-path` key) lives. `npx osddt worktree-info` will always resolve correctly from that location. No CLI changes needed.
