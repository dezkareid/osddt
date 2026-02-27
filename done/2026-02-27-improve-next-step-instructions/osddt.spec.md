# Spec: Improve Next Step Instructions for `osddt.start` and `osddt.research`

## Overview

After completing `osddt.start` or `osddt.research`, the agent surfaces a "Next Step" block telling the user to run `/osddt.spec`. Currently, the instruction branches into two variants based on whether the input was a human-readable description or a branch name, and exposes that classification to the user as part of the message. This is noisy: the user does not need to know how their input was interpreted — they just need to know what to run next.

The goal is to keep the context-awareness of the message (so tone varies appropriately) but remove the classification explanation. The agent should vary its wording based on input type, but communicate this naturally without mentioning "branch name" or "human-readable description" to the user.

## Requirements

1. After `osddt.start` completes with a **human-readable description** input, the agent must tell the user their description will be used as the starting point for the spec, and show `/osddt.spec` with an optional-context note.
2. After `osddt.start` completes with a **branch name** input (or no arguments), the agent must show `/osddt.spec` with an optional-context note, without referencing the input classification.
3. After `osddt.research` completes with a **human-readable description** input, the agent must tell the user their description will be used as the starting point for the spec, and show `/osddt.spec` with an optional-context note.
4. After `osddt.research` completes with a **branch name** input (or no arguments), the agent must show `/osddt.spec` with an optional-context note, without referencing the input classification.
5. In all cases, the next step message must not expose the branch-name vs. human-readable-description classification to the user.
6. Both commands (`osddt.start` and `osddt.research`) must produce next step instructions consistent in structure and tone.

## Scope

**In scope:**
- The `## Next Step` section in the `osddt.start` command template.
- The `## Next Step` section in the `osddt.research` command template.
- Updating `shared.ts` (the source of truth) so both templates are generated consistently.
- Updating `CLAUDE.md` (and keeping `AGENTS.md` / `GEMINI.md` in sync) to document the new next step behaviour for `osddt.start` and `osddt.research`.

**Out of scope:**
- Changes to the `/osddt.spec` command itself.
- Changes to any other command templates (e.g. `osddt.plan`, `osddt.tasks`).
- Changes to the feature name derivation logic or branch name logic.
- Changes to the working directory setup steps.

## Acceptance Criteria

1. After `osddt.start` runs with a human-readable description, the agent outputs a next step that says the description will be used as a starting point and shows `/osddt.spec` — no mention of "human-readable" or "branch name".
2. After `osddt.start` runs with a branch name or no arguments, the agent outputs a next step that shows `/osddt.spec` with an optional-context note — no mention of input classification.
3. The same two behaviours apply after `osddt.research` completes.
4. The generated `.claude/commands/osddt.start.md` and `.claude/commands/osddt.research.md` files reflect the updated next step text after running `osddt setup`.
5. `CLAUDE.md` (and `AGENTS.md` / `GEMINI.md`) document the two next step variants for `osddt.start` and `osddt.research`.
6. All existing tests pass and new tests cover the updated next step behaviour.

## Decisions

1. **Feature name in next step**: The argument to `/osddt.spec` is optional extra context only — not the feature name. The agent already knows which feature it's working on from the working directory. The next step shows the bare `/osddt.spec` command; no name or placeholder is needed.
2. **Context-aware wording**: Rather than a single unconditional message or an exposed conditional, the next step varies its *tone* based on input type. When input was a human-readable description, the message acknowledges it will be used as a starting point. When input was a branch name or absent, the message is a neutral prompt to run `/osddt.spec` with an optional-context note.
