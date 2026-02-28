# Tasks: `osddt update` Command

## Phase 1 — Create `src/commands/update.ts`

- [x] [S] Export `resolveNpxCommand` from `src/commands/setup.ts` (remove `async function` → `export async function`)
- [x] [M] Create `src/commands/update.ts` with `runUpdate(cwd)` implementing: read `.osddtrc`, resolve npx command, detect agent directories, regenerate files, print confirmation
- [x] [S] Export `updateCommand(): Command` from `src/commands/update.ts` with `-d, --dir` option

**Definition of Done:** `osddt update` runs without error in a project with `.osddtrc` and at least one agent command directory, regenerates the correct files, and prints confirmation output.

## Phase 2 — Register the command

- [x] [S] Import and register `updateCommand()` in `src/index.ts`

**Definition of Done:** `osddt update --help` shows the command and its `--dir` option.

## Phase 3 — Tests

> Depends on Phase 1 and Phase 2 being complete.

- [x] [S] Test: missing `.osddtrc` → exits non-zero with message to run `osddt setup`
- [x] [S] Test: no agent directories found → exits non-zero with message to run `osddt setup`
- [x] [S] Test: only `.claude/commands/` present → regenerates Claude files only
- [x] [S] Test: only `.gemini/commands/` present → regenerates Gemini files only
- [x] [M] Test: both agent directories present → regenerates files for both agents
- [x] [S] Test: `--dir` flag targets the specified directory
- [x] [S] Test: `.osddtrc` is never written or modified

**Definition of Done:** All tests pass (`pnpm test`).

## Phase 4 — Documentation

> Depends on Phase 1–3 being complete.

- [x] [M] Update `README.md` and `AGENTS.md` to document `osddt update` (ask user before writing)

**Definition of Done:** Docs list `osddt update` in the available commands table with a description.
