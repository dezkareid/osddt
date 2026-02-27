# Plan: Improve Next Step Instructions for `osddt.start` and `osddt.research`

## Architecture Overview

`shared.ts` is the single source of truth for all command template content. Both `osddt.start` and `osddt.research` currently inline a conditional `## Next Step` block that exposes the branch-name vs. human-readable-description classification to the user.

The refactor replaces the existing conditional with two cleaner exported helper strings — one per input-type variant — and wires them into both `body()` functions. The conditional logic stays in the template (the agent still branches on input type) but the user-facing text no longer mentions the classification. The same two variants are used by both `osddt.start` and `osddt.research`, keeping them consistent.

Additionally, `CLAUDE.md` (and `AGENTS.md` / `GEMINI.md`) are updated to document the new next step behaviour.

## Implementation Phases

### Phase 1 — Replace `NEXT_STEP_TO_SPEC` with two variant constants in `shared.ts`

The current `NEXT_STEP_TO_SPEC` constant (added earlier in this branch) is replaced by two named constants:

- `NEXT_STEP_TO_SPEC_FROM_DESCRIPTION` — used when input was a human-readable description:
  ```
  ## Next Step

  Your description will be used as the starting point for the spec. Run:

  ```
  /osddt.spec
  ```

  > You can append more details if you want the spec to capture additional context.
  ```

- `NEXT_STEP_TO_SPEC_FROM_BRANCH` — used when input was a branch name or no arguments:
  ```
  ## Next Step

  Run the following command to write the feature specification:

  ```
  /osddt.spec
  ```

  > You can optionally provide a brief description to give the spec more context.
  ```

Place both after `WORKING_DIR_STEP` / `RESOLVE_FEATURE_NAME`, before `COMMAND_DEFINITIONS`. Remove `NEXT_STEP_TO_SPEC`.

### Phase 2 — Update `osddt.research` body in `shared.ts`

Replace the current `${NEXT_STEP_TO_SPEC}` reference with the conditional:

```
- If ${args} was a human-readable description → use NEXT_STEP_TO_SPEC_FROM_DESCRIPTION
- If ${args} was a branch name or no arguments → use NEXT_STEP_TO_SPEC_FROM_BRANCH
```

The branching is expressed in template prose instructing the agent — not shown to the user.

### Phase 3 — Update `osddt.start` body in `shared.ts`

Same change as Phase 2, applied to `osddt.start`.

### Phase 4 — Update tests in `shared.spec.ts`

- Remove the import and tests for `NEXT_STEP_TO_SPEC`.
- Import and add `describe` blocks for both `NEXT_STEP_TO_SPEC_FROM_DESCRIPTION` and `NEXT_STEP_TO_SPEC_FROM_BRANCH`, each asserting:
  - Contains `/osddt.spec`
  - Does not contain `human-readable` or `branch name`
  - Contains the appropriate tone marker (`starting point` / `optionally`)
- Update `osddt.research` and `osddt.start` test cases to assert both variant strings appear in the body.
- Run `pnpm test` and confirm all tests pass.

### Phase 5 — Update documentation

- Update the `osddt.start behaviour` and `osddt.research behaviour` sections in `CLAUDE.md` to describe the two next step variants.
- Keep `AGENTS.md` and `GEMINI.md` in sync with the same changes.

### Phase 6 — Regenerate command files

- Run `pnpm build && node dist/index.js setup --agents claude,gemini --repo-type single` to regenerate all command files.
- Verify `.claude/commands/osddt.start.md` and `.claude/commands/osddt.research.md` contain the updated conditional next step text with no user-facing classification language.

## Technical Dependencies

- No new libraries or dependencies.
- Source changes: `src/templates/shared.ts`, `src/templates/shared.spec.ts`.
- Documentation changes: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`.
- Generated files updated via `osddt setup`.

## Risks & Mitigations

- **Risk**: Template prose for the conditional is ambiguous and an agent misreads it.
  - **Mitigation**: Write the conditional instruction clearly with explicit "if/else" structure in the template body.
- **Risk**: Gemini TOML format may render the conditional differently.
  - **Mitigation**: Both `claude.ts` and `gemini.ts` import from `shared.ts`; confirm the TOML output after regeneration.

## Out of Scope

- Changes to `osddt.spec`, `osddt.plan`, `osddt.tasks`, `osddt.implement`, `osddt.done`, or `osddt.continue` templates.
- Changes to feature name derivation logic or branch handling.
- Changes to README.md (user-facing docs don't describe internal agent next step behaviour).
