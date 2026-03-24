# Plan: Fix `worktree-info` Command Issues

## Architecture Overview

Changes span three files: `src/utils/worktree.ts` (`.bare` filter), `src/commands/worktree-info.ts` (structured JSON errors), and `src/templates/shared.ts` (update `osddt.continue` template to parse the new JSON). Tests updated in `src/commands/worktree-info.spec.ts` and `src/utils/worktree.spec.ts`.

**Fix 1 — Filter `.bare` from feature worktrees**

`listFeatureWorktrees` (`src/utils/worktree.ts`) already skips the entry whose basename equals `mainBranch`. The `.bare` directory is not a `feat/` branch — its block in `git worktree list --porcelain` has no `branch` line (it is a bare repo). The fix is to skip any block that has no `branch` line (i.e. `branchMatch` is null/undefined) **or** whose basename starts with `.` (hidden directories). The cleanest approach: skip blocks where `branchMatch` is absent, since feature worktrees always have a branch ref.

Actually, re-reading the current code: `branch` falls back to `featureName` when `branchMatch` is null — so `.bare` currently passes through with `branch: '.bare'`. The minimal fix is to skip blocks where `branchMatch` is null (bare/detached worktrees have no `branch` line). This is both correct and safe — legitimate feature worktrees always have a branch ref.

**Fix 2 — Structured JSON error output on stdout**

Replace `console.error` + `process.exit(1)` in the three error paths of `runWorktreeInfo` with `console.log(JSON.stringify(...))` + `process.exit(1)`, using the error schema defined in the spec:

| Case | stdout JSON |
|------|-------------|
| Multiple worktrees, no arg | `{ "error": "multiple", "worktrees": [{ "featureName": "...", "branch": "..." }, ...] }` |
| No worktrees | `{ "error": "none" }` |
| Named feature not found | `{ "error": "not-found", "featureName": "..." }` |

## Implementation Phases

### Phase 1 — Fix `.bare` filtering in `listFeatureWorktrees`

- In `src/utils/worktree.ts`, inside `listFeatureWorktrees`, add a `continue` guard: if `branchMatch` is null, skip the block.
- This handles `.bare` (and any other bare/detached worktree) without touching the `mainBranch` filter.

### Phase 2 — Structured JSON errors in `worktree-info`

- In `src/commands/worktree-info.ts`, replace the three `console.error` / `process.exit` error paths:
  1. `entries.length === 0` → `console.log(JSON.stringify({ error: 'none' }))`
  2. `entries.length > 1` → `console.log(JSON.stringify({ error: 'multiple', worktrees: entries.map(e => ({ featureName: e.featureName, branch: e.branch })) }))`
  3. Named feature not found → `console.log(JSON.stringify({ error: 'not-found', featureName }))`

### Phase 3 — Update `osddt.continue` template

- In `src/templates/shared.ts`, update the `osddt.continue` command body: replace the exit code 1 instruction that says "display error output and stop" with structured JSON handling:
  - `"multiple"`: present the `worktrees` list to the user and ask them to pick one, then re-run `worktree-info <chosen>`.
  - `"none"`: inform the user no worktrees found and stop.
  - `"not-found"`: inform the user the feature was not found and stop.
- Rebuild the generated command file (`pnpm build` + `osddt update`) to regenerate `.claude/commands/osddt.continue.md` from the updated template.

### Phase 4 — Update tests

- In `src/commands/worktree-info.spec.ts`:
  - Update "given no argument and multiple feature worktrees" test: expect `console.log` called with `{ error: 'multiple', worktrees: [...] }` JSON; expect `console.error` NOT called.
  - Update "given no argument and zero feature worktrees" test: expect `console.log` called with `{ error: 'none' }` JSON; expect `console.error` NOT called.
  - Update "given a feature name argument that does not match" test: expect `console.log` called with `{ error: 'not-found', featureName: 'unknown-feature' }` JSON; expect `console.error` NOT called.
- In `src/utils/worktree.spec.ts` (if it exists): add a test case for a porcelain block without a `branch` line to confirm it is filtered out.

## Technical Dependencies

No new dependencies. Changes are pure TypeScript within existing modules.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Other callers of `listFeatureWorktrees` (e.g. `start-worktree.ts`) may rely on bare worktrees being included | Grep confirms `listFeatureWorktrees` is only called from `worktree-info.ts` — no impact |
| Callers of `worktree-info` CLI (e.g. `osddt.done`, `osddt.start` templates) parse its output | These templates only call `worktree-info <feature-name>` (with a name), which takes the success path (exit 0, JSON) — unchanged |
| Template change requires rebuilding generated command files | After editing `shared.ts`, run `pnpm build && osddt update` to regenerate `.claude/commands/osddt.continue.md` |

## Out of Scope

- Changes to `osddt.done` or `osddt.start` command handlers
- Changes to `listFeatureWorktrees` signature or return type
- Changes to other templates (`osddt.done`, `osddt.start`, etc.) — they call `worktree-info` with an explicit feature name and only consume exit-0 JSON output, which is unchanged
