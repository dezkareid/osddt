# Plan: Fix Done Workflow — Commit Before Worktree Removal

## Architecture Overview

Two independent changes are needed:

1. **CLI guard in `done.ts`** — Before moving the working-on folder or removing the worktree, run `git status --porcelain` inside the worktree. If output is non-empty, abort immediately with a clear error. This is a safety net: even if the agent template is perfect, the CLI enforces correct ordering.

2. **Template fix in `shared.ts`** — The `osddt.done` body in `shared.ts` currently places the `osddt done --worktree` call (step 4) *before* the git status check and commit steps (steps 6–8). The steps must be reordered so: check status → commit if dirty → push → then run `osddt done --worktree`. This is the fix to agent behaviour.

Note: the generated `.claude/commands/osddt.done.md` already has the correct order (from a prior PR), but `shared.ts` does not — so `osddt update` would regenerate a broken template. Both must be fixed together.

After fixing `shared.ts`, `osddt update` must be run to regenerate `.claude/commands/osddt.done.md` (and any other agent files) so the generated files are in sync.

## Implementation Phases

### Phase 1 — CLI guard in `done.ts`

**Goal:** Abort before any destructive action when the worktree is dirty.

- In `runDone`, after resolving `worktreePath` but before `fs.move`, add a check:
  - If `--worktree` flag is set and `worktreePath` is defined and the path exists:
    - Run `execSync('git status --porcelain', { cwd: worktreePath, encoding: 'utf8', stdio: 'pipe' })`
    - If the output is non-empty (trimmed), print an error and `process.exit(1)` — do not move or remove anything.
- The guard runs before `fs.move` and before `git worktree remove`.
- No change to the standard (non-worktree) code path.

### Phase 2 — Fix template order in `shared.ts`

**Goal:** The agent template must guide commit → push → done, in that exact order.

Reorder the `osddt.done` body steps to:

1. Confirm all tasks checked off.
2. Run `worktree-info` to determine workflow type.
3. For standard: run `osddt done --dir` and skip to step 9.
4. (Worktree path) Check for uncommitted changes: `git -C <worktreePath> status --porcelain`
5. If dirty: inspect diff, propose conventional commit message, confirm with user, commit.
6. Push branch: `git -C <worktreePath> push --set-upstream origin <branch>`
7. Run `osddt done <feature> --dir <project-path> --worktree`
8. Report result with full destination path.

### Phase 3 — Update tests in `done.spec.ts`

**Goal:** Cover the new dirty-worktree guard.

Add two new test cases inside a new `describe` block:

- **"given --worktree flag and worktree has uncommitted changes"**:
  - Mock `execSync` to return a non-empty string (e.g. `'M src/index.ts\n'`) when called with `git status --porcelain`.
  - Assert `process.exit(1)` is called.
  - Assert `fs.move` is **not** called.
  - Assert `git worktree remove` is **not** called.

- **"given --worktree flag and worktree is clean"**:
  - Mock `execSync` to return `''` for `git status --porcelain` and `''` for `git worktree remove`.
  - Assert `fs.move` is called.
  - Assert `git worktree remove` is called.

The existing worktree test already covers the clean case implicitly (it mocks `execSync` to return `''`), but an explicit clean-worktree test makes the contract clear. Update the existing `beforeEach` mock to ensure `execSync` returns `''` by default so existing tests are unaffected.

### Phase 4 — Regenerate agent command files

**Goal:** Keep generated files in sync with `shared.ts`.

Run `osddt update` after fixing `shared.ts` to regenerate `.claude/commands/osddt.done.md` (and `.gemini/commands/osddt.done.toml` if Gemini is configured).

## Technical Dependencies

- `child_process.execSync` — already used in `done.ts`; use `{ encoding: 'utf8', stdio: 'pipe' }` so output is captured as a string (not inherited/piped to stdout).
- `vitest` mocks — `vi.mocked(execSync)` already set up in `done.spec.ts`; need to differentiate calls by command string for the new test cases.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `execSync` throws when git is not available or the path is not a git repo | Wrap in try/catch; treat errors as "unable to verify — abort with an informative message" |
| Existing tests break because `execSync` mock now needs to handle two different calls (status + remove) | Use `mockImplementation` keyed on the command string in the new test cases; leave existing tests using `mockReturnValue('')` which covers both calls |

## Assumptions

- The agent already has `worktreePath` from `worktree-info` output; the template fix does not change how paths are resolved.
- No changes are needed to `worktree-info`, `start-worktree`, or any other CLI command.
- Gemini template regeneration is handled by `osddt update` and does not require manual edits.

## Out of Scope

- Auto-committing from within the CLI.
- Enforcing push from within the CLI.
- Any changes to the standard (non-worktree) done workflow.
- Changes to other command templates.
