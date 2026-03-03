# Plan: Fast Development Command (`osddt.fast`)

## Assumptions

The following decisions were derived automatically from the spec and codebase conventions:

1. `osddt.fast` is implemented as an agent command template only — no new CLI binary sub-command.
2. The command file format for Claude is Markdown (`osddt.fast.md`), following the same structure as all other commands in `COMMAND_DEFINITIONS`.
3. The Gemini format counterpart (`osddt.fast.toml`) is also generated when Gemini is an active agent (consistent with how all other commands work).
4. The `osddt.fast` command body is defined in `src/templates/shared.ts` inside `COMMAND_DEFINITIONS`, making it automatically picked up by `osddt update`, `osddt setup`, and both template formatters.
5. The plan generated inside `osddt.fast` includes a `## Assumptions` section, as decided during clarification.
6. No new npm dependencies are needed.

---

## Architecture Overview

`osddt.fast` is a single agent command template. Its implementation follows the exact same pattern as every other command:

1. **Define** the command body in `COMMAND_DEFINITIONS` inside `src/templates/shared.ts`.
2. **Format** is handled automatically by `claude.ts` (Markdown) and `gemini.ts` (TOML).
3. **Distribute** via `osddt setup` and `osddt update` — no extra wiring required.

The command body instructs the agent to execute the `osddt.start` → `osddt.spec` → `osddt.plan` → `osddt.tasks` sequence in a single session, carrying the user's original description through each step without pausing for user input. The agent derives all technical decisions from codebase inspection and the description itself.

---

## Implementation Phases

### Phase 1 — Define the command in `shared.ts`

- Add a new `CommandDefinition` entry for `osddt.fast` to the `COMMAND_DEFINITIONS` array in `src/templates/shared.ts`.
- The body function receives `{ args, npxCommand }` and constructs a self-contained prompt that:
  1. Runs `npx osddt meta-info` and reads `.osddtrc` (reuses `getRepoPreamble(npxCommand)`).
  2. Applies feature name derivation and branch/working-directory creation (same rules as `osddt.start`).
  3. Instructs the agent to generate `osddt.spec.md` from the description, skip interactive clarification, and record any open questions as-is.
  4. Instructs the agent to generate `osddt.plan.md`, including an `## Assumptions` section for any decisions made automatically.
  5. Instructs the agent to generate `osddt.tasks.md` from the plan.
  6. Instructs the agent to display the final task list and prompt the user to run `/osddt.implement`.

### Phase 2 — Regenerate command files

- Run `osddt update` (or `osddt setup`) so the new `osddt.fast.md` (and `osddt.fast.toml` if Gemini is active) is written to the correct agent command directories.

### Phase 3 — Write tests

- Add a test case in the existing template test file (or a new `shared.spec.ts` if none exists) to assert:
  - `COMMAND_DEFINITIONS` contains an entry with `name: 'osddt.fast'`.
  - The generated Claude command file content includes the expected heading and key instructions (branch creation, spec generation, plan with assumptions, tasks generation).
  - The generated Gemini command file content uses `{{args}}` as the placeholder.

### Phase 4 — Documentation

- Add `osddt.fast` to the command tables in `CLAUDE.md`, `AGENTS.md`, and `README.md`.
- Update the **Template Workflow** section to describe `osddt.fast` as an accelerated entry point.

---

## Technical Dependencies

- No new libraries required.
- Existing: `fs-extra`, `globby`, TypeScript, Vitest, Rollup — all already present.
- Relies on: `getRepoPreamble`, `FEATURE_NAME_RULES`, `WORKING_DIR_STEP` helpers already exported from `shared.ts`.

---

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Agent skips a step or halts waiting for user input | Write the command body with explicit sequential instructions and "do not pause" language. |
| Generated spec/plan quality is lower without user guidance | Include `## Assumptions` section in the plan so the user can review before implementing. |
| Command body becomes too long and confusing | Keep each step's instructions concise; reference the canonical behaviour ("same as `osddt.start`") rather than duplicating all rules. |
| Tests are brittle if command body changes | Assert on stable structural markers (section headings, arg placeholders) rather than exact string matches. |

---

## Out of Scope

- Adding a new `osddt fast` CLI binary sub-command.
- Running `osddt.implement` automatically.
- Interactive clarification during the fast command.
- Optional flags (`--agents`, `--repo-type`).
- Modifying any existing command behaviour.
