# Plan: Embeddable Context in Commands via Convention Folder

## Architecture Overview

The implementation follows the established `meta-info` pattern: a new CLI subcommand (`osddt context`) serves context file contents at agent invocation time, and the template system adds a static instruction block to every generated command telling the agent to call it.

Three concerns are cleanly separated:

1. **CLI command** (`src/commands/context.ts`) — reads `osddt-context/<name>.md` and prints to stdout; never throws. Also handles `--init` to scaffold stubs.
2. **Template helper** (`src/templates/shared.ts`) — a new `getCustomContextStep(npxCommand, commandName)` helper returns the instruction block agents run at invocation time.
3. **Template wiring** (`src/templates/shared.ts` `COMMAND_DEFINITIONS`) — each command's `body` function calls the helper and inserts the block just before `## Arguments` or `## Next Step`.

No changes to `.osddtrc`, `setup.ts`, `update.ts`, `claude.ts`, or `gemini.ts` are required — the template bodies themselves carry the new instruction.

## Implementation Phases

### Phase 1 — `osddt context` CLI command

Create `src/commands/context.ts` with two behaviours:

**Read mode** (`osddt context <name>`):
- Resolves `<cwd>/osddt-context/<name>.md` (where `cwd` defaults to `process.cwd()`; support `-d, --dir` flag for consistency).
- If the file exists: reads and prints its contents to stdout, exits 0.
- If the file does not exist: exits 0 silently (no output, no error, no `process.exit(1)`).
- No try/catch that swallows unexpected errors — only the "file not found" case is suppressed.

**Init mode** (`osddt context --init`):
- Creates `osddt-context/` if absent.
- For each name in `COMMAND_DEFINITIONS` (the `name` field stripped of the `osddt.` prefix): creates `osddt-context/<name>.md` with a placeholder stub only if the file does not already exist.
- Prints a summary of created vs. skipped files.

Stub template:
```markdown
# Custom Context: <name>

<!-- Add project-specific instructions for the osddt.<name> command here.
     This content will be shown to the agent at invocation time under ## Custom Context. -->
```

Register the command in `src/index.ts`.

### Phase 2 — Template instruction block

Add a helper to `src/templates/shared.ts`:

```ts
export function getCustomContextStep(npxCommand: string, commandName: string): string {
  return `## Custom Context

Run the following command and, if it returns content, present it to the agent as additional context before proceeding:

\`\`\`
${npxCommand} context ${commandName}
\`\`\`

If the command returns no output, skip this section and continue.

`;
}
```

- `commandName` is the bare name without the `osddt.` prefix (e.g. `plan`, `spec`, `implement`).
- The block ends with a blank line so it sits cleanly before whatever follows.

### Phase 3 — Wire into COMMAND_DEFINITIONS

Update each `body` function in `COMMAND_DEFINITIONS` that has either an `## Arguments` or `## Next Step` section to insert `getCustomContextStep(npxCommand, '<name>')` just before that section.

Commands affected (all that have `## Arguments` or `## Next Step`):
- `osddt.continue`
- `osddt.research`
- `osddt.start`
- `osddt.spec`
- `osddt.clarify`
- `osddt.plan`
- `osddt.tasks`
- `osddt.implement`
- `osddt.fast`
- `osddt.done`

`CommandDefinitionContext` already carries `npxCommand`; the command name is available as `cmd.name` (strip `osddt.` prefix). No interface changes needed.

### Phase 4 — Tests

Follow existing BDD patterns (`.spec.ts` next to source):

**`src/commands/context.spec.ts`**:
- Read mode: file exists → prints contents, exits 0.
- Read mode: file missing → prints nothing, exits 0 (no thrown error).
- Init mode: folder absent → creates folder and all stubs.
- Init mode: folder present, some files exist → creates missing stubs, skips existing.

**`src/templates/shared.spec.ts`** (or existing file):
- `getCustomContextStep` returns the expected string for given inputs.
- Each command body in `COMMAND_DEFINITIONS` includes the `osddt context <name>` instruction.

## Technical Dependencies

No new external dependencies. Uses:
- `fs-extra` (already in use) — for file existence checks and directory creation.
- `commander` (already in use) — for the new subcommand and `--init` flag.
- `vitest` (already in use) — for tests.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `osddt context <name>` throwing on unexpected filesystem errors (permissions, etc.) | Only catch `ENOENT`; re-throw everything else so real errors surface. |
| Agents interpreting an empty stdout from `osddt context` as an error | Template instruction explicitly says "if no output, skip" — makes agent behaviour deterministic. |
| Template bodies growing unwieldy with the new block in all 10 commands | The helper is one call per body; bodies stay readable. |
| `--init` accidentally overwriting user-edited stubs | Check file existence before writing; skip if present. |

## Out of Scope

- Changes to `.osddtrc`.
- Baking context into generated files at setup/update time.
- A global context file applied to all commands.
- Per-command `--dir` resolution at agent invocation (agent runs from project root by convention).
- Multiple context blocks per command.
- User-customizable heading (fixed `## Custom Context`).
