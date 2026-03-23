# Tasks: Fix Worktree Flow — Setup and Start

## Phase 1 — Shared utilities in `worktree.ts`

- [x] [S] Remove `checkNotAWorktree` and `initStateFile` exports
- [x] [S] Rewrite `checkTargetWritable(barePath)` to check `path.dirname(barePath)` directly — no git commands
- [x] [S] Update `runWorktreeChecks(barePath)` to remove `checkNotAWorktree` and pass `barePath` to `checkTargetWritable`
- [x] [M] Add `resolveBarePath(cwd): Promise<string>` — reads `bare-path` from `.osddtrc`, falls back to `git rev-parse --show-toplevel`
- [x] [M] Add `findWorktreeByFeature(barePath, featureName): string | undefined` — parses `git worktree list --porcelain` output and matches by trailing path segment
- [x] [M] Update `worktree.spec.ts` — remove tests for deleted functions, fix signatures, add tests for `resolveBarePath` and `findWorktreeByFeature`

**Definition of Done**: `pnpm test` passes; `pnpm lint` clean; `resolveBarePath` and `findWorktreeByFeature` are exported and covered by tests.

## Phase 2 — `setup.ts` worktree environment

> Depends on Phase 1 (`runWorktreeChecks` new signature)

- [x] [S] Replace `isGitRepository` + old `cloneBareRepository` with new `cloneBareRepository(cwd, url): string` that clones into `<cwd>/.bare` and returns `barePath`
- [x] [M] Add `detectDefaultBranch(barePath): string` — runs `git remote show origin` with `cwd: barePath`, parses `HEAD branch:` line
- [x] [S] Add `addDefaultBranchWorktree(barePath, branch): void` — runs `git worktree add "<barePath>/<branch>" <branch>` with `cwd: barePath`
- [x] [S] Add `detectPackageManager(worktreePath): string` — checks for `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` in order; defaults to `"npm"`
- [x] [M] Add `writeAgentPointerFiles(cwd, agents, branch): Promise<void>` — writes `CLAUDE.md` and/or `GEMINI.md` at `<cwd>` with `@.bare/<branch>/<FILE>` content, only for selected agents
- [x] [M] Rewrite `setupWorktreeEnvironment(cwd, url, agents): Promise<{ barePath, packageManager }>` — orchestrates clone → detect branch → add worktree → detect package manager → run checks → write pointer files
- [x] [S] Update `runSetup` to pass `agents` into `setupWorktreeEnvironment` and persist `bare-path` + `packageManager` in `.osddtrc`
- [x] [S] Add `'bare-path'` and `'packageManager'` optional fields to `OsddtConfig` interface
- [x] [L] Update `setup.spec.ts` — replace old clone/git-check assertions; add tests for `detectDefaultBranch`, `detectPackageManager`, `addDefaultBranchWorktree`, and `writeAgentPointerFiles`

**Definition of Done**: `pnpm test` passes; `pnpm lint` clean; running setup with `--worktree-repository` produces `.bare/`, `.bare/<branch>/`, pointer files, and correct `.osddtrc`.

## Phase 3 — `start-worktree.ts`

> Depends on Phase 1 (`resolveBarePath`, `findWorktreeByFeature`)

- [x] [S] Import `resolveBarePath` and `findWorktreeByFeature` from `worktree.ts`; remove local `resolveRepoRoot`
- [x] [M] Replace state file existence check (`readStateFile` / existing entry lookup) with `findWorktreeByFeature(barePath, featureName)`
- [x] [S] Derive `workingDir` as `path.join(worktreePath, 'working-on', featureName)` — remove `stateFilePath`, `readStateFile`, `writeStateFile` helpers
- [x] [S] Remove `WorktreeEntry` write after worktree creation
- [x] [M] Add `runInstall(worktreePath, packageManager?)` — runs `<pm> install` inside `worktreePath`; prints reminder if `packageManager` absent
- [x] [S] Call `runInstall` after `fs.ensureDir(workingDir)`, reading `packageManager` from `.osddtrc`
- [x] [L] Update `start-worktree.spec.ts` — replace state file mocks with `git worktree list` mocks; add install assertion; add `bare-path` resolution test

**Definition of Done**: `pnpm test` passes; `pnpm lint` clean; `start-worktree` creates worktree, installs deps, and prints summary without touching any state file.

## Phase 4 — `done.ts`

> Depends on Phase 1 (`resolveBarePath`, `findWorktreeByFeature`)

- [x] [S] Import `resolveBarePath` and `findWorktreeByFeature` from `worktree.ts`; remove local `resolveRepoRoot` and `stateFilePath`
- [x] [M] Replace state file read + entry lookup with `resolveBarePath(process.cwd())` + `findWorktreeByFeature(barePath, featureName)`
- [x] [S] Remove `WorktreeEntry` import and state file write
- [x] [S] Keep `git worktree remove` call unchanged — only the path source changes
- [x] [M] Update `done.spec.ts` — replace state file mocks with `git worktree list` mocks; verify `git worktree remove` still called correctly

**Definition of Done**: `pnpm test` passes; `pnpm lint` clean; `done --worktree` removes the worktree without reading or writing `.osddt-worktrees`.

## Dependencies

```
Phase 1 → Phase 2
Phase 1 → Phase 3
Phase 1 → Phase 4
Phases 2, 3, 4 are independent of each other
```

## Definition of Done (overall)

- [x] All tasks checked off above
- [x] `pnpm test` passes (all test files)
- [x] `pnpm lint` passes with no errors
- [x] No references to `.osddt-worktrees` remain in `setup.ts`, `start-worktree.ts`, or `done.ts`
- [x] No references to `initStateFile` or `checkNotAWorktree` remain outside of tests that explicitly test their removal
