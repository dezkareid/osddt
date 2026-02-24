# Implementation Plan: Clarify Command

## Architecture Overview

All command template content lives in `src/templates/shared.ts` as entries in `COMMAND_DEFINITIONS`. Adding `osddt.clarify` means appending one new `CommandDefinition` object to that array. Both `claude.ts` and `gemini.ts` automatically pick it up — no changes needed to those files.

The `osddt.plan` and `osddt.continue` command bodies also live in `COMMAND_DEFINITIONS` and need targeted text edits to their `body` functions.

No new CLI commands, no new source files, no new dependencies. This is a pure template-content change plus test updates.

---

## Implementation Phases

### Phase 1 — Add `osddt.clarify` to `COMMAND_DEFINITIONS`

Add a new entry to the `COMMAND_DEFINITIONS` array in `src/templates/shared.ts`:

- **Name**: `osddt.clarify`
- **Description**: `"Resolve open questions in the spec and record decisions"`
- **Body** must instruct the agent to:
  1. Use the standard preamble (`getRepoPreamble`) and feature-name resolution.
  2. Locate `osddt.spec.md` in `working-on/<feature-name>/`; if absent, inform the user and suggest `/osddt.spec`.
  3. Read the **Open Questions** section and check for an existing **Decisions** section.
  4. If all questions already have corresponding decisions, inform the user and skip to the prompt step.
  5. If some questions already have decisions, list the resolved ones and only ask the remaining ones.
  6. For each unanswered question, present it and collect a response.
  7. Append (or update) a `## Decisions` section in `osddt.spec.md` with the new answers — using the format `N. **<question summary>**: <answer>`.
  8. Always end by prompting the user to run `/osddt.plan <feature-name>` (note: "re-run" if a plan already exists).

The new entry should be inserted **between** `osddt.spec` and `osddt.plan` in the array (position matters for documentation ordering only — runtime behaviour is unaffected).

### Phase 2 — Update `osddt.plan` body

Edit the `osddt.plan` entry's `body` function in `src/templates/shared.ts`:

- After step 2 ("Read `osddt.spec.md`"), insert a new check:
  - Count Open Questions that have no matching entry in the Decisions section.
  - If any unanswered questions exist: inform the user of the count, then ask:
    - **Clarify first** → stop and suggest `/osddt.clarify <feature-name>`
    - **Proceed anyway** → continue with plan generation
  - If no unanswered questions: proceed silently.

### Phase 3 — Update `osddt.continue` body

Edit the `osddt.continue` entry's `body` function in `src/templates/shared.ts`:

- After the phase-detection table, add a conditional note:
  - If the detected phase is **Spec done** (`osddt.spec.md` exists, no plan) **and** the spec has unanswered open questions → recommend `/osddt.clarify <feature-name>` as an alternative next step before plan.
  - If the detected phase is **Planning done** (`osddt.plan.md` exists) **and** the spec still has unanswered open questions → recommend running `/osddt.clarify <feature-name>` to update the plan afterward.
  - All other phases: no change.

### Phase 4 — Update tests

- `src/templates/shared.spec.ts`: add test cases asserting that the `osddt.clarify` `CommandDefinition` exists with the correct `name` and `description`, and that its `body` output contains key instruction strings (e.g. `osddt.spec.md`, `Decisions`, `Open Questions`).
- `src/templates/claude.spec.ts`: assert that `getClaudeTemplates` now produces a file named `osddt.clarify.md`.
- `src/templates/gemini.spec.ts`: assert that `getGeminiTemplates` now produces a file named `osddt.clarify.toml`.
- No changes needed to `src/commands/setup.spec.ts` — the count of written files will need updating if it is asserted there.

### Phase 5 — Update documentation

- **`AGENTS.md`**: add `osddt.clarify` row to the command templates table; update workflow diagram to show it as an optional step between `osddt.spec` and `osddt.plan`.
- **`README.md`**: same additions as `AGENTS.md`.
- **`CLAUDE.md`**: same additions as `AGENTS.md` (kept in sync per project conventions).

---

## Technical Dependencies

No new runtime dependencies. All changes are string template edits inside existing TypeScript source files.

---

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Inserting a new entry into `COMMAND_DEFINITIONS` shifts the array index — any test that asserts a specific index will break | Review `shared.spec.ts` for index-based assertions and update them |
| The `osddt.plan` Open Questions check adds agent-side text parsing of the spec — if the spec format deviates from the expected Markdown structure, the count may be wrong | The check is non-blocking; a wrong count leads to a user prompt, not a hard failure |
| `setup.spec.ts` may assert the exact number of generated files | Check and update the expected count (8 → 9 files per agent) |

---

## Out of Scope

- No new CLI binary commands (no changes to `src/commands/`).
- No changes to `osddt.spec`, `osddt.tasks`, `osddt.implement`, or `osddt.done` template bodies.
- No blocking behaviour in `osddt.plan` — the open-questions check is always opt-out.
- No automatic question generation.
