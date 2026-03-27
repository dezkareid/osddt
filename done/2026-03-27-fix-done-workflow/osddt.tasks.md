# Tasks: Fix Done Workflow — Commit Before Worktree Removal

## Phase 1 — CLI guard in `done.ts`

- [x] [S] Add dirty-worktree check in `runDone`: before `fs.move`, run `git status --porcelain` inside `worktreePath` using `execSync` with `{ encoding: 'utf8', stdio: 'pipe' }`
- [x] [S] If output is non-empty, print error "Error: Worktree has uncommitted changes. Commit or stash them before running osddt done." and call `process.exit(1)` without moving or removing anything
- [x] [S] Wrap the `execSync` git status call in try/catch; on error, abort with a clear message rather than proceeding

**Definition of Done:** Running `osddt done <feature> --worktree` against a dirty worktree exits with code 1 and prints the error; clean worktree proceeds as before.

**Dependencies:** None.

---

## Phase 2 — Fix template order in `shared.ts`

- [x] [M] Reorder the `osddt.done` body so steps follow: check status → commit if dirty → push → run `osddt done --worktree`
- [x] [S] Ensure the standard (non-worktree) path in the template is unchanged and still skips to the report step

**Definition of Done:** Reading `shared.ts` end-to-end, the done template instructs commit and push strictly before `osddt done --worktree` with no ambiguity about ordering or parallelism.

**Dependencies:** None (can be done in parallel with Phase 1).

---

## Phase 3 — Update tests in `done.spec.ts`

- [x] [M] Add describe block "given --worktree flag and worktree has uncommitted changes": mock `execSync` to return `'M src/index.ts\n'` for git status; assert `process.exit(1)` called, `fs.move` not called, `git worktree remove` not called
- [x] [S] Add test "given --worktree flag and worktree is clean": mock `execSync` returning `''`; assert `fs.move` and `git worktree remove` are called
- [x] [S] Verify existing tests still pass (no regression from the new `execSync` call)

**Definition of Done:** `pnpm test` passes with all existing and new tests green.

**Dependencies:** Phase 1 must be complete before tests can be written against the new behaviour.

---

## Phase 4 — Regenerate agent command files

- [x] [S] Run `osddt update` to regenerate `.claude/commands/osddt.done.md` from the fixed `shared.ts`
- [x] [S] Verify the regenerated file matches the correct step order (commit → push → done)

**Definition of Done:** `.claude/commands/osddt.done.md` reflects the fixed template and is in sync with `shared.ts`.

**Dependencies:** Phase 2 must be complete first.
