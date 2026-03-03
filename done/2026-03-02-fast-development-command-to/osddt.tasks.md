# Tasks: Fast Development Command (`osddt.fast`)

## Phase 1 — Define the command in `shared.ts`

- [x] [M] Add `osddt.fast` entry to `COMMAND_DEFINITIONS` in `src/templates/shared.ts` with a body that runs `getRepoPreamble`, applies feature name derivation and branch/working-directory creation, then sequentially generates spec, plan (with `## Assumptions`), and tasks without pausing for user input
- [x] [S] Verify the new entry is picked up by `getClaudeTemplates` and `getGeminiTemplates` (smoke-check by inspecting their output in a test or dry run)

**Dependencies**: None — can start immediately.

**Definition of Done**: `COMMAND_DEFINITIONS` contains `{ name: 'osddt.fast', ... }` and the body returns a well-formed prompt string for both `$ARGUMENTS` and `{{args}}` placeholders.

---

## Phase 2 — Regenerate command files

- [x] [S] Run `osddt update` to write `osddt.fast.md` to `.claude/commands/` (and `osddt.fast.toml` to `.gemini/commands/` if Gemini is active)
- [x] [S] Inspect the generated `osddt.fast.md` to confirm it is correctly formatted (YAML front-matter, correct description, correct body)

**Dependencies**: Phase 1 must be complete.

**Definition of Done**: `osddt.fast.md` exists in `.claude/commands/` and its content matches the expected structure.

---

## Phase 3 — Write tests

- [x] [M] Locate or create the template test file (e.g. `src/templates/shared.spec.ts`) and add a test asserting `COMMAND_DEFINITIONS` contains an entry with `name: 'osddt.fast'`
- [x] [M] Add a test asserting the generated Claude command file content for `osddt.fast` includes key structural markers: branch creation instructions, spec generation instructions, plan with `## Assumptions`, tasks generation, and `$ARGUMENTS` placeholder
- [x] [S] Add a test asserting the generated Gemini command file content for `osddt.fast` uses `{{args}}` as the argument placeholder
- [x] [S] Run `pnpm test` and confirm all tests pass

**Dependencies**: Phase 1 must be complete.

**Definition of Done**: All tests pass with `pnpm test`.

---

## Phase 4 — Documentation

- [x] [S] Add `osddt.fast` row to the **Command Templates** table in `CLAUDE.md`
- [x] [S] Add `osddt.fast` row to the **Command Templates** table in `AGENTS.md`
- [x] [S] Add `osddt.fast` row to the **Command Templates** table in `README.md`
- [x] [S] Add a description of `osddt.fast` as an accelerated entry point in the **Template Workflow** section of `CLAUDE.md`, `AGENTS.md`, and `README.md`

**Dependencies**: Phase 1 must be complete (need the final description/behaviour to document accurately).

**Definition of Done**: All three documentation files reference `osddt.fast` with an accurate description and it appears in the workflow section.
