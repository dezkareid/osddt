# Tasks: Improve Next Step Instructions for `osddt.start` and `osddt.research`

## Phase 1 — Add `getNextStepToSpec()` to `shared.ts`

- [x] [S] Add exported `getNextStepToSpec(args: ArgPlaceholder): string` function to `src/templates/shared.ts` — returns a single `## Next Step` block with two indented variants (description and branch), neither exposing input classification language to the user

**Definition of Done**: Function is exported, contains `/osddt.spec`, both variants present, no "human-readable" or "branch name" in user-facing text.

## Phase 2 — Update `osddt.research` body

- [x] [S] Replace the conditional next step block in `osddt.research` body with `${getNextStepToSpec(args)}`

**Definition of Done**: `osddt.research` body uses `getNextStepToSpec(args)` — one call, no duplication.

## Phase 3 — Update `osddt.start` body

- [x] [S] Same change as Phase 2 applied to `osddt.start` body

**Definition of Done**: `osddt.start` body uses `getNextStepToSpec(args)` — one call, no duplication.

## Phase 4 — Update tests

- [x] [S] Replace two-constant imports with `getNextStepToSpec`; add `describe('getNextStepToSpec', ...)` block asserting: contains `/osddt.spec`, contains `starting point`, contains `e.g.`, uses provided args placeholder
- [x] [S] Update `osddt.research` and `osddt.start` test cases to assert `getNextStepToSpec('$ARGUMENTS')` appears in the body
- [x] [S] Run `pnpm test` and confirm all tests pass (118 tests)

**Definition of Done**: All tests pass; `getNextStepToSpec` is covered by tests.

## Phase 5 — Update documentation

- [x] [M] Update `osddt.start behaviour` and `osddt.research behaviour` sections in `CLAUDE.md` to describe the two next step variants
- [x] [S] Apply the same documentation changes to `AGENTS.md`

**Definition of Done**: Both agent instruction files document the context-aware next step behaviour for both entry point commands.

## Phase 6 — Regenerate command files

- [x] [S] Run `pnpm build && node dist/index.js setup --agents claude,gemini --repo-type single` to regenerate command files
- [x] [S] Verify `.claude/commands/osddt.start.md` and `.claude/commands/osddt.research.md` contain a single `## Next Step` heading with two indented variants and no user-facing classification language

**Definition of Done**: Generated command files match the updated template.

## Dependencies

- Phase 2 and Phase 3 depend on Phase 1 (function must exist before being called).
- Phase 4 depends on Phases 1–3 (tests validate the final state).
- Phase 5 is independent and can run in parallel with Phases 1–4.
- Phase 6 depends on Phase 4 (regenerate after source and tests are confirmed correct).
