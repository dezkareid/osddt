# Tasks: Improve Next Step Instructions for `osddt.start` and `osddt.research`

## Phase 1 — Replace constant with two variants in `shared.ts`

- [x] [S] Replace `NEXT_STEP_TO_SPEC` with two exported constants: `NEXT_STEP_TO_SPEC_FROM_DESCRIPTION` (acknowledges description as starting point) and `NEXT_STEP_TO_SPEC_FROM_BRANCH` (neutral prompt with optional-context note) — neither mentions "human-readable" or "branch name"

**Definition of Done**: Both constants are exported from `shared.ts`, each contains `/osddt.spec`, and neither exposes input classification language.

## Phase 2 — Update `osddt.research` body

- [x] [S] Replace the current `${NEXT_STEP_TO_SPEC}` reference in `osddt.research` body with a conditional that uses `NEXT_STEP_TO_SPEC_FROM_DESCRIPTION` when input was a description and `NEXT_STEP_TO_SPEC_FROM_BRANCH` when input was a branch name or absent

**Definition of Done**: `osddt.research` body instructs the agent to vary tone by input type without exposing classification language to the user.

## Phase 3 — Update `osddt.start` body

- [x] [S] Same change as Phase 2 applied to `osddt.start` body

**Definition of Done**: `osddt.start` body instructs the agent to vary tone by input type without exposing classification language to the user.

## Phase 4 — Update tests

- [x] [S] Remove `NEXT_STEP_TO_SPEC` import and tests; import `NEXT_STEP_TO_SPEC_FROM_DESCRIPTION` and `NEXT_STEP_TO_SPEC_FROM_BRANCH`; add `describe` blocks for each asserting: contains `/osddt.spec`, no classification language, correct tone marker
- [x] [S] Update `osddt.research` and `osddt.start` test cases to assert both variant strings appear in the body
- [x] [S] Run `pnpm test` and confirm all tests pass

**Definition of Done**: All tests pass; both variant constants are covered by tests.

## Phase 5 — Update documentation

- [x] [M] Update `osddt.start behaviour` and `osddt.research behaviour` sections in `CLAUDE.md` to describe the two next step variants (description input vs. branch/no-args input)
- [x] [S] Apply the same documentation changes to `AGENTS.md` and `GEMINI.md`

**Definition of Done**: All three agent instruction files document the context-aware next step behaviour for both entry point commands.

## Phase 6 — Regenerate command files

- [x] [S] Run `pnpm build && node dist/index.js setup --agents claude,gemini --repo-type single` to regenerate command files (includes refactor to `getNextStepToSpec` function)
- [x] [S] Verify `.claude/commands/osddt.start.md` and `.claude/commands/osddt.research.md` contain the updated conditional next step with no user-facing classification language

**Definition of Done**: Generated command files match the updated template; no "human-readable" or "branch name" language appears in the next step sections.

## Dependencies

- Phase 2 and Phase 3 depend on Phase 1 (constants must exist before being referenced).
- Phase 4 depends on Phases 1–3 (tests validate the final state).
- Phase 5 is independent and can run in parallel with Phases 1–4.
- Phase 6 depends on Phase 4 (regenerate after source and tests are confirmed correct).
