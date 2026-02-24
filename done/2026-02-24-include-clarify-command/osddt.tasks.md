# Task List: Clarify Command

## Phase 1 — Add `osddt.clarify` to `COMMAND_DEFINITIONS`

- [x] [M] Add `osddt.clarify` entry to `COMMAND_DEFINITIONS` in `src/templates/shared.ts`, inserted between `osddt.spec` and `osddt.plan`, with the full body covering: feature-name resolution, spec file lookup, Open Questions / Decisions section parsing, question-by-question prompting, Decisions section write-back, and the final `/osddt.plan` prompt

**Definition of Done**: `COMMAND_DEFINITIONS` has 9 entries; the new entry sits between `osddt.spec` and `osddt.plan`; the body references `osddt.spec.md`, `Open Questions`, `Decisions`, and `/osddt.plan`.

---

## Phase 2 — Update `osddt.plan` body

- [x] [S] Edit the `osddt.plan` body in `src/templates/shared.ts` to add an Open Questions check after the "Read `osddt.spec.md`" step: count unanswered questions (those with no matching Decisions entry), inform the user if any exist, and offer **Clarify first** / **Proceed anyway** choices

**Definition of Done**: `osddt.plan` body contains references to unanswered open questions, `osddt.clarify`, and both choice labels.

---

## Phase 3 — Update `osddt.continue` body

- [x] [S] Edit the `osddt.continue` body in `src/templates/shared.ts` to add a post-table note: when the detected phase is Spec done or Planning done and the spec has unanswered open questions, recommend `/osddt.clarify <feature-name>` as an alternative or follow-up step

**Definition of Done**: `osddt.continue` body contains a conditional note about `osddt.clarify` triggered by unanswered open questions in the spec or plan phase.

---

## Phase 4 — Update tests

_Depends on Phases 1–3 being complete._

- [x] [S] Update the `COMMAND_DEFINITIONS` length assertion in `src/templates/shared.spec.ts` from `8` to `9`
- [x] [S] Update the command names order assertion in `src/templates/shared.spec.ts` to include `osddt.clarify` between `osddt.spec` and `osddt.plan`
- [x] [M] Add a `describe('osddt.clarify', ...)` block in `src/templates/shared.spec.ts` covering: has a description, includes `$ARGUMENTS`, references `osddt.spec.md`, references `Open Questions`, references `Decisions`, prompts `/osddt.plan $ARGUMENTS` as the next step
- [x] [S] Add a test in `src/templates/shared.spec.ts` for `osddt.plan` asserting that its body contains the open-questions check (references to unanswered questions and `osddt.clarify`)
- [x] [S] Add a test in `src/templates/shared.spec.ts` for `osddt.continue` asserting that its body contains the `osddt.clarify` recommendation
- [x] [S] Add assertions in `src/templates/claude.spec.ts` that `getClaudeTemplates` produces a file with path ending in `osddt.clarify.md`
- [x] [S] Add assertions in `src/templates/gemini.spec.ts` that `getGeminiTemplates` produces a file with path ending in `osddt.clarify.toml`

**Definition of Done**: `pnpm test` passes with all new and updated assertions green.

---

## Phase 5 — Update documentation

_Depends on Phase 1 being complete._

- [x] [S] Add `osddt.clarify` row to the command templates table in `AGENTS.md` and update the workflow diagram to show it as an optional step between `osddt.spec` and `osddt.plan` (noted as executable at any point)
- [x] [S] Apply the same additions to `README.md`
- [x] [S] Apply the same additions to `CLAUDE.md`

**Definition of Done**: All three docs list `osddt.clarify` in the command table and workflow diagram.
