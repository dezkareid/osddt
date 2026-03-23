# Plan: Fix `osddt.continue` Feature Selection in Worktree Mode

## Architecture Overview

Two independent changes are required:

1. **`src/commands/worktree-info.ts`** — remove the interactive `readline` selection in the multi-worktree no-argument path. Replace it with a `console.error` listing all available features and a `process.exit(1)`.

2. **`src/templates/shared.ts`** — update the `osddt.continue` template body to:
   - In worktree mode: when `worktree-info` exits with code 1, show the printed list and stop — do **not** fall through to the standard `working-on/` scan.
   - In standard mode: replace the "ask them to pick one" instruction with "display the list and stop, tell user to re-run with a feature name".

Both changes are self-contained; no new dependencies are needed.

---

## Implementation Phases

### Phase 1 — Fix `worktree-info.ts`

**Goal:** Eliminate the interactive `readline` prompt when multiple worktrees exist and no argument is given.

**Changes:**
- In `runWorktreeInfo`, remove the `selectWorktree()` call in the `else` branch (entries.length > 1).
- Replace it with:
  ```
  console.error('Multiple feature worktrees found. Re-run with a feature name:');
  entries.forEach(e => console.error(`  - ${e.featureName} (${e.branch})`));
  process.exit(1);
  ```
- The `selectWorktree` helper function and `readline`/`prompt` helpers can be removed entirely (nothing else in this file uses them after the change).

**Files:**
- `src/commands/worktree-info.ts`

---

### Phase 2 — Update `osddt.continue` template in `shared.ts`

**Goal:** Fix both the worktree-mode fallthrough bug and the interactive-selection wording in standard mode.

#### 2a — Worktree mode block (lines ~141–148)

Current wording:
> `exit code 1`: no matching worktree found — fall back to the standard resolution below.

New wording: distinguish between "no argument given, multiple worktrees" (exit 1 from the new behaviour) vs "no worktrees at all" (exit 1). In both cases, the template must **stop** — not fall through. The agent should display the error output from `worktree-info` and instruct the user to re-run with a feature name.

Change the worktree-mode block to:
```
2. Run `<npxCommand> worktree-info` (pass `<feature-name>` as argument if one was derived, otherwise run without arguments):
   - exit code **0**: parse the JSON and use the returned `workingDir` as the working directory.
   - exit code **1**: display the error output from `worktree-info` to the user, then stop and instruct them to re-run the command with the chosen feature name as an argument (e.g. `/osddt.continue <feature-name>`). Do **not** fall back to the standard resolution below.
```

#### 2b — Standard mode block (lines ~153–157)

Current wording:
> If there are **multiple folders**, present the list to the user and ask them to pick one.

New wording:
> If there are **multiple folders**, display the list as a numbered or bulleted enumeration, then stop and instruct the user to re-run the command with the chosen feature name as an explicit argument (e.g. `/osddt.continue <feature-name>`).

**Files:**
- `src/templates/shared.ts`

---

### Phase 3 — Update tests

**Goal:** Keep the test suite green; add coverage for the new `worktree-info` behaviour.

#### `worktree-info.spec.ts`

- Add a new `describe` block: `given no argument and multiple feature worktrees`.
  - Should print each feature name and branch to stderr.
  - Should exit with code 1.
  - Should **not** call `console.log` (no JSON output).

#### `shared.spec.ts`

- Update the existing test `should instruct listing working-on/ folders in standard mode or after worktree-info fallback`:
  - The standard-mode block should still mention `working-on/` and `no arguments were provided` — the assertion remains valid.
  - Add an assertion that the body does **not** contain "ask them to pick" (or equivalent interactive language).
- Update/add a test for the worktree-mode block to assert:
  - exit code **1** path instructs the user to re-run with a feature name.
  - The word "fall back" or fallthrough to standard mode is absent from the worktree exit-1 instruction.

**Files:**
- `src/commands/worktree-info.spec.ts`
- `src/templates/shared.spec.ts`

---

## Technical Dependencies

No new runtime or dev dependencies required.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Removing `readline`/`prompt` from `worktree-info.ts` — ensure nothing else in that file depends on them | Both helpers (`prompt` and `selectWorktree`) are only used in the interactive path being removed; can be deleted. |
| Template string changes break existing snapshot-style tests in `shared.spec.ts` | Read current assertions before editing; update any string-match tests that reference the old wording. |

---

## Out of Scope

- Changes to `osddt.start`, `osddt.done`, or any other command templates.
- Changes to `.osddtrc` structure or the worktree state file format.
- Adding `--no-interactive` flags or new CLI options.
- Changes to other CLI commands (`setup`, `done`, `start-worktree`, etc.).
