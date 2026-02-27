# Plan: Improve Next Step Instructions for `osddt.start` and `osddt.research`

## Architecture Overview

`shared.ts` is the single source of truth for all command template content. Both `osddt.start` and `osddt.research` previously inlined a conditional `## Next Step` block that exposed the branch-name vs. human-readable-description classification to the user.

The refactor introduces a `getNextStepToSpec(args: ArgPlaceholder): string` function in `shared.ts` that owns the entire `## Next Step` block. It takes the args placeholder so it works for both Claude (`$ARGUMENTS`) and Gemini (`{{args}}`), and returns a single conditional block — one `## Next Step` heading with two indented variants. Both `body()` functions call it with one line: `${getNextStepToSpec(args)}`.

Additionally, `CLAUDE.md` and `AGENTS.md` are updated to document the new next step behaviour.

## Implementation Phases

### Phase 1 — Add `getNextStepToSpec()` to `shared.ts`

Add an exported function `getNextStepToSpec(args: ArgPlaceholder): string` that returns the full `## Next Step` block with two indented variants:

- **Description variant**: acknowledges the input will be used as the starting point for the spec, shows `/osddt.spec` with no required argument.
- **Branch variant**: prompts the user to run `/osddt.spec` with a brief feature description, includes an `e.g.` example to guide them.

Neither variant mentions "human-readable" or "branch name" to the user.

### Phase 2 — Update `osddt.research` body in `shared.ts`

Replace the previous conditional next step block with `${getNextStepToSpec(args)}`.

### Phase 3 — Update `osddt.start` body in `shared.ts`

Same change as Phase 2, applied to `osddt.start`.

### Phase 4 — Update tests in `shared.spec.ts`

- Replace the two-constant imports with `getNextStepToSpec`.
- Add a `describe('getNextStepToSpec', ...)` block asserting:
  - Contains `/osddt.spec`
  - Contains `starting point` (description variant)
  - Contains `e.g.` (branch variant)
  - Uses the provided args placeholder in the conditional text
- Update `osddt.research` and `osddt.start` test cases to assert `getNextStepToSpec('$ARGUMENTS')` appears in the body.
- Run `pnpm test` and confirm all tests pass.

### Phase 5 — Update documentation

- Update the `osddt.start behaviour` and `osddt.research behaviour` sections in `CLAUDE.md` and `AGENTS.md` to describe the two next step variants.

### Phase 6 — Regenerate command files

- Run `pnpm build && node dist/index.js setup --agents claude,gemini --repo-type single` to regenerate all command files.
- Verify `.claude/commands/osddt.start.md` and `.claude/commands/osddt.research.md` contain a single `## Next Step` heading with two properly indented variants and no user-facing classification language.

## Technical Dependencies

- No new libraries or dependencies.
- Source changes: `src/templates/shared.ts`, `src/templates/shared.spec.ts`.
- Documentation changes: `CLAUDE.md`, `AGENTS.md`.
- Generated files updated via `osddt setup`.

## Risks & Mitigations

- **Risk**: Template prose for the conditional is ambiguous and an agent misreads it.
  - **Mitigation**: Use explicit if/else bullet structure in the template body.
- **Risk**: Gemini TOML format may render the conditional differently.
  - **Mitigation**: Both `claude.ts` and `gemini.ts` import from `shared.ts`; confirmed by inspecting the regenerated TOML output.

## Out of Scope

- Changes to `osddt.spec`, `osddt.plan`, `osddt.tasks`, `osddt.implement`, `osddt.done`, or `osddt.continue` templates.
- Changes to feature name derivation logic or branch handling.
- Changes to README.md (user-facing docs don't describe internal agent next step behaviour).
