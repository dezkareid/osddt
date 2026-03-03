# Spec: Fast Development Command

## Overview

Users of the spec-driven workflow sometimes want to quickly bootstrap all planning artifacts (spec + task list) in one shot, without running each workflow step manually. Today, the workflow requires running `/osddt.start`, then `/osddt.spec`, then `/osddt.plan`, then `/osddt.tasks` as separate commands. A "fast" command would let a user provide a feature description and receive a fully-populated working directory — spec and task list — with a single invocation, skipping the manual step-by-step progression.

## Requirements

- The user provides a feature description as input (a human-readable string).
- The command automatically creates the branch and working directory (same logic as `osddt.start`).
- The command generates the feature specification (`osddt.spec.md`) without user intervention.
- The command generates an implementation plan (`osddt.plan.md`) without user intervention.
- The command generates the task list (`osddt.tasks.md`) without user intervention.
- The user is shown the final task list upon completion so they can immediately begin implementing.
- The command must not require the user to supply any technical decisions or clarifications — it derives sensible defaults from the description and codebase.
- The command is runnable as a single slash command invocation, e.g. `/osddt.fast <description>`.

## Scope

### In Scope
- Creating the branch and working directory.
- Auto-generating `osddt.spec.md`, `osddt.plan.md`, and `osddt.tasks.md` in sequence.
- Displaying the resulting task list to the user.
- Following the same naming constraints as `osddt.start` (30-character limit, kebab-case, etc.).

### Out of Scope
- Running `osddt.implement` automatically (the user still decides when to start coding).
- Replacing the existing step-by-step commands — those remain unchanged.
- Resolving open questions interactively (the command moves forward with assumptions; open questions are recorded in the spec for optional later review).
- The `osddt.clarify` step (can be run manually afterwards if needed).
- Adding a new CLI binary command to the `osddt` npm package (this is an agent command only).

## Acceptance Criteria

1. Running `/osddt.fast <description>` with a valid description creates a branch `feat/<derived-name>` and directory `working-on/<feature-name>/`.
2. After the command completes, `working-on/<feature-name>/` contains `osddt.spec.md`, `osddt.plan.md`, and `osddt.tasks.md`.
3. `osddt.tasks.md` contains at least one unchecked task (`- [ ]`).
4. The user sees the task list in the response and is prompted to run `/osddt.implement`.
5. If the branch or working directory already exists, the command warns the user and offers **Resume** or **Abort** (same behaviour as `osddt.start`).
6. If the derived feature name exceeds 30 characters after truncation, the command asks the user for a shorter name (same behaviour as `osddt.start`).

## Decisions

1. **Flags support**: Description-only — no extra flags. The command takes only the feature description as input.
2. **Assumptions section**: Yes — the auto-generated plan includes a `## Assumptions` section documenting decisions made automatically in lieu of user input.
3. **Command structure**: A separate command file `osddt.fast.md` following the same pattern as other osddt commands.
