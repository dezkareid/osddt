# Plan: Command to Copy Environment Files

## Architecture Overview

Two distinct changes are needed:

1. **New `copy-env` CLI command** (`src/commands/copy-env.ts`) — TypeScript, Commander. Takes `--source` and `--target` paths, globs files, copies with skip-on-conflict default. No worktree knowledge, no prompts. Registered in `src/index.ts`.

2. **`osddt.start` template update in `src/templates/shared.ts`** — The worktree workflow path gains a step that resolves the worktree path from `start-worktree` output and passes it as `--target` to `osddt copy-env`. `osddt update` regenerates all agent files.

### Key design decisions
- **No worktree knowledge**: the command receives plain `--source` and `--target` directory paths. It does not read `.osddtrc` for worktree config — only for `copy-env.source` and `copy-env.pattern` defaults.
- **`--target` always required**: no default. If absent, return immediately (exit 0, no output).
- **`--source` resolution** (priority: `--source` flag > `copy-env.source` in `.osddtrc` > return silently).
- **`--pattern` resolution** (priority: `--pattern` flag > `copy-env.pattern` in `.osddtrc` > `.env*`).
- **Fail silently**: every error condition (missing flag, missing source, path not found, copy failure) returns with exit 0 and no output. The command never throws or calls `process.exit(1)`.
- **Skip-on-conflict default**: existing target files are skipped unless `--force` is set.
- **Glob matching**: `globby` (already a dependency), shallow scan, comma-separated patterns split into array.
- **No new dependencies**.

## Implementation Phases

### Phase 1 — `src/commands/copy-env.ts`

**Goal:** Implement the file-copy command.

Steps:
1. Parse flags: `--source`, `--target`, `--pattern`, `--force`, `--dry-run`.
2. If `--target` is missing: return (exit 0, no output).
3. Resolve source:
   - Use `--source` if provided.
   - Else read `copy-env.source` from `.osddtrc` (if file exists and key is present).
   - Else return (exit 0, no output).
4. Resolve pattern:
   - Use `--pattern` if provided.
   - Else use `copy-env.pattern` from `.osddtrc` if set.
   - Else default to `.env*`.
   - Split comma-separated value into array.
5. Glob files in source directory using `globby` with resolved patterns. Shallow (no `**`).
6. If no files found: return (exit 0, no output).
7. For each matched file:
   - Compute destination: `path.join(target, path.basename(file))`.
   - If `--dry-run`: log `[dry-run] Would copy: <src> → <dest>` and continue.
   - If destination exists and `--force` is not set: log `Skipped: <dest> (already exists)` and continue.
   - Otherwise: `fs.copy(file, dest)` and log `Copied: <src> → <dest>`.

### Phase 2 — Register command in `src/index.ts`

- Import `copyEnvCommand` from `./commands/copy-env.js`.
- Add `program.addCommand(copyEnvCommand())`.

### Phase 3 — Update `osddt.start` template in `src/templates/shared.ts`

**Goal:** Auto-invoke `copy-env` in the worktree workflow with the resolved target path.

In the worktree workflow section of the `osddt.start` body, after step 4 (parse `start-worktree` output), insert:

```
5. Copy environment files into the new worktree.
   Read bare-path and mainBranch from .osddtrc to construct the source path:
   - Single repo:
     npx osddt copy-env --source <bare-path>/<mainBranch> --target <worktreePath>
   - Monorepo:
     npx osddt copy-env --source <bare-path>/<mainBranch>/<package-path> --target <worktreePath>/<package-path>
   If the command finds no files, it exits silently — this is not an error.
```

Renumber subsequent steps. Apply the same addition to the `osddt.fast` body.

### Phase 4 — Regenerate agent command files

- Run `osddt update` to regenerate all agent command files from the updated `shared.ts`.

### Phase 5 — Tests in `src/commands/copy-env.spec.ts`

Test cases:
- Returns silently (exit 0) when `--target` is omitted.
- Returns silently (exit 0) when `--source` is absent and no `copy-env.source` in `.osddtrc`.
- Copies matched files when source and target are clean.
- Skips existing target file when `--force` is not set.
- Overwrites existing target file when `--force` is set.
- Logs dry-run output without writing when `--dry-run` is set.
- Prints informative message and exits 0 when no files match.
- Uses `copy-env.source` from `.osddtrc` when `--source` is not provided.
- Uses `copy-env.pattern` from `.osddtrc` when `--pattern` is not provided.
- CLI `--source` takes precedence over `copy-env.source` in `.osddtrc`.
- CLI `--pattern` takes precedence over `copy-env.pattern` in `.osddtrc`.

## Technical Dependencies

| Dependency | Already present | Usage |
|---|---|---|
| `commander` | yes | CLI command definition |
| `fs-extra` | yes | File copy, existence checks |
| `globby` | yes | Glob file matching |

No new dependencies required.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `.osddtrc` absent or unreadable | Treat as empty config — fall through to flag or error |
| Globby pattern with `**` causes deep scan | Document that patterns are applied at the source root; `**` is technically allowed but not the intended use |

## Out of Scope

- Worktree resolution inside the command.
- Interactive prompts.
- `--all` flag.
- Reverse sync.
- Recursive scanning.
- Encryption or redaction.
