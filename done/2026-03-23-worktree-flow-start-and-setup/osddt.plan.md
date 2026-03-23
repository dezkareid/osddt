# Plan: Fix Worktree Flow — Setup and Start

## Architecture Overview

All changes are confined to three source files and their tests. No new dependencies are introduced.

**`src/utils/worktree.ts`** — Rework to accept `barePath` instead of `cwd`. Remove `checkNotAWorktree` and `initStateFile` (state file eliminated). Replace `checkTargetWritable` with a simpler version that checks `path.dirname(barePath)`. Add two new exported helpers used by multiple commands:
- `resolveBarePath(cwd)` — reads `bare-path` from `.osddtrc`, falls back to `git rev-parse --show-toplevel`
- `findWorktreeByFeature(barePath, featureName)` — runs `git worktree list --porcelain` and returns the matching worktree path

**`src/commands/setup.ts`** — Extend `setupWorktreeEnvironment` to:
1. Clone bare into `<cwd>/.bare`
2. Detect default branch via `git remote show origin`
3. Add default-branch worktree at `.bare/<branch>`
4. Detect package manager from lockfiles in the default-branch worktree
5. Write pointer `CLAUDE.md` / `GEMINI.md` per selected agent
6. Save `bare-path` and `packageManager` in `.osddtrc`

**`src/commands/start-worktree.ts`** — Replace `resolveRepoRoot` with `resolveBarePath`. Replace state file read/write with `findWorktreeByFeature` + derive `workingDir` from convention. Add auto-install step after `git worktree add`.

**`src/commands/done.ts`** — Replace state file lookup with `resolveBarePath` + `findWorktreeByFeature` for the `--worktree` path.

**`src/commands/worktree-info.ts`** — Out of scope; left unchanged.

### `.osddtrc` shape after this change

```json
{
  "repoType": "single",
  "agents": ["claude"],
  "worktree-repository": "https://github.com/org/repo.git",
  "bare-path": "/path/to/project/.bare",
  "packageManager": "pnpm"
}
```

### `git worktree list --porcelain` output shape (reference)

```
worktree /path/to/.bare
HEAD abc123
branch refs/heads/main

worktree /path/to/project-my-feature
HEAD def456
branch refs/heads/feat/my-feature
```

Each block is separated by a blank line. The `worktree` field is the path.

---

## Implementation Phases

### Phase 1 — Shared utilities in `worktree.ts`

**Goal**: provide `resolveBarePath` and `findWorktreeByFeature` as shared helpers; simplify existing checks.

1. Remove `checkNotAWorktree` and `initStateFile`.
2. Rewrite `checkTargetWritable(barePath)` — receives absolute `barePath`, checks `path.dirname(barePath)` is writable. No git commands needed.
3. Update `runWorktreeChecks(barePath)` — remove `checkNotAWorktree` from the list; pass `barePath` to `checkTargetWritable`.
4. Add `resolveBarePath(cwd): Promise<string>` — reads `.osddtrc` from `cwd`; returns `rc['bare-path']` if present, otherwise runs `git rev-parse --show-toplevel` from `cwd`.
5. Add `findWorktreeByFeature(barePath, featureName): string | undefined` — runs `git worktree list --porcelain` with `cwd: barePath`; parses output; returns the path of the block whose path ends with `-<featureName>` or equals `featureName`.
6. Update tests in `worktree.spec.ts` to match the new signatures; add tests for the two new helpers.

### Phase 2 — `setup.ts` worktree environment

**Goal**: replace the broken `.git` clone with a correct `.bare` setup, detect defaults, write pointer files.

1. Replace `isGitRepository` + old `cloneBareRepository` with a new `cloneBareRepository(cwd, url): string` that:
   - Runs `git clone --bare "<url>" "<cwd>/.bare"`
   - Returns `barePath = path.join(cwd, '.bare')`
