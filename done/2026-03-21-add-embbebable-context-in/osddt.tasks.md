# Tasks: Embeddable Context in Commands via Convention Folder

## Phase 1 — `osddt context` CLI command

- [x] [M] Create `src/commands/context.ts` with read mode: given a `<name>` argument, read `osddt-context/<name>.md` and print to stdout; exit 0 silently if file not found (catch `ENOENT` only, re-throw others)
- [x] [S] Add `--init` flag to `osddt context`: create `osddt-context/` folder and write one stub `.md` per command name from `COMMAND_DEFINITIONS`, skipping files that already exist
- [x] [S] Register `contextCommand()` in `src/index.ts`

**Dependencies**: none
**Definition of Done**: `osddt context plan` prints file contents when `osddt-context/plan.md` exists; prints nothing and exits 0 when it does not. `osddt context --init` creates the folder and stubs without overwriting existing files.

---

## Phase 2 — Template helper

- [x] [S] Add `getCustomContextStep(npxCommand: string, commandName: string): string` to `src/templates/shared.ts` — returns the `## Custom Context` instruction block telling the agent to run `<npxCommand> context <commandName>` and embed the output if non-empty

**Dependencies**: Phase 1 complete (command name convention established)
**Definition of Done**: Helper returns the expected string with the correct command interpolated.

---

## Phase 3 — Wire into COMMAND_DEFINITIONS

- [x] [M] Update all 10 command `body` functions in `COMMAND_DEFINITIONS` to call `getCustomContextStep(npxCommand, '<bare-name>')` and insert its output just before `## Arguments` or `## Next Step` (whichever appears first in that command's body)

**Dependencies**: Phase 2 complete
**Definition of Done**: Every generated command file (Claude and Gemini) contains the `## Custom Context` instruction block with the correct bare command name.

---

## Phase 4 — Tests

- [x] [M] Write `src/commands/context.spec.ts`: read mode file-exists, read mode file-missing (no error), init mode folder-absent (creates all stubs), init mode folder-present (skips existing files)
- [x] [S] Add tests to `src/templates/shared.spec.ts` (or create it): `getCustomContextStep` returns correct string; each `COMMAND_DEFINITIONS` body includes the `osddt context <name>` instruction

**Dependencies**: Phases 1–3 complete
**Definition of Done**: `pnpm test` passes with no failures.
