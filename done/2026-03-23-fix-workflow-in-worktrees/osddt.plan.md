# Plan: Fix Worktree Workflow Issues in `done` Command

## Architecture Overview

Four targeted changes across three files:

1. **`src/commands/setup.ts`** — persist `mainBranch` to `.osddtrc` after `detectDefaultBranch()` runs
2. **`src/commands/start-worktree.ts`** — read `mainBranch` from `.osddtrc` and pass it as the base branch to `git worktree add`
3. **`src/commands/worktree-info.ts`** — rewrite to use `git worktree list` (via `findWorktreeByFeature` from `utils/worktree.ts`) instead of the state file; derive `workingDir` from the worktree path; support feature selection when name is ambiguous
4. **`src/commands/done.ts`** — when `--worktree` is set, resolve the working directory from the git-derived worktree path, ignoring `--dir`

A new shared helper `listFeatureWorktrees(barePath, mainBranch)` will be extracted to `src/utils/worktree.ts` — it runs `git worktree list --porcelain`, parses the output, and returns all worktree entries except the one matching `mainBranch`. This is shared by `worktree-info` and `done --worktree`.

No new CLI flags, no new files (beyond tests), no state file.

## Implementation Phases

### Phase 1 — Persist `mainBranch` in setup

**Goal**: `.osddtrc` contains `mainBranch` after worktree setup.

- In `setup.ts`, add `mainBranch` to the `OsddtConfig` interface
- In `setupWorktreeEnvironment()`, return `branch` alongside `barePath` and `packageManager`
- In `runSetup()`, include `mainBranch: branch` in the config written to `.osddtrc`

### Phase 2 — Use `mainBranch` as base in `start-worktree`

**Goal**: new worktrees branch off the stored main branch, not the current HEAD.

- In `start-worktree.ts`, extend `OsddtRc` interface with `mainBranch?: string`
- In `runStartWorktree()`, read `mainBranch` from rc; fall back to `'main'` if absent
- Pass `mainBranch` to `git worktree add "<path>" -b <branch> <mainBranch>` (new branch from main)
- For the resume path (branch already exists), pass `mainBranch` as the start point only when creating — no change to the `git worktree add "<path>" <branch>` form used on resume

### Phase 3 — Rewrite `worktree-info` to use git

**Goal**: `worktree-info` works without a state file; derives all info from `git worktree list`.

- Add `listFeatureWorktrees(barePath: string, mainBranch: string): WorktreeEntry[]` to `src/utils/worktree.ts`:
  - Runs `git worktree list --porcelain`
  - Parses each block into `{ worktreePath, branch }`
  - Filters out the entry whose `path.basename(worktreePath) === mainBranch` (the main worktree)
  - Derives `featureName` as `path.basename(worktreePath)`
  - Derives `workingDir` as `path.join(worktreePath, 'working-on', featureName)`
  - Returns the array
- Rewrite `worktree-info.ts`:
  - Remove all state file logic (`stateFilePath`, `fs.pathExists`, `fs.readJson`)
  - Read `mainBranch` from `.osddtrc` (fall back to `'main'`)
  - Call `listFeatureWorktrees(barePath, mainBranch)`
  - If `featureName` argument provided: find matching entry; exit 1 if not found
  - If no argument: if exactly one entry, use it automatically; if multiple, prompt user to select (interactive list); if zero, error and exit 1
  - Print JSON `{ worktreePath, workingDir, branch }`

### Phase 4 — Fix `done --worktree` path resolution

**Goal**: `done --worktree` finds `working-on/<feature>` via the worktree path, not `--dir`.

- In `done.ts`, when `worktree === true`:
  - Call `resolveBarePath(process.cwd())` and read `mainBranch` from `.osddtrc`
  - Call `findWorktreeByFeature(barePath, featureName)` to get `worktreePath`
  - If found: set `src = path.join(worktreePath, 'working-on', featureName)` — ignore `cwd` (which came from `--dir`)
  - If not found: error and exit 1 (current behaviour)
  - Proceed with `fs.move(src, dest)` and `git worktree remove` as before
- When `worktree === false`: no change — `--dir` still controls `cwd` as before

### Phase 5 — Update tests

**Goal**: all existing tests pass; new tests cover the changes.

**`setup.spec.ts`**
- Add: verify `mainBranch` is written to `.osddtrc` when `worktree-repository` is provided

**`start-worktree.spec.ts`**
- Update: mock `.osddtrc` to include `mainBranch: 'main'`; assert `git worktree add` command includes `main` as base branch
- Add: test that when `mainBranch` is absent from rc, falls back to `'main'`

**`worktree-info.spec.ts`** — full rewrite
- Remove all state file scenarios
- Add: given `git worktree list` returns a single feature worktree → prints correct JSON
- Add: given feature name argument → finds matching entry → prints JSON
- Add: given feature name not found in worktree list → exits 1
- Add: given no argument and zero feature worktrees → exits 1
- Mock `execSync` to return a `git worktree list --porcelain` fixture string

**`done.spec.ts`**
- Update: `--worktree` test — assert `fs.move` uses the worktree-derived path, not `--dir` path
- Add: `--worktree` test — `--dir` is ignored when worktree path is resolved

## Technical Dependencies

- No new packages needed
- `findWorktreeByFeature` in `utils/worktree.ts` is already available and tested — `listFeatureWorktrees` builds on the same `git worktree list --porcelain` parsing

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `mainBranch` absent in `.osddtrc` (setup ran before this fix) | Fall back to `'main'` in all consumers |
| `git worktree list --porcelain` output format varies across git versions | Reuse the existing parsing logic already proven in `findWorktreeByFeature` |
| Interactive feature selection breaks in non-TTY environments (CI) | Only triggered when no argument and branch inference fails — same pattern already used in `start-worktree` prompt |

## Out of Scope

- Non-worktree `done` path resolution
- Changes to `update`, `meta-info`, or template files
- Deletion of the `.osddt-worktrees` state file from any existing projects (users must clean up manually)