2. Add `detectDefaultBranch(barePath): string` — runs `git remote show origin` with `cwd: barePath`; parses `HEAD branch: <name>` from output; returns it.
3. Add `addDefaultBranchWorktree(barePath, branch): void` — runs `git worktree add "<barePath>/<branch>" <branch>` with `cwd: barePath`.
4. Add `detectPackageManager(worktreePath): string` — checks for `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` in that order; returns `"pnpm"`, `"yarn"`, or `"npm"`.
5. Add `writeAgentPointerFiles(cwd, agents, barePath, branch): Promise<void>` — for each agent in `agents`: write `<cwd>/CLAUDE.md` containing `@.bare/<branch>/CLAUDE.md` (or `GEMINI.md` equivalent).
6. Rewrite `setupWorktreeEnvironment(cwd, url): Promise<{ barePath, packageManager }>` — orchestrates steps 1–4; calls `runWorktreeChecks(barePath)`.
7. Update `runSetup` to call `writeAgentPointerFiles` and persist `bare-path` + `packageManager` in `.osddtrc`.
8. Remove `OsddtConfig['worktree-repository']` is kept; add `'bare-path'` and `'packageManager'` optional fields to the interface.
9. Update `setup.spec.ts`: replace old clone/git-check assertions with new ones; add tests for pointer file writing and package manager detection.

### Phase 3 — `start-worktree.ts`

**Goal**: use `bare-path` from config; replace state file with `git worktree list`; auto-install.

1. Replace `resolveRepoRoot(cwd)` (sync, git-based) with `resolveBarePath` imported from `worktree.ts`.
2. Replace state file read (`readStateFile` / `writeStateFile`) with `findWorktreeByFeature` for existence check.
3. On resume: derive `workingDir` as `path.join(worktreePath, 'working-on', featureName)` — no state file needed.
4. Remove `WorktreeEntry` write after `createWorktree`. Remove `stateFilePath` and `readStateFile` / `writeStateFile` helpers.
5. After `fs.ensureDir(workingDir)`, add `runInstall(worktreePath, packageManager)`:
   - Reads `packageManager` from `.osddtrc` (default `"npm"` if absent)
   - Runs `<packageManager> install` with `cwd: worktreePath`, `stdio: 'inherit'`
   - If `packageManager` is absent, prints a reminder instead
6. Update `start-worktree.spec.ts`: replace state file mocks with `execSync` mocks for `git worktree list`; add install assertion.

### Phase 4 — `done.ts`

**Goal**: replace state file lookup with `git worktree list`.

1. Import `resolveBarePath` and `findWorktreeByFeature` from `worktree.ts`.
2. Replace `resolveRepoRoot` + `stateFilePath` + state file read with:
   - `resolveBarePath(process.cwd())` to get `barePath`
   - `findWorktreeByFeature(barePath, featureName)` to get `worktreePath`
3. If `findWorktreeByFeature` returns `undefined`, warn and skip cleanup (same UX as before).
4. Run `git worktree remove` with `cwd: barePath` (unchanged).
5. Remove `WorktreeEntry` import and state file write.
6. Update `done.spec.ts`: mock `execSync` for `git worktree list` output; remove state file mocks.

---

## Technical Dependencies

| Dependency | Already present | Usage |
|---|---|---|
| `fs-extra` | Yes | File existence checks, reading `.osddtrc`, writing pointer files |
| `child_process` (`execSync`) | Yes | All git operations, package manager install |
| `path` | Yes | Path construction throughout |

No new npm packages required.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `git remote show origin` is slow (network call) | Acceptable — only runs once during `setup`, not on every command |
| `git remote show origin` output format varies across git versions | Parse specifically for `HEAD branch:` line; test against known formats |
| Package manager install fails in CI / offline environments | Capture error, print warning, continue — don't fail the whole command |
| Worktree path convention mismatch (`<repo>-<feature>`) | Convention is `path.basename(barePath)` (`.bare`) + `-` + featureName — document clearly in code |
| `findWorktreeByFeature` false-positive on similarly named features | Match on full path segment: path ends with `/<featureName>` not just contains it |

---

## Out of Scope

- `osddt worktree-info` — left unchanged; reads state file; will be addressed separately
- `osddt update` and all template files
- Support for default branches other than `main`/`master`
- Migration of existing `.osddt-worktrees` state files
- `worktreeBase` custom base directory for worktrees (existing feature, untouched)
