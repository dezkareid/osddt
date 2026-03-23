# Plan: Fix continue workflow for worktrees

## Architecture Overview

The bug lives entirely in the `osddt.continue` command template body in `src/templates/shared.ts`. The `RESOLVE_FEATURE_NAME` constant (shared with `osddt.plan` and `osddt.tasks`) always resolves the working directory by listing `<project-path>/working-on/` — a path derived from `.osddtrc` in the main worktree. For worktree setups this path is wrong; the `working-on/` folder lives inside the feature's worktree, not the main worktree.

The fix is to rewrite the `osddt.continue` command body so that it diverges early, before any filesystem lookup:

1. **Read `.osddtrc` first** (step that already exists via `getRepoPreamble`).
2. **If `worktree-repository` is present** — resolve the feature name from arguments (if any), then call `npx osddt worktree-info [<feature-name>]` to get the correct `workingDir` from the state file. The CLI already handles the no-argument case (lists worktrees, prompts if multiple).
3. **If `worktree-repository` is absent** — use the existing `RESOLVE_FEATURE_NAME` logic unchanged (list `working-on/` folders under main project path).

No changes are needed to the TypeScript CLI. No changes are needed to `RESOLVE_FEATURE_NAME`, `getRepoPreamble`, or any other shared constant — the `osddt.continue` body function will simply not use `RESOLVE_FEATURE_NAME` and will inline its own resolution logic.

The updated template must also be regenerated into `.claude/commands/osddt.continue.md` (and `.gemini/commands/osddt.continue.toml` if Gemini is configured). Running `npx osddt update` achieves this.

## Implementation Phases

### Phase 1 — Update the `osddt.continue` template body in `shared.ts`

- Rewrite the `body` function for the `osddt.continue` command definition in `COMMAND_DEFINITIONS`.
- Replace the unconditional `${RESOLVE_FEATURE_NAME}` prefix with a two-branch instruction block:
  - **Worktree mode** (when `worktree-repository` present): derive feature name from args (if provided), then call `worktree-info [<feature-name>]`, use returned `workingDir`.
  - **Standard mode** (when `worktree-repository` absent): preserve existing `RESOLVE_FEATURE_NAME` logic exactly.
- The phase-detection table and Open Questions check that follow remain unchanged.

### Phase 2 — Regenerate the command files

- Run `pnpm build` to compile the updated template source.
- Run `npx osddt update` (or `node dist/index.js update`) to regenerate `.claude/commands/osddt.continue.md` (and `.gemini/commands/osddt.continue.toml` if present).
- Verify the generated file contains the new two-branch resolution logic.

### Phase 3 — Update tests

- Update or add a test for the `osddt.continue` command body in the template spec (`src/templates/shared.spec.ts` or `src/templates/claude.spec.ts`) to assert:
  - When `worktree-repository` is present in the rendered context, the output contains `worktree-info` instructions.
  - When `worktree-repository` is absent, the output contains the standard `RESOLVE_FEATURE_NAME` listing logic.

## Technical Dependencies

- `src/templates/shared.ts` — only file with source changes.
- `src/templates/claude.ts` / `src/templates/gemini.ts` — no changes; they render whatever `shared.ts` produces.
- `npx osddt worktree-info` (no-argument form) — already implemented and functional; used in the new template instruction.
- `pnpm build` + `osddt update` — required to propagate the source change into the generated command files.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `RESOLVE_FEATURE_NAME` is also used by `osddt.plan` and `osddt.tasks` — changing it would break those | Do not touch `RESOLVE_FEATURE_NAME`; write standalone logic inside the `osddt.continue` body only |
| The worktree-info no-argument path is interactive (prompts user to select) which is correct agent behaviour, but the template must make clear the agent should parse the JSON from stdout | Template instructions already model this pattern for the with-argument case; apply the same pattern for no-argument case |
| Generated files in `.claude/commands/` must be kept in sync with source | `osddt update` is the standard mechanism; covered in Phase 2 |

## Out of Scope

- Changes to `osddt.done`, `osddt.implement`, `osddt.tasks` templates.
- Changes to the TypeScript CLI (`worktree-info`, `start-worktree`, etc.).
- Changes to `RESOLVE_FEATURE_NAME`, `getRepoPreamble`, or any other shared constant.
- Gemini template changes beyond what `osddt update` produces automatically.
