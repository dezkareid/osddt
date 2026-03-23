# Spec: Enable Worktree Workflow

## Overview

Currently, OSDDT's `osddt.start` command checks out a new branch in the main working tree, meaning only one feature can be actively worked on at a time. This feature adds support for **git worktrees**, allowing users to run multiple features in parallel — each in its own isolated directory — without switching branches or losing context.

By integrating worktree creation into the `osddt.start` workflow, developers can open multiple editor windows simultaneously, each targeting a different feature branch, dramatically increasing productivity on multi-feature work.

## Requirements

1. A new `osddt.start-worktree` agent template and matching `osddt start-worktree` CLI command mirror `osddt.start` / `osddt start` but create a git worktree instead of switching the current branch. Template and CLI command names are kept identical to avoid confusion.
2. The worktree is created as a sibling of the repo root, named `<repo-name>-<feature-name>` (e.g. `../osddt-enable-worktree`).
3. The `working-on/<feature-name>/` planning folder is created inside the worktree so all feature artifacts are co-located with the code.
4. In a monorepo, `working-on/` is placed under the selected package path within the worktree.
5. `osddt.start-worktree` writes an entry to a `.osddt-worktrees` file **sibling to the repo root** (e.g. `../.osddt-worktrees`) recording the feature name, branch, worktree path, and working directory path.
6. If a worktree for the feature already exists (detected via `.osddt-worktrees` or filesystem), the user is offered the same **Resume** / **Abort** choice as with branches and working directories.
7. Before removing a worktree, `osddt.done` checks for uncommitted changes inside it. If any are found, the agent inspects the diff, proposes a commit message based on the changes, asks the user to confirm or provide their own message, commits, and pushes the branch to remote. If there are no uncommitted changes but the branch has unpushed commits, it pushes those too.
9. `osddt.done` reads `.osddt-worktrees` to locate the worktree, archives the planning folder, removes the worktree via `git worktree remove`, and removes the entry from `.osddt-worktrees`.
8. `osddt.continue` reads `.osddt-worktrees` first to resolve the working directory for worktree-based features; falls back to the main tree scan for non-worktree features.
9. `.osddtrc` may optionally store a `worktreeBase` path so teams can standardise where worktrees are created; it falls back to the sibling-of-repo-root default if absent.
10. A new `osddt setup-worktree` CLI command validates the environment before using the worktree workflow (git version, permissions, writability of the target directory).

## Scope

### In Scope
- New `osddt.start-worktree` agent template and `osddt start-worktree` CLI command as a worktree-based alternative to `osddt.start` / `osddt start`.
- New `osddt setup-worktree` CLI command to validate the environment before using the worktree workflow.
- Worktree created as a sibling of the repo root at `../<repo-name>-<feature-name>` (overridable via `worktreeBase` in `.osddtrc`).
- `working-on/<feature-name>/` created inside the worktree (under the package path for monorepos).
- `.osddt-worktrees` state file written **sibling to the repo root** (e.g. `../.osddt-worktrees`) by `osddt start-worktree`; read by `osddt.continue` and `osddt.done`; entry removed by `osddt.done`.
- `osddt.done` commits and pushes the worktree branch (with user-confirmed or agent-proposed commit message) before archiving and removing the worktree.
- `.osddtrc` gains an optional `worktreeBase` field.
- `osddt.continue` resolves the working directory via `.osddt-worktrees` for worktree features, main tree scan otherwise.

### Out of Scope
- Support for agents other than Claude in this iteration (Gemini template changes may follow).
- Managing multiple simultaneous worktrees in bulk (list, prune all, etc.).
- IDE/editor integration (opening the worktree in a new window automatically).

## Acceptance Criteria

1. Running `osddt.start-worktree <feature>` (template) calls `osddt start-worktree <feature>` (CLI), creates a git worktree on the new branch at the sibling path, places the `working-on/<feature-name>/` folder inside it, and writes an entry to `.osddt-worktrees`.
2. `.osddt-worktrees` lives sibling to the repo root (e.g. `../.osddt-worktrees`) and contains at minimum: `featureName`, `branch`, `worktreePath`, `workingDir` for each active worktree feature.
3. Running `osddt.start` behaves exactly as today — no regression.
4. If a worktree already exists for the feature (via `.osddt-worktrees` or filesystem), the user is prompted to Resume or Abort.
5. For worktree features, before archiving, `osddt.done` checks for uncommitted changes (`git status`) inside the worktree. If found, it inspects `git diff`, proposes a commit message derived from the changes, presents it to the user for confirmation or override, commits with conventional commit format, and pushes the branch. If there are no uncommitted changes but there are unpushed commits, it pushes without committing.
6. `osddt.done` reads `.osddt-worktrees`, moves `working-on/<feature-name>/` to `done/`, runs `git worktree remove`, and removes the entry from `.osddt-worktrees`.
7. `osddt.continue <feature>` checks `.osddt-worktrees` first; if found, uses the recorded `workingDir`; otherwise falls back to the main tree.
8. If `.osddtrc` contains `worktreeBase`, that path is used; otherwise the default sibling path is used.
9. Running `osddt setup-worktree` reports a pass/fail result for each environment check (git version, not-a-worktree, writable target directory).
10. All existing `osddt.start` tests continue to pass.

## Decisions

1. **Default worktree location**: Sibling of the repo root — e.g. `../osddt-enable-worktree`. Clean and fully isolated from the main tree.
2. **Opt-in mechanism**: A new `osddt.start-worktree` template and matching `osddt start-worktree` CLI command are introduced. Names are kept identical between template and CLI to avoid confusion.
3. **`osddt.done` cleanup**: `osddt.done` automatically removes the worktree via `git worktree remove` after archiving the planning folder.
4. **Monorepo behaviour**: In a monorepo, `working-on/` goes under the selected package path within the worktree (e.g. `../osddt-feature/packages/my-package/working-on/feature-name/`).
5. **Worktree state file**: `osddt.start-worktree` writes a `.osddt-worktrees` file (JSON array) **sibling to the repo root** (e.g. `../.osddt-worktrees`). Each entry records `featureName`, `branch`, `worktreePath`, and `workingDir`. `osddt.continue` and `osddt.done` read this file to resolve paths; `osddt.done` removes the entry on completion.
6. **Commit & push on done**: `osddt.done` (template) handles commit and push before calling the CLI. The agent inspects the diff, proposes a commit message in conventional commit format, asks the user to confirm or provide their own, then commits and pushes. This is a template-level responsibility (not CLI), since it requires interactive user input.
