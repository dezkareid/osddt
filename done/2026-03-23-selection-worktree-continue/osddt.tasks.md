# Tasks: Fix `osddt.continue` Feature Selection in Worktree Mode

## Phase 1 — Fix `worktree-info.ts`

- [x] [S] Remove `readline`, `prompt`, and `selectWorktree` helpers from `worktree-info.ts`
- [x] [S] Replace `selectWorktree()` call (multi-worktree, no-arg path) with `console.error` list + `process.exit(1)`

**Dependencies:** none
**Definition of Done:** `worktree-info` with no args and multiple worktrees prints each feature to stderr and exits 1 — no interactive prompt.

---

## Phase 2 — Update `osddt.continue` template in `shared.ts`

- [x] [S] Update worktree-mode block: change exit-code-1 instruction to stop and display the error output — remove the "fall back to standard resolution" instruction
- [x] [S] Update standard-mode block: replace "ask them to pick one" with "display list and stop, instruct user to re-run with feature name"

**Dependencies:** none (template changes are independent of Phase 1)
**Definition of Done:** Generated template contains no interactive-selection language; worktree-mode exit-1 path does not mention falling back to standard resolution.

---

## Phase 3 — Update tests

- [x] [M] Add `worktree-info.spec.ts` test: given no arg and multiple worktrees — should print each feature/branch to stderr and exit 1 (no JSON output)
- [x] [S] Update `shared.spec.ts`: add assertion that standard-mode block does not contain "ask them to pick" (or similar interactive language)
- [x] [S] Update `shared.spec.ts`: add/update assertion for worktree-mode exit-1 path — instructs user to re-run with feature name, no "fall back" language
- [x] [S] Run full test suite and confirm all tests pass

**Dependencies:** Phase 1 and Phase 2 must be complete before running the test suite
**Definition of Done:** All tests pass with `pnpm test`.
