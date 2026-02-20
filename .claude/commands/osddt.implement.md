---
description: "Execute tasks from the task list one by one"
---

## Instructions

1. Check whether `osddt.tasks.md` exists in the working directory:
   - If it **does not exist**, stop and ask the user to run `/osddt.tasks $ARGUMENTS` first.
   - If it **already exists**, ask the user whether to:
     - **Continue** — find the next unchecked task and implement it (default)
     - **Update tasks** — edit `osddt.tasks.md` before implementing (e.g. to add, remove, or reorder tasks)
     - **Do nothing** — stop here without making any changes
2. Read `osddt.tasks.md` from the working directory
3. Find the next unchecked task (`- [ ]`)
4. Implement that task following the spec (`osddt.spec.md`) and plan (`osddt.plan.md`) in the working directory
5. Mark the task as complete (`- [x]`) in `osddt.tasks.md`
6. Report what was done and any issues encountered

## Guidelines

- Implement one task at a time
- Follow the existing code style and conventions
- Write tests for new functionality when applicable
- Ask for clarification if requirements are ambiguous

## Arguments

$ARGUMENTS

## Next Step

Once all tasks are checked off, run the following command to mark the feature as done:

```
/osddt.done $ARGUMENTS
```
