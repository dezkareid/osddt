# Tasks: Fix `worktree-info` Command Issues

## Phase 1 — Fix `.bare` filtering in `listFeatureWorktrees`

- [x] [S] In `src/utils/worktree.ts`, add a `continue` guard in `listFeatureWorktrees` to skip blocks where `branchMatch` is null (bare/detached worktrees)

**Definition of Done**: `listFeatureWorktrees` never returns an entry for a worktree block that has no `branch` line in `git worktree list --porcelain` output.

## Phase 2 — Structured JSON errors in `worktree-info`

- [x] [S] Replace `console.error` + `process.exit(1)` for the "no worktrees" case with `console.log(JSON.stringify({ error: 'none' }))` + `process.exit(1)`
- [x] [S] Replace `console.error` + `process.exit(1)` for the "multiple worktrees" case with `console.log(JSON.stringify({ error: 'multiple', worktrees: [...] }))` + `process.exit(1)`
- [x] [S] Replace `console.error` + `process.exit(1)` for the "not-found" case with `console.log(JSON.stringify({ error: 'not-found', featureName }))` + `process.exit(1)`

**Dependencies**: Phase 1 should be complete first (affects the entries list passed to these paths).

**Definition of Done**: All three error paths in `worktree-info` write structured JSON to stdout and nothing to stderr.

## Phase 3 — Update `osddt.continue` template

- [x] [S] Rebuild generated command files: run `pnpm build && osddt update` to regenerate `.claude/commands/osddt.continue.md` from the already-updated `src/templates/shared.ts`
- [x] [S] Verify `.claude/commands/osddt.continue.md` reflects the new structured JSON handling instructions

**Dependencies**: `src/templates/shared.ts` was already updated in a prior session — only the build step remains.

**Definition of Done**: `.claude/commands/osddt.continue.md` contains instructions to parse `{ error: "multiple", worktrees: [...] }` and present options to the user rather than stopping with a prose error.

## Phase 4 — Update tests

- [x] [M] Update `worktree-info.spec.ts` — "multiple worktrees" case: expect `console.log` with `{ error: 'multiple', worktrees: [...] }` JSON; expect `console.error` NOT called
- [x] [S] Update `worktree-info.spec.ts` — "zero worktrees" case: expect `console.log` with `{ error: 'none' }` JSON; expect `console.error` NOT called
- [x] [S] Update `worktree-info.spec.ts` — "not-found" case: expect `console.log` with `{ error: 'not-found', featureName: 'unknown-feature' }` JSON; expect `console.error` NOT called
- [x] [S] In `src/utils/worktree.spec.ts` (if it exists), add a test case for a porcelain block without a `branch` line to confirm it is filtered out by `listFeatureWorktrees`
- [x] [S] Run `pnpm test` and confirm all tests pass

**Dependencies**: Phases 1–2 must be complete.

**Definition of Done**: All tests pass with no references to `console.error` in the updated test cases.
