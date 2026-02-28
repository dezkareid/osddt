# Plan: `osddt update` Command

## Architecture Overview

The `update` command is a thin orchestrator that reuses the existing template generation functions (`getClaudeTemplates`, `getGeminiTemplates`) already used by `setup`. It:

1. Reads `.osddtrc` to get `repoType` (and derives the `npxCommand` via the existing `resolveNpxCommand` helper).
2. Checks which agent command directories exist (`.claude/commands/`, `.gemini/commands/`).
3. Calls the relevant `get*Templates()` functions and overwrites the files.

No new abstractions are required. The new file `src/commands/update.ts` follows the same structure as `src/commands/setup.ts` and is registered in `src/index.ts`.

## Implementation Phases

### Phase 1 — Create `src/commands/update.ts`

- Define `UpdateOptions` interface with `dir: string`.
- Implement `runUpdate(cwd: string)`:
  - Read `.osddtrc` with `fs.readJson`; exit with error if missing.
  - Call `resolveNpxCommand(cwd)` to get the correct npx command string.
  - Check existence of `.claude/commands/` and `.gemini/commands/` with `fs.pathExists`.
  - Exit with error if neither directory exists.
  - For each detected agent, call the corresponding `get*Templates(cwd, npxCommand)` and write each file with `fs.writeFile`.
  - Print confirmation lines matching the style of `setup.ts` (`Created: <filePath>`).
- Export `updateCommand(): Command` using Commander, with `-d, --dir <directory>` option.

### Phase 2 — Register the command in `src/index.ts`

- Import `updateCommand` from `./commands/update.js`.
- Add `program.addCommand(updateCommand())`.

### Phase 3 — Add tests in `src/commands/update.spec.ts`

Cover the following behaviours with mocked `fs-extra` and `child_process`:

- Missing `.osddtrc` → exits with error and correct message.
- No agent directories found → exits with error and correct message.
- Only `.claude/commands/` present → regenerates Claude files only.
- Only `.gemini/commands/` present → regenerates Gemini files only.
- Both directories present → regenerates files for both agents.
- `--dir` flag targets the specified directory.
- `.osddtrc` is not written/modified in any case.

### Phase 4 — Update documentation

- Update `README.md` and `AGENTS.md` to document the new `osddt update` command (ask user before writing).

## Technical Dependencies

| Dependency | Already used | Notes |
|---|---|---|
| `fs-extra` | Yes | `readJson`, `pathExists`, `writeFile` |
| `commander` | Yes | `Command`, `.option()`, `.action()` |
| `getClaudeTemplates` | Yes | Imported from `../templates/claude.js` |
| `getGeminiTemplates` | Yes | Imported from `../templates/gemini.js` |
| `resolveNpxCommand` | Yes (in setup.ts) | Needs to be exported from `setup.ts` or extracted to a shared utility |

> `resolveNpxCommand` is currently unexported in `setup.ts`. It should be exported so `update.ts` can import it without duplication.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `resolveNpxCommand` duplication | Export it from `setup.ts` (non-breaking change) |
| Partial write failure (one agent succeeds, other fails) | Each file is written independently; failure logs the error and exits non-zero — no rollback needed given these are regenerable files |
| Agent directory exists but is empty | Still regenerates into it — consistent with `setup` behaviour |

## Out of Scope

- Modifying `.osddtrc`
- Creating agent directories that do not exist
- Interactive prompts
- Selecting a subset of agents to update
