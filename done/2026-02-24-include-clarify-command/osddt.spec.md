# Feature Specification: Clarify Command

## Overview

The spec-driven workflow produces an `osddt.spec.md` file that may contain an **Open Questions** section — ambiguities about desired behaviour or product decisions that were not resolved at spec time. Currently, these questions sit in the file with no mechanism to guide the user through answering them before moving on.

This feature introduces an `osddt.clarify` command that surfaces the Open Questions from the spec, prompts the user to answer each one interactively, and records the decisions in a **Decisions** section of the spec file. The command can be invoked at any point in the workflow. Once all questions are resolved, it always prompts the user to run `osddt.plan` (or re-run it if the plan already exists) so the plan reflects the updated decisions.

Additionally, the existing `osddt.plan` command is updated to be question-aware: when it reads a spec that still has unanswered Open Questions, it informs the user and offers them the choice to clarify first or proceed anyway. This is informational only — it does not block the workflow.

---

## Requirements

### `osddt.clarify` command

1. The command accepts a feature name or branch name as its argument, following the same feature-name resolution rules used by all other osddt commands.
2. It locates the `osddt.spec.md` file in `working-on/<feature-name>/`.
3. If `osddt.spec.md` does not exist, the command informs the user that no spec was found and suggests running `osddt.spec` first.
4. It reads the **Open Questions** section of the spec and extracts each question listed there.
5. If there are no open questions (the section is empty or absent), the command informs the user that all questions are already resolved and suggests proceeding with `osddt.plan`.
6. If some questions were already answered in a previous run (i.e. a **Decisions** section already exists in the spec with entries corresponding to those questions), the command informs the user which questions are already resolved and only asks the remaining unanswered ones.
7. For each unresolved question, the command presents it to the user and collects an answer.
8. After all questions have been answered, the command records the decisions in a **Decisions** section in `osddt.spec.md` — each decision is stored there, not inline under the original question.
9. Regardless of whether questions were already partially or fully answered, after the session the command always prompts the user to run (or re-run) the plan step so it reflects the updated decisions:
   ```
   /osddt.plan <feature-name>
   ```

### `osddt.plan` — Open Questions awareness

10. When `osddt.plan` reads the spec, it checks whether the **Open Questions** section contains any unanswered questions (i.e. questions with no corresponding entry in the **Decisions** section).
11. If unanswered questions are found, it informs the user before proceeding (e.g. "This spec has X unanswered open questions.").
12. It then asks the user whether they want to:
    - **Clarify first** — stop and suggest running `/osddt.clarify <feature-name>` instead.
    - **Proceed anyway** — continue with plan generation using the spec as-is.
13. This prompt is non-blocking: the user can always choose to proceed.
14. If there are no unanswered questions, `osddt.plan` proceeds without any additional prompt.

---

## Scope

### In scope
- New `osddt.clarify` command template (Claude Markdown and Gemini TOML formats).
- Interactive question-and-answer flow within the clarify command.
- Recording decisions in a dedicated **Decisions** section of `osddt.spec.md`.
- Partial-session awareness: detecting already-answered questions and only asking the remaining ones.
- Open Questions awareness added to `osddt.plan` command template (non-blocking check).
- `osddt.continue` updated to recommend `osddt.clarify` when the current phase is spec or plan and the spec has unanswered open questions.
- `osddt.clarify` is added to the workflow diagram and command reference documentation as an optional step between `osddt.spec` and `osddt.plan`.

### Out of scope
- Blocking `osddt.plan` when open questions exist — the check is informational only.
- Automatic question generation or inference from the spec body.
- Any changes to `osddt.spec`, `osddt.tasks`, `osddt.implement`, or `osddt.done`.

---

## Acceptance Criteria

1. Running `/osddt.clarify <feature>` with a valid spec that has open questions presents each unanswered question to the user one at a time and records the decisions in a **Decisions** section of `osddt.spec.md`.
2. After the session (all remaining questions answered), the user is always prompted to run `/osddt.plan <feature>` to reflect the updated decisions.
3. Running `/osddt.clarify <feature>` when some questions are already answered informs the user of the already-resolved ones and only asks the remaining questions, then prompts `/osddt.plan`.
4. Running `/osddt.clarify <feature>` when all questions are already answered informs the user and still prompts them to run `/osddt.plan`.
5. Running `/osddt.clarify <feature>` when no spec exists informs the user and suggests `/osddt.spec`.
6. Running `/osddt.plan <feature>` when the spec has unanswered open questions notifies the user of the count and asks whether to clarify first or proceed anyway — and both choices work correctly.
7. Running `/osddt.plan <feature>` when the spec has no unanswered open questions proceeds without any additional prompt.
8. Running `/osddt.continue <feature>` when the current phase is spec or plan and the spec has unanswered open questions recommends running `/osddt.clarify <feature>` as the next step.
9. The `osddt.clarify` command is listed in the workflow documentation as an optional step between `osddt.spec` and `osddt.plan`, noted as executable at any point in the workflow.

---

## Decisions

1. **Answer storage format**: Decisions are recorded in a dedicated **Decisions** section in `osddt.spec.md`, not inline under the original questions. The Open Questions section is left unchanged.
2. **Partial session support**: If some questions were already answered in a previous run, `osddt.clarify` informs the user of the already-resolved ones and only asks the remaining unanswered questions.
3. **Workflow placement**: `osddt.clarify` is an optional step between `osddt.spec` and `osddt.plan` in the workflow diagram, but can be invoked at any point in the workflow. After any clarify session, the user is always prompted to run (or re-run) `osddt.plan`.
4. **`osddt.continue` integration**: `osddt.continue` is updated to recommend `osddt.clarify` only when the current detected phase is spec or plan and the spec has unanswered open questions.
