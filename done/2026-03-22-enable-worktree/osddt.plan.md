# Plan: Enable Worktree Workflow

## Architecture Overview

The worktree feature is built across three layers:

1. **CLI command** — a new `osddt worktree-start` command (registered in `src/index.ts`) that handles worktree creation, branch setup, `working-on/` scaffolding, and state file management.
2. **State file** — `.osddt-worktrees` (JSON array, sibling to repo root) is the single source of truth for active worktree features. Written by `worktree-start`, read by `done`, referenced by agent templates.
3. **Agent templates** — `osddt.start-worktree` (new), `osddt.continue` (updated), and `osddt.done` (updated) in `src/templates/shared.ts`. Templates call the CLI commands; they do not implement logic themselves.

### Key design decisions

- **CLI owns all logic**: Templates instruct the agent to run `npx osddt worktree-start` / `npx osddt done` — the CLI does the work. Templates are thin wrappers that pass context and arguments.
- **`--worktree` flag on `done`**: The `done` CLI command gains an optional `--worktree` flag. When passed, it reads `.osddt-worktrees`, runs `git worktree remove`, and strips the entry. Without the flag it behaves exactly as today.
- **State file location**: `../.osddt-worktrees` relative to the repo root (i.e. sibling to the repository directory). Absolute path is derived at runtime from the repo root via `git rev-parse --show-toplevel`.
- **Template `osddt.start-worktree`**: Sets the worktree context implicitly — the `--worktree` flag for `done` and the `.osddt-worktrees` lookup for `continue` are both driven by the state file written at start time. The template instructs the agent to call `npx osddt worktree-start`.
- **`osddt.continue` worktree awareness**: Template instructs the agent to run `npx osddt worktree-info <feature-name>` (new read-only command) to resolve the working directory from `.osddt-worktrees` before falling back to the main tree scan.

---

## Implementation Phases

### Phase 1 — CLI: `start-worktree` command

**Goal**: Implement `src/commands/start-worktree.ts` and register it.

Steps:
1. Resolve repo root via `git rev-parse --show-toplevel`.
2. Derive worktree base path: read `worktreeBase` from `.osddtrc` if present, else `<repo-root-parent>/<repo-name>-<feature-name>`.
3. Check if branch exists (local + remote); offer Resume / Abort if so.
4. Run `git worktree add <worktree-path> -b <branch-name>` (new branch) or `git worktree add <worktree-path> <branch-name>` (existing).
5. Resolve project path from `.osddtrc` (`single` → worktree root; `monorepo` → prompt for package, use `<worktree-root>/<package>`).
6. Create `<project-path>/working-on/<feature-name>/` inside the worktree.
7. Read `.osddt-worktrees` from `<repo-root-parent>/.osddt-worktrees`; append entry `{ featureName, branch, worktreePath, workingDir, repoRoot }`; write back.
8. Print summary: branch, worktree path, working directory.
9. Register command in `src/index.ts`.

### Phase 2 — CLI: `worktree-info` command

**Goal**: Implement `src/commands/worktree-info.ts` — read-only lookup used by the `osddt.continue` and `osddt.done` templates.

Steps:
1. Accept `<feature-name>` argument.
2. Read `.osddt-worktrees`; find entry by `featureName`.
3. Print JSON `{ worktreePath, workingDir, branch }` if found, exit with code 1 if not.

### Phase 3 — CLI: update `done` command

**Goal**: Extend `src/commands/done.ts` with worktree cleanup.

Steps:
1. Add `--worktree` flag to the `done` command.
2. When `--worktree` is set:
   a. Read `.osddt-worktrees` from the state file path (resolved from `--dir` or `process.cwd()`).
   b. Find the entry for `<feature-name>`.
   c. Run the existing move logic (archive to `done/`).
   d. Run `git worktree remove <worktreePath> --force`.
   e. Remove the entry from `.osddt-worktrees` and write back.
3. Without `--worktree`, existing behaviour is unchanged.

### Phase 4 — Template: `osddt.start-worktree`

**Goal**: Add new `osddt.start-worktree` entry to `COMMAND_DEFINITIONS` in `src/templates/shared.ts`.

Template flow:
1. Read `.osddtrc` and run `npx osddt meta-info` for context.
2. Derive branch / feature name (same rules as `osddt.start`).
3. Call `npx osddt start-worktree <feature-name> [--dir <package-path>]`.
4. Report the branch, worktree path, and working directory.
5. Next step: `/osddt.spec` (same as `osddt.start`).

### Phase 5 — Template: update `osddt.continue`

