# Plan: Unified Setup and Start Flow for Worktrees

## Architecture Overview

Three layers are affected:

1. **CLI (`src/commands/setup.ts`)** — absorbs the environment checks and state-file initialisation from `setup-worktree.ts`. Gains a `--worktree-repository <url>` flag and an optional interactive URL prompt. Writes `"worktree-repository": "<url>"` into `.osddtrc` when provided. The `setup-worktree.ts` file is deleted; its helper functions are either inlined into `setup.ts` or extracted to `src/utils/worktree.ts`.

2. **Templates (`src/templates/shared.ts`)** — the `osddt.start-worktree` command definition is removed. The `osddt.start` definition is extended to read `.osddtrc`, detect the `"worktree-repository"` field, and branch between the standard `git checkout -b` flow and the `osddt start-worktree` CLI call.

3. **Documentation (`README.md`, `AGENTS.md`)** — updated to reflect: new `--worktree-repository <url>` flag, new `.osddtrc` shape, removal of `osddt setup-worktree` command and `osddt.start-worktree` template, unified `osddt.start` behaviour.

### `.osddtrc` shape after this change

```json
// worktree mode
{ "repoType": "single", "agents": ["claude"], "worktree-repository": "https://github.com/org/repo.git" }

// standard mode
{ "repoType": "single", "agents": ["claude"] }
```

The `"worktree-repository"` field holds the plain repository URL. Its presence signals worktree mode; its value is used directly (no prefix to strip).

---

## Implementation Phases

### Phase 1 — Extend `OsddtConfig` type and `setup.ts`

**Goal**: `osddt setup` handles worktree configuration inline; `setup-worktree.ts` is deleted.

Steps:
1. Add `"worktree-repository"?: string` to the `OsddtConfig` interface in `setup.ts`.
2. Add `--worktree-repository <url>` option to the Commander command definition.
3. Add `askWorktreeUrl()` to `src/utils/prompt.ts` — an optional `input` prompt that accepts a blank answer (skips worktree setup).
4. In `runSetup()`, after `repoType` is resolved:
   - Non-interactive: if `--worktree-repository <url>` was passed, validate it is a non-empty string and store as-is.
   - Interactive: call `askWorktreeUrl()`; if non-empty, store the value.
5. When a URL is provided, run the three environment checks (git version, not-a-worktree, target-writable) and `initStateFile()` — move these functions from `setup-worktree.ts` to `src/utils/worktree.ts`.
6. If any check fails, print errors and `process.exit(1)` — do not write `.osddtrc`.
7. Pass `"worktree-repository"` into `writeConfig()` only when defined; omit the field otherwise.
8. Delete `src/commands/setup-worktree.ts` and remove its registration from `src/index.ts`.
9. Update `src/commands/setup.spec.ts` to cover: `--worktree-repository` flag writes plain URL; blank interactive URL omits field; environment checks run when URL is provided; check failure prevents config write.
10. Delete `src/commands/setup-worktree.spec.ts`; add `src/utils/worktree.spec.ts` to cover the extracted check functions.

### Phase 2 — Unify `osddt.start` and `osddt.start-worktree` templates

**Goal**: A single `osddt.start` template drives both workflows. `osddt.start-worktree` definition is removed.

Steps:
1. In `src/templates/shared.ts`, remove the `osddt.start-worktree` entry from `COMMAND_DEFINITIONS`.
2. Rewrite the `osddt.start` body to:
   - Read `.osddtrc` and check for `"worktree-repository"` field.
   - **If present**: use the URL directly; follow the worktree flow (derive branch/feature name → run `npx osddt start-worktree <feature-name>` → navigate into worktree directory → report paths).
   - **If absent**: follow the existing standard flow (derive branch/feature name → `git checkout -b` → create `working-on/` folder → report).
   - Both paths share the same feature-name derivation rules and constraints.
3. Update `src/templates/shared.spec.ts`: remove `osddt.start-worktree` tests; add tests asserting the `osddt.start` body references `worktree-repository` and `start-worktree`.
4. Run `pnpm build && node dist/index.js update` to regenerate all agent command files.
5. Delete the generated `osddt.start-worktree.md` from `.claude/commands/` (and `.gemini/commands/` if present).

### Phase 3 — Update documentation

**Goal**: `README.md` and `AGENTS.md` reflect the new unified surface.

Changes:
- Remove all references to `osddt setup-worktree` command.
- Remove all references to `osddt.start-worktree` template.
- Update `.osddtrc` example to show the `"worktree-repository"` field.
- Update the `osddt setup` options table to include `--worktree-repository <url>`.
- Update the command templates table to remove `osddt.start-worktree` row.
- Update Example D (parallel worktree workflow) to start with `osddt setup --worktree-repository <url>` and use `/osddt.start` instead of `/osddt.start-worktree`.
- Add a migration note: existing projects should manually delete `osddt.start-worktree.*` files from their agent command directories, as `osddt update` will no longer regenerate them but will not delete them either.

---

## Technical Dependencies

| Dependency | Already present | Notes |
|---|---|---|
| `commander` 12.0.0 | ✓ | New `--worktree-repository` option added to existing command |
| `@inquirer/input` | Needs adding | Used by new `askWorktreeUrl()` prompt |
| `fs-extra` 11.2.0 | ✓ | State file init already uses it |
| `child_process` (built-in) | ✓ | Git checks already use it |

> `@inquirer/input` must be added at its exact version. Check the current `@inquirer/select` and `@inquirer/checkbox` versions in `package.json` and use the same major.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Projects with existing `.osddtrc` containing `"worktrees"` (old field name) will not be recognised as worktree mode | Document the breaking change; re-running `osddt setup --worktree-repository <url>` will rewrite `.osddtrc` correctly |
| Deleting `setup-worktree.spec.ts` removes coverage of the check functions | Extract check functions to `src/utils/worktree.ts` and add `src/utils/worktree.spec.ts` |
| The unified `osddt.start` template body becomes long | Keep the two branches clearly labelled in the template text |
| `osddt update` stops generating `osddt.start-worktree.*` but won't delete old ones | Add migration note to `README.md` |

---

## Out of Scope

- Removing the `osddt start-worktree` CLI command — it remains the internal mechanism.
- Changing `osddt done` or `osddt continue` logic.
- Gemini template changes (follow-up).
- Auto-detecting the remote URL from `git remote`.
