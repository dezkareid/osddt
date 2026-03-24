# Spec: Fix `worktree-info` Command Issues

## Overview

The `worktree-info` CLI command has two bugs that surface when used with the `osddt.continue` agent template in worktree mode:

1. **`.bare` directory is listed as a feature worktree** — `listFeatureWorktrees` in `worktree.ts` does not filter out the bare repository entry, so `.bare` appears as a valid feature worktree. This causes the "multiple worktrees found" path to trigger spuriously.

2. **Error messages go to stderr instead of structured stdout** — When multiple worktrees are found and no feature name was provided, the command logs a human-readable list to `stderr` and exits with code 1. The `osddt.continue` template is designed to capture structured output and handle disambiguation itself (as other templates do), but instead receives prose error text it cannot parse.

## Requirements

1. The `worktree-info` command must exclude the `.bare` directory from the list of feature worktrees it reports or considers when deciding whether multiple worktrees exist.

2. When multiple feature worktrees are found and no `featureName` argument was given, `worktree-info` must output a machine-readable JSON response to **stdout** (exit code 1) containing the list of available feature worktrees, so that the calling agent can present the disambiguation choice to the user.

3. The JSON response for the "multiple worktrees" case must include enough information for the agent to list options and re-invoke the command with the chosen feature name (at minimum: `featureName` and `branch` for each entry).

4. The "no worktrees found" case must similarly output a structured JSON error to stdout rather than a prose message to stderr, so the agent can handle it consistently.

## Scope

**In scope:**
- Fix `.bare` filtering in `listFeatureWorktrees` (or in `worktree-info` command handler).
- Change the "multiple worktrees", "no worktrees", and "not-found" error paths in `worktree-info` to emit structured JSON to stdout.
- Update the `osddt.continue` template to parse the structured JSON errors and handle disambiguation interactively.
- Update tests for `worktree-info` and `listFeatureWorktrees` to cover the new behaviour.

**Out of scope:**
- Changes to any other commands that call `worktree-info` (`osddt.done`, `osddt.start`).
- Changes to `listFeatureWorktrees` behaviour for other callers.

## Acceptance Criteria

1. Running `npx osddt worktree-info` in a repo with a `.bare` directory and one feature worktree exits 0 and returns JSON for that single worktree — `.bare` is never listed.
2. Running `npx osddt worktree-info` in a repo with multiple feature worktrees (excluding `.bare`) exits 1 and writes to **stdout** a JSON object of the form:
   ```json
   { "error": "multiple", "worktrees": [{ "featureName": "...", "branch": "..." }, ...] }
   ```
3. Running `npx osddt worktree-info` with no worktrees exits 1 and writes to **stdout**:
   ```json
   { "error": "none" }
   ```
4. Running `npx osddt worktree-info <feature-name>` with a feature name that does not exist exits 1 and writes to **stdout**:
   ```json
   { "error": "not-found", "featureName": "..." }
   ```
5. All existing and new tests pass.

## Open Questions

_(none)_
