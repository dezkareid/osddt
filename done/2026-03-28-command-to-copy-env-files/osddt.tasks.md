# Tasks: Command to Copy Environment Files

## Phase 1 — `src/commands/copy-env.ts`

- [x] [S] Create `src/commands/copy-env.ts` with Commander command definition: flags `--source`, `--target`, `--pattern`, `--force`, `--dry-run`
- [x] [S] Return silently (exit 0, no output) if `--target` is not provided
- [x] [S] Resolve source: use `--source` flag, else read `copy-env.source` from `.osddtrc`, else return silently
- [x] [S] Resolve pattern: use `--pattern` flag, else read `copy-env.pattern` from `.osddtrc`, else default to `.env*`; split comma-separated value into array
- [x] [S] Glob files in source using `globby` with resolved patterns (shallow, no `**`); return silently if no files found
- [x] [S] For each matched file: compute destination, handle `--dry-run` (log only), skip if exists and no `--force`, otherwise copy with `fs-extra` and log result
- [x] [S] Wrap entire action in try/catch — swallow all errors silently (exit 0)

**Definition of Done:** `osddt copy-env --source <src> --target <dest>` copies `.env*` files; missing flags or no matches return silently with code 0.

**Dependencies:** None.

---

## Phase 2 — Register command in `src/index.ts`

- [x] [S] Import `copyEnvCommand` from `./commands/copy-env.js` and add `program.addCommand(copyEnvCommand())`

**Definition of Done:** `osddt copy-env --help` is available from the CLI.

**Dependencies:** Phase 1 must be complete.

---

## Phase 3 — Update `osddt.start` template in `src/templates/shared.ts`

- [x] [M] In the worktree workflow section of the `osddt.start` body, after the `start-worktree` step, add a step instructing the agent to read `bare-path` and `mainBranch` from `.osddtrc` and run:
  - Single repo: `npx osddt copy-env --source <bare-path>/<mainBranch> --target <worktreePath>`
  - Monorepo: `npx osddt copy-env --source <bare-path>/<mainBranch>/<package-path> --target <worktreePath>/<package-path>`
- [x] [S] Renumber subsequent steps in `osddt.start` worktree section
- [x] [S] Apply the same `copy-env` step to the `osddt.fast` worktree workflow section and renumber its steps

**Definition of Done:** Reading `shared.ts`, the `osddt.start` and `osddt.fast` worktree paths include the `copy-env` step with correct source/target construction for both single and monorepo layouts.

**Dependencies:** None (can be done in parallel with Phase 1).

---

## Phase 4 — Regenerate agent command files

- [x] [S] Run `pnpm build` then `osddt update` to regenerate all agent command files
- [x] [S] Verify `.claude/commands/osddt.start.md` and `.claude/commands/osddt.fast.md` contain the new `copy-env` step

**Definition of Done:** Generated files are in sync with `shared.ts`.

**Dependencies:** Phase 3 must be complete.

---

## Phase 5 — Tests in `src/commands/copy-env.spec.ts`

- [x] [M] Add describe block with beforeEach mocking `fs-extra`, `globby`, and `fs-extra.readJson` for `.osddtrc`
- [x] [S] Test: returns silently when `--target` is omitted (no output, no error, no copy)
- [x] [S] Test: returns silently when `--source` absent and no `copy-env.source` in `.osddtrc`
- [x] [S] Test: returns silently when `.osddtrc` file does not exist and `--source` is not provided
- [x] [S] Test: copies matched files when source and target are clean
- [x] [S] Test: skips existing target file when `--force` is not set; logs `Skipped`
- [x] [S] Test: overwrites existing target file when `--force` is set; logs `Copied`
- [x] [S] Test: logs dry-run output without writing when `--dry-run` is set
- [x] [S] Test: returns silently when no files match glob
- [x] [S] Test: uses `copy-env.source` from `.osddtrc` when `--source` not provided
- [x] [S] Test: uses `copy-env.pattern` from `.osddtrc` when `--pattern` not provided
- [x] [S] Test: `--source` flag takes precedence over `copy-env.source` in `.osddtrc`
- [x] [S] Test: `--pattern` flag takes precedence over `copy-env.pattern` in `.osddtrc`
- [x] [S] Run `pnpm test` and verify all tests pass

**Definition of Done:** `pnpm test` passes with all new and existing tests green.

**Dependencies:** Phase 1 must be complete.
