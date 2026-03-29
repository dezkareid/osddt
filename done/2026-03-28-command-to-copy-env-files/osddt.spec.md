# Spec: Command to Copy Environment Files to Worktrees

## Overview

When working with git worktrees, each worktree is an isolated checkout of the repository — it does not share files that are gitignored from the main working directory. Environment files (`.env`, `.env.local`, `.env.development`, etc.) are typically gitignored and therefore absent from every newly created worktree. Developers must manually copy them from the main project each time a new worktree is created, which is error-prone and easy to forget.

This feature adds an `osddt copy-env` CLI command that copies environment files from a source directory to a target directory. The command has no knowledge of worktrees — it is a simple file copier. Worktree path resolution is the responsibility of the caller (the agent template), which passes the resolved target path directly.

## Requirements

1. The command copies files matching a glob pattern from a source directory to a target directory.
2. The command always exits with code 0, regardless of errors, missing flags, or missing files — it fails silently.
3. `--target <path>` is required. If omitted, the command exits silently with code 0 without copying anything.
4. `--source <path>` is optional. If omitted, the source is read from `copy-env.source` in `.osddtrc`; if that is also absent, the command exits silently with code 0.
5. The glob pattern defaults to `.env*`. It can be overridden via `--pattern` (comma-separated) or `copy-env.pattern` in `.osddtrc`. CLI flag takes precedence over config.
6. If a target file already exists and `--force` is not set, the file is **skipped** silently.
7. The command logs each file copied (`Copied: <src> → <dest>`) and each file skipped (`Skipped: <dest> (already exists)`).
8. If no files match the pattern in the source directory, the command exits silently with code 0.
9. `--force` overwrites existing target files.
10. `--dry-run` prints what would be copied without writing any files, then exits with code 0.

## Scope

**In scope:**
- A new `osddt copy-env` CLI command.
- `.osddtrc` configuration keys `copy-env.source` and `copy-env.pattern` for project-level defaults.
- Glob-based file matching (default `.env*`), shallow (non-recursive).
- Skip-on-conflict default; `--force` to overwrite.
- `--dry-run` mode.
- Integration into the `osddt.start` agent template: the worktree workflow path resolves the target path from `start-worktree` output and passes it as `--target <path>` to `osddt copy-env`.

**Out of scope:**
- Any worktree awareness inside the command itself.
- Any interactive prompts.
- `--all` flag to copy to multiple targets at once.
- Syncing files back from target to source.
- Recursive directory scanning.
- Encrypting or redacting env file contents.

## Acceptance Criteria

1. Running `osddt copy-env --target <path>` with `copy-env.source` set in `.osddtrc` copies `.env*` files from the configured source to `<path>`.
2. Running `osddt copy-env --source <src> --target <dest>` copies matching files regardless of `.osddtrc`.
3. Running `osddt copy-env` without `--target` exits silently with code 0.
4. Running `osddt copy-env` without `--source` and no `copy-env.source` in `.osddtrc` exits silently with code 0.
5. Running with `--pattern ".env*,.secret*"` copies files matching either glob.
6. Running with `--force` overwrites existing files in the target.
7. Running with `--dry-run` logs what would be copied without writing anything.
8. If a target file exists and `--force` is not set, it is skipped and logged.
9. If no files match, exits silently with code 0.
10. The command never exits with a non-zero code under any circumstance.
11. The `osddt.start` agent template constructs both paths from `.osddtrc` and `start-worktree` output, then invokes:
    - Single repo: `osddt copy-env --source <bare-path>/<mainBranch> --target <worktreePath>`
    - Monorepo: `osddt copy-env --source <bare-path>/<mainBranch>/<package-path> --target <worktreePath>/<package-path>`
    If `copy-env` finds no files, it exits cleanly and the start workflow continues.

## Decisions

1. **No worktree awareness in the command**: the command is a pure file copier. Source and target are plain directory paths.
2. **`--target` always required**: no default — the caller must always be explicit about the destination.
3. **`--source` from config or flag**: if neither is provided, error out.
4. **Non-interactive**: the command never prompts.
5. **Fail silently**: the command always exits with code 0. Missing flags, missing source, unreadable paths, and copy errors are all silent — the command simply does nothing in those cases.
5. **`.osddtrc` configuration**: `copy-env.source` and `copy-env.pattern` set project-level defaults. CLI flags take precedence.
6. **Multiple target worktrees**: one-at-a-time only. No `--all` in v1.
7. **Integration with `osddt.start`**: the template resolves the worktree path and passes it as `--target`. The command itself does not know it is being used with worktrees.