**Goal**: Update `osddt.continue` in `shared.ts` to resolve working directory via state file.

Changes:
1. Before the phase-detection table, instruct the agent to run `npx osddt worktree-info <feature-name>`.
2. If the command succeeds (exit 0), use the returned `workingDir` as the working directory.
3. If it fails (feature not in state file), fall back to the existing main-tree scan logic.

### Phase 6 — Template: update `osddt.done`

**Goal**: Update `osddt.done` in `shared.ts` to commit, push, then pass `--worktree` when appropriate.

Changes:
1. Instruct the agent to run `npx osddt worktree-info <feature-name>` first.
2. If found in state file (worktree feature):
   a. Run `git -C <worktreePath> status --porcelain` to check for uncommitted changes.
   b. If changes exist: run `git -C <worktreePath> diff` to inspect them, derive a conventional commit message from the diff, present it to the user for confirmation or override, then run `git -C <worktreePath> add -A && git -C <worktreePath> commit -m "<message>"`.
   c. Run `git -C <worktreePath> push --set-upstream origin <branch>` (handles both first push and subsequent pushes).
   d. Call `npx osddt done <feature-name> --dir <project-path> --worktree`.
3. Otherwise call `npx osddt done <feature-name> --dir <project-path>` (existing behaviour, no commit/push step).

### Phase 7 — Setup script

**Goal**: Add an `osddt setup-worktree` CLI command that validates the environment for worktree usage.

Steps:
1. Check git version supports worktrees (`git version >= 2.5`).
2. Confirm the repo is not already a worktree itself (`git rev-parse --is-inside-work-tree`).
3. Check that the sibling directory (or `worktreeBase`) is writable.
4. Print a readiness summary (pass/fail per check).
5. Register as `osddt setup-worktree` in `src/index.ts`.

### Phase 8 — Documentation

**Goal**: Update `CLAUDE.md`, `AGENTS.md`, and `README.md`.

Changes:
1. Add `osddt.start-worktree` to the Command Templates table.
2. Add `start-worktree`, `worktree-info`, `setup-worktree` to the CLI Commands table.
3. Document `.osddt-worktrees` state file format and location.
4. Document optional `worktreeBase` field in `.osddtrc`.
5. Add **Example D — Parallel feature workflow** showing the full worktree cycle:
   ```
   /osddt.start-worktree add-payment-gateway
   /osddt.spec
   /osddt.plan ...
   /osddt.tasks
   /osddt.implement
   /osddt.done
   ```
6. Add a "Parallel Development" section explaining the worktree workflow and when to use it.

### Phase 9 — Tests

**Goal**: Cover new CLI commands and template changes.

Tests to add:
- `start-worktree.spec.ts`: mock `fs-extra`, `child_process` (git commands); assert state file written, working dir created, branch created.
- `worktree-info.spec.ts`: assert correct JSON output when entry exists; assert exit 1 when not found.
- `setup-worktree.spec.ts`: assert pass/fail output for each environment check.
- `done.spec.ts`: extend existing tests — assert `git worktree remove` called when `--worktree` flag present; assert state entry removed.
- `shared.spec.ts`: assert `osddt.start-worktree` template is present in `COMMAND_DEFINITIONS`; assert `osddt.continue` and `osddt.done` templates reference `worktree-info`.

---

## Technical Dependencies

| Dependency | Already in project | Notes |
|---|---|---|
| `commander` 12.0.0 | Yes | Used for all CLI commands |
| `fs-extra` 11.2.0 | Yes | JSON read/write for `.osddt-worktrees` |
| `child_process` (Node built-in) | Yes (via existing commands) | `git worktree add/remove`, `git rev-parse` |
| `vitest` 4.0.18 | Yes | Test framework |

No new dependencies required.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Git version < 2.5 (no worktree support) | `worktree-setup` command checks git version upfront and fails fast with a clear message |
| `.osddt-worktrees` becomes stale (worktree removed manually) | `done` command checks filesystem before running `git worktree remove`; skips if path doesn't exist, still removes state entry |
| Monorepo package prompt adds friction to `worktree-start` | `--dir` flag allows non-interactive use in CI / scripted environments |
| State file written outside repo (sibling) may not be found on fresh clone | Documented clearly; `worktree-info` exits with a clear message if file absent |
| `done --worktree` run twice | Guard: check entry exists in state file before attempting `git worktree remove` |

---

## Out of Scope

- Gemini template changes (follow-up iteration).
- Bulk worktree management (list all, prune stale, etc.).
- IDE/editor integration (auto-open worktree in new window).
- Migrating an existing `osddt.start` feature to use a worktree post-hoc.
