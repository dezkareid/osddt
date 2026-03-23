# Tasks: Fix Worktree Workflow Issues in `done` Command

## Phase 1 — Persist `mainBranch` in setup

- [x] [S] Add `mainBranch` field to `OsddtConfig` interface in `setup.ts`
- [x] [S] Return `branch` from `setupWorktreeEnvironment()` alongside `barePath` and `packageManager`
- [x] [S] Include `mainBranch` in the config object written to `.osddtrc` in `runSetup()`
- [x] [S] Add test: `mainBranch` is written to `.osddtrc` when `worktree-repository` is provided

**Definition of Done**: `.osddtrc` contains `"mainBranch"` after `osddt setup --worktree-repository <url>` runs. Test passes.

---

## Phase 2 — Use `mainBranch` as base in `start-worktree`

> Depends on Phase 1

- [x] [S] Extend `OsddtRc` interface in `start-worktree.ts` with `mainBranch?: string`
- [x] [S] Read `mainBranch` from rc in `runStartWorktree()`; fall back to `'main'` if absent
- [x] [S] Pass `mainBranch` as the start point in `git worktree add "<path>" -b <branch> <mainBranch>`
- [x] [S] Update existing test: mock rc includes `mainBranch: 'main'`; assert `git worktree add` command includes `main` as base
- [x] [S] Add test: when `mainBranch` is absent from rc, falls back to `'main'`

**Definition of Done**: new worktrees branch off `mainBranch`. Tests pass.

---

## Phase 3 — Add `listFeatureWorktrees` helper to `utils/worktree.ts`

- [x] [M] Add `listFeatureWorktrees(barePath: string, mainBranch: string): WorktreeEntry[]` to `src/utils/worktree.ts`:
  - Runs `git worktree list --porcelain`
  - Parses each block into `{ worktreePath, branch }`
  - Filters out the entry where `path.basename(worktreePath) === mainBranch`
  - Derives `featureName` as `path.basename(worktreePath)`
  - Derives `workingDir` as `path.join(worktreePath, 'working-on', featureName)`
  - Returns `WorktreeEntry[]`
- [x] [S] Export `WorktreeEntry` type from `utils/worktree.ts` (move from `start-worktree.ts` or re-export)

**Definition of Done**: helper is exported and unit-testable. Reused by Phases 4 and 5.

---

## Phase 4 — Rewrite `worktree-info` to use git

> Depends on Phase 3

- [x] [M] Remove state file logic from `worktree-info.ts` (`stateFilePath`, `fs.pathExists`, `fs.readJson`)
- [x] [S] Read `mainBranch` from `.osddtrc` (fall back to `'main'`) in `runWorktreeInfo()`
- [x] [S] Call `listFeatureWorktrees(barePath, mainBranch)` to get the list of feature worktrees
- [x] [S] If feature name argument provided: find matching entry by `featureName`; exit 1 if not found
- [x] [S] If no argument and exactly one entry: use it automatically
- [x] [M] If no argument and multiple entries: prompt user with interactive list to select one
- [x] [S] If no argument and zero entries: print error and exit 1
- [x] [M] Rewrite `worktree-info.spec.ts`: remove state file test cases; add git-based scenarios (see plan)

**Definition of Done**: `worktree-info` works without `.osddt-worktrees`; all new tests pass.

---

## Phase 5 — Fix `done --worktree` path resolution

> Depends on Phase 3

- [x] [S] In `done.ts`, when `worktree === true`: resolve `src` from the git-derived worktree path instead of `cwd` (which came from `--dir`)
- [x] [S] Read `mainBranch` from `.osddtrc` and pass to `listFeatureWorktrees` (or use `findWorktreeByFeature` directly) to get `worktreePath`
- [x] [S] Set `src = path.join(worktreePath, 'working-on', featureName)` when worktree is found
- [x] [S] Update existing `--worktree` test: assert `fs.move` source uses worktree-derived path, not `--dir` path
- [x] [S] Add test: `--dir` is ignored when `--worktree` is set and worktree path is resolved

**Definition of Done**: `osddt done <feature> --dir <any-path> --worktree` succeeds using the worktree path. Tests pass.

---

## Dependencies

```
Phase 1 → Phase 2
Phase 3 → Phase 4
Phase 3 → Phase 5
```

Phases 1–2 and Phases 3–5 can be worked in parallel.
