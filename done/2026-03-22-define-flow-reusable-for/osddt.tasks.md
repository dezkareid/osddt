# Tasks: Unified Setup and Start Flow for Worktrees

## Phase 1 — Extend `OsddtConfig` and `setup.ts`

- [x] [S] Extract `checkGitVersion`, `checkNotAWorktree`, `checkTargetWritable`, `initStateFile`, and `printResult` from `setup-worktree.ts` into `src/utils/worktree.ts`
- [x] [S] Add `src/utils/worktree.spec.ts` covering the extracted check functions (git version pass/fail, not-a-worktree pass/fail, writable pass/fail, state file init/already-exists)
- [x] [S] Add `"worktree-repository"?: string` to the `OsddtConfig` interface in `setup.ts`
- [x] [S] Add `--worktree-repository <url>` option to the Commander command definition in `setup.ts`
- [x] [S] Add `askWorktreeUrl()` to `src/utils/prompt.ts` using `@inquirer/input` (optional — blank answer skips worktree setup); install `@inquirer/input` at the correct exact version
- [x] [M] In `runSetup()`: integrate worktree URL handling — non-interactive reads flag, interactive calls `askWorktreeUrl()`; when URL provided, run environment checks via `src/utils/worktree.ts`; exit(1) on failure; pass `"worktree-repository"` to `writeConfig()` only when defined
- [x] [M] Update `src/commands/setup.spec.ts`: cover `--worktree-repository` writes plain URL; blank interactive URL omits field; checks run on URL presence; check failure blocks config write
- [x] [S] Delete `src/commands/setup-worktree.ts` and `src/commands/setup-worktree.spec.ts`
- [x] [S] Remove `setupWorktreeCommand` registration from `src/index.ts`
- [x] [S] Run `pnpm test` — all tests must pass

**Dependencies**: Extract to `worktree.ts` before modifying `setup.ts`. Install `@inquirer/input` before adding `askWorktreeUrl()`.

**Definition of Done**: `osddt setup --worktree-repository <url>` writes `"worktree-repository": "<url>"` to `.osddtrc` and initialises `.osddt-worktrees`; omitting the flag produces no `"worktree-repository"` field; `setup-worktree` command no longer exists; all tests pass.

---

## Phase 2 — Unify `osddt.start` and `osddt.start-worktree` templates

- [x] [S] Remove the `osddt.start-worktree` entry from `COMMAND_DEFINITIONS` in `src/templates/shared.ts`
- [x] [M] Rewrite the `osddt.start` body in `shared.ts` to branch on `"worktree-repository"` presence in `.osddtrc`: worktree path calls `npx osddt start-worktree` and navigates into the worktree directory; standard path uses `git checkout -b` and creates `working-on/`
- [x] [S] Update `src/templates/shared.spec.ts`: remove all `osddt.start-worktree` tests; add tests asserting `osddt.start` body references `worktree-repository` and `start-worktree`
- [x] [S] Run `pnpm test` — all tests must pass
- [x] [S] Run `pnpm build && node dist/index.js update` to regenerate agent command files
- [x] [S] Delete `.claude/commands/osddt.start-worktree.md` (and `.gemini/commands/osddt.start-worktree.toml` if present)

**Dependencies**: Phase 1 must be complete. Remove `osddt.start-worktree` from `COMMAND_DEFINITIONS` before rewriting `osddt.start`.

**Definition of Done**: Only `osddt.start.md` exists in `.claude/commands/` (no `osddt.start-worktree.md`); the template body contains both `worktree-repository` and `start-worktree`; all tests pass.

---

## Phase 3 — Update documentation

- [x] [M] Update `README.md`: remove `osddt setup-worktree` from commands table; remove `osddt.start-worktree` from templates table; update `.osddtrc` example to show `"worktree-repository"`; update `osddt setup` options table to add `--worktree-repository <url>`; update Example D to use `osddt setup --worktree-repository <url>` and `/osddt.start`; add migration note about manually deleting old `osddt.start-worktree.*` files
- [x] [M] Update `AGENTS.md` with the same changes as `README.md`

**Dependencies**: Phase 2 must be complete so the final command surface is known.

**Definition of Done**: Neither `README.md` nor `AGENTS.md` references `setup-worktree` or `start-worktree` as user-facing commands; both show `"worktree-repository"` in `.osddtrc` examples; migration note is present.

---

## Phase 4 — Unify working-directory resolution across all entry-point templates

- [x] [M] Update `getRepoPreamble()` in `src/templates/shared.ts`: document both `.osddtrc` shapes (standard and worktree mode); instruct agents to call `worktree-info <feature-name>` once the feature name is known when `"worktree-repository"` is present, using `workingDir` from the JSON output (exit 0) or falling back to standard (exit 1)
- [x] [S] Replace `osddt.start`'s inline preamble with `getRepoPreamble()` — eliminates duplication
- [x] [S] Remove inline worktree-resolution block from `osddt.continue` — now covered by the preamble
- [x] [S] Update `osddt.research` Step 3 to branch on `"worktree-repository"`: use `worktree-info` to locate the working directory for worktree features, create it via standard path otherwise
- [x] [M] Update `osddt.fast` Step 2 to branch on `"worktree-repository"`: worktree path calls `npx osddt start-worktree`; standard path uses `git checkout -b`
- [x] [S] Fix lint issues in `setup.ts`, `setup.spec.ts`, and `worktree.spec.ts`
- [x] [S] Run `pnpm lint && pnpm test` — all checks pass

**Dependencies**: Phase 3 must be complete.

**Definition of Done**: `getRepoPreamble()` is the single source of truth for `.osddtrc` shape documentation and worktree-info resolution; `osddt.start`, `osddt.continue`, `osddt.research`, and `osddt.fast` all consistently resolve the working directory via `worktree-info` when `"worktree-repository"` is present; all 191 tests pass; lint clean.
