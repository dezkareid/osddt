# Tasks: Fix continue workflow for worktrees

## Phase 1 — Update the `osddt.continue` template body

- [x] [M] Rewrite the `osddt.continue` body in `COMMAND_DEFINITIONS` in `src/templates/shared.ts` to branch on `worktree-repository` presence: use `worktree-info` in worktree mode, keep `RESOLVE_FEATURE_NAME` logic in standard mode

**Definition of Done**: `src/templates/shared.ts` compiles without errors and the `osddt.continue` body contains the two-branch resolution logic.

## Phase 2 — Regenerate command files

- [x] [S] Run `pnpm build` to compile the updated source
- [x] [S] Run `node dist/index.js update` to regenerate `.claude/commands/osddt.continue.md` (and Gemini file if present)
- [x] [S] Verify `.claude/commands/osddt.continue.md` contains the new worktree-aware resolution logic

**Dependencies**: Phase 1 must be complete before Phase 2.

**Definition of Done**: Generated command files reflect the new template body.

## Phase 3 — Update tests

- [x] [M] Add/update tests in the template spec file to assert the `osddt.continue` body contains `worktree-info` instructions when `worktree-repository` context is present, and standard `RESOLVE_FEATURE_NAME` logic when absent
- [x] [S] Run `pnpm test` and confirm all tests pass

**Dependencies**: Phase 1 must be complete before Phase 3.

**Definition of Done**: Full test suite passes with no regressions.
