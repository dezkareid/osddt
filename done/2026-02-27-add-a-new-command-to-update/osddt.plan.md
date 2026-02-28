# Plan: `osddt update` Command

## Architecture Overview

The `update` command is a thin orchestrator that reuses the existing template generation functions (`getClaudeTemplates`, `getGeminiTemplates`) already used by `setup`. It:

1. Reads `.osddtrc` to get the agent list and `repoType`.
2. If `agents` is absent, scans each agent's command directory for `osddt`-prefixed files (`osddt.*.md` for Claude, `osddt.*.toml` for Gemini) to infer active agents, then writes the inferred list back into `.osddtrc`.
3. Calls the relevant `get*Templates()` functions and overwrites the files.

`setup.ts` was also updated to persist `agents` in `.osddtrc` so that `osddt update` always has agent information available without needing to infer it.

No new abstractions are required. The new file `src/commands/update.ts` follows the same structure as `src/commands/setup.ts` and is registered in `src/index.ts`.

## Implementation Phases

### Phase 1 — Update `src/commands/setup.ts`

- Export `resolveNpxCommand` (previously unexported).
- Add `agents: AgentType[]` to `OsddtConfig` interface.
- Pass `agents` to `writeConfig()` so it is saved in `.osddtrc`.

### Phase 2 — Create `src/commands/update.ts`

- Define `AgentConfig` interface mapping each agent to its command directory and file pattern.
- Implement `hasOsddtCommandFile(dir, pattern)`: checks if the directory contains any file matching the pattern.
- Implement `inferAgents(cwd)`: iterates `AGENT_CONFIGS`, calls `hasOsddtCommandFile` per agent, returns detected list.
- Implement `runUpdate(cwd)`:
  - Read `.osddtrc` with `fs.readJson`; exit with error if missing.
  - Call `resolveNpxCommand(cwd)`.
  - If config has `agents`, use it directly.
  - Otherwise call `inferAgents(cwd)`; exit with error if empty; write inferred agents back to `.osddtrc`.
  - For each active agent, call the corresponding `get*Templates(cwd, npxCommand)` and write each file.
  - Print confirmation.
- Export `updateCommand(): Command` with `-d, --dir <directory>` option.

### Phase 3 — Register the command in `src/index.ts`

- Import `updateCommand` from `./commands/update.js`.
- Add `program.addCommand(updateCommand())`.

### Phase 4 — Tests

`src/commands/setup.spec.ts`:
- Update assertions to expect `agents` in the written `.osddtrc` config.

`src/commands/update.spec.ts`:
- Test: missing `.osddtrc` → exits non-zero.
- Test (agents in config): only claude → regenerates Claude only, no `.osddtrc` write.
- Test (agents in config): only gemini → regenerates Gemini only, no `.osddtrc` write.
- Test (agents in config): both → regenerates both, no `.osddtrc` write.
- Test (no agents in config): only `osddt.*.md` found → infers claude, writes to `.osddtrc`, regenerates Claude.
- Test (no agents in config): only `osddt.*.toml` found → infers gemini, writes to `.osddtrc`, regenerates Gemini.
- Test (no agents in config): no matching files found → exits non-zero.
- Test: `--dir` flag targets specified directory.
- Test: `.osddtrc` not modified when `agents` key already present.

### Phase 5 — Update documentation

- Update `README.md` and `AGENTS.md`:
  - Document `osddt update` command.
  - Document that `agents` is now persisted in `.osddtrc`.
  - Document the inference fallback behaviour.

## Technical Dependencies

| Dependency | Already used | Notes |
|---|---|---|
| `fs-extra` | Yes | `readJson`, `writeJson`, `pathExists`, `readdir`, `writeFile` |
| `commander` | Yes | `Command`, `.option()`, `.action()` |
| `getClaudeTemplates` | Yes | Imported from `../templates/claude.js` |
| `getGeminiTemplates` | Yes | Imported from `../templates/gemini.js` |
| `resolveNpxCommand` | Yes | Exported from `setup.ts` |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Legacy `.osddtrc` without `agents` key | Inference fallback: scan for `osddt.*.md`/`osddt.*.toml` and write result back |
| `readJson` call order in tests | `resolveNpxCommand` reads `package.json` after `.osddtrc` is read — mocks must follow the same order |
| Partial write failure | Each file is written independently; failure exits non-zero — no rollback needed (files are regenerable) |

## Out of Scope

- Creating agent directories that do not exist
- Interactive prompts
- Selecting a subset of agents to update
