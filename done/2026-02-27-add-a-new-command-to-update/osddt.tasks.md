# Tasks: `osddt update` Command

## Phase 1 — Update `src/commands/setup.ts`

- [x] [S] Export `resolveNpxCommand` from `src/commands/setup.ts`
- [x] [S] Add `agents: AgentType[]` to `OsddtConfig` and pass it to `writeConfig()`

**Definition of Done:** `osddt setup` writes `{ repoType, agents }` to `.osddtrc`.

## Phase 2 — Create `src/commands/update.ts`

- [x] [M] Implement `hasOsddtCommandFile(dir, pattern)` and `inferAgents(cwd)` to detect active agents from command files (`osddt.*.md` for Claude, `osddt.*.toml` for Gemini)
- [x] [M] Implement `runUpdate(cwd)`: read config, use `agents` from config or infer and write back, then regenerate files
- [x] [S] Export `updateCommand(): Command` with `-d, --dir` option

**Definition of Done:** `osddt update` runs without error, regenerates the correct agent files, and handles the no-`agents`-key fallback correctly.

## Phase 3 — Register the command

- [x] [S] Import and register `updateCommand()` in `src/index.ts`

**Definition of Done:** `osddt update --help` shows the command and its `--dir` option.

## Phase 4 — Tests

- [x] [S] Test (setup): `.osddtrc` written with `agents` alongside `repoType`
- [x] [S] Test (update): missing `.osddtrc` → exits non-zero with message to run `osddt setup`
- [x] [S] Test (update, agents in config): only claude → regenerates Claude only, no `.osddtrc` write
- [x] [S] Test (update, agents in config): only gemini → regenerates Gemini only, no `.osddtrc` write
- [x] [S] Test (update, agents in config): both → regenerates both, no `.osddtrc` write
- [x] [S] Test (update, no agents in config): `osddt.*.md` found → infers claude, writes to `.osddtrc`, regenerates Claude
- [x] [S] Test (update, no agents in config): `osddt.*.toml` found → infers gemini, writes to `.osddtrc`, regenerates Gemini
- [x] [S] Test (update, no agents in config): no matching files → exits non-zero
- [x] [S] Test (update): `--dir` flag targets the specified directory
- [x] [S] Test (update): `.osddtrc` not modified when `agents` key already present

**Definition of Done:** All tests pass (`pnpm test`). 127 tests total.

## Phase 5 — Documentation

- [x] [M] Update `README.md` and `AGENTS.md` to document `osddt update`, `agents` in `.osddtrc`, and inference fallback

**Definition of Done:** Docs reflect all new behaviour including the inference fallback and the updated `.osddtrc` shape.
