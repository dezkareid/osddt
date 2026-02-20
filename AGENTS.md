# Agent Instructions: Other Spec-Driven Development Tooling (OSDDT)

This project is a command line utility for spec-driven development. It is intended to be used in monorepos or single package repos.

## Overview

### Agents Support
Each agent has its own conventions for:

- **Command file formats** (Markdown, TOML, etc.)
- **Directory structures** (`.claude/commands/`, `.windsurf/workflows/`, etc.)
- **Command invocation patterns** (slash commands, CLI tools, etc.)
- **Argument passing conventions** (`$ARGUMENTS`, `{{args}}`, etc.)

| Agent                      | Directory              | Format   | CLI Tool        | Description                 |
| -------------------------- | ---------------------- | -------- | --------------- | --------------------------- |
| **Claude Code**            | `.claude/commands/`    | Markdown | `claude`        | Anthropic's Claude Code CLI |
| **Gemini CLI**             | `.gemini/commands/`    | TOML     | `gemini`        | Google's Gemini CLI         |


### Command File Formats

#### Markdown Format

Used by: Claude, Cursor, opencode, Windsurf, Amazon Q Developer, Amp, SHAI, IBM Bob

**Standard format:**

```markdown
---
description: "Command description"
---

Command content with {SCRIPT} and $ARGUMENTS placeholders.
```

#### TOML Format

Used by: Gemini

```toml
description = "Command description"

prompt = """
Command content with {SCRIPT} and {{args}} placeholders.
"""
```

### Directory Conventions

- **CLI agents**: Usually `.<agent-name>/commands/`

### Argument Patterns

Different agents use different argument placeholders:

- **Markdown/prompt-based**: `$ARGUMENTS`
- **TOML-based**: `{{args}}`

## Development

### Commit Rules

Always use Conventional Commits format for commit messages.

Never commit directly to `main` or `master`. If the current branch is one of them, propose creating a new branch before committing.

### Critical Dependency Versions

The following versions are established across the project's packages and should be respected when adding new dependencies or troubleshooting.

Always prefer use exact versions for dependencies. Do not use `^` or `~`.

#### Core Languages & Runtimes
- **TypeScript**: `5.9.3`

#### Build & Bundling Tools
- **Rollup**: `4.56.0`

#### Testing Frameworks
- **Vitest**: `4.0.18`

#### Linting & Formatting
- **ESLint**: `9.39.2`
- **Prettier**: `3.8.1`

#### Type Definitions
- **@types/node**: `25.0.10`
- **@types/fs-extra**: `11.0.4`

#### Key Libraries
- **Commander**: `12.0.0` (for CLI tools)
- **fs-extra**: `11.2.0`
- **globby**: `14.0.1`

### Project Structure & Conventions
- **Package Manager**: `pnpm` is the required package manager.

### Codebase Structure

```
osddt/
├── src/
│   ├── index.ts                   # CLI entry point — wires Commander program and registers all commands
│   ├── commands/
│   │   ├── setup.ts               # `osddt setup` — prompts for agents & repo type, writes command files and .osddtrc
│   │   ├── meta-info.ts           # `osddt meta-info` — outputs { branch, date } as JSON (consumed by generated templates)
│   │   └── done.ts                # `osddt done <feature>` — moves working-on/<feature> → done/YYYY-MM-DD-<feature>
│   ├── templates/
│   │   ├── shared.ts              # REPO_PREAMBLE, FEATURE_NAME_RULES, WORKING_DIR_STEP, and COMMAND_DEFINITIONS array
│   │   ├── claude.ts              # Formats COMMAND_DEFINITIONS as Markdown (.claude/commands/osddt.<name>.md)
│   │   └── gemini.ts              # Formats COMMAND_DEFINITIONS as TOML (.gemini/commands/osddt.<name>.toml)
│   └── utils/
│       └── prompt.ts              # Inquirer prompts: askAgents() (checkbox) and askRepoType() (select)
├── dist/                          # Compiled output (single ESM bundle, gitignored)
├── rollup.config.js               # Bundles src/index.ts → dist/index.js (ESM, shebang injected)
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts               # Vitest config
├── package.json                   # Package name: @dezkareid/osddt, bin: osddt → dist/index.js
├── .osddtrc                       # Runtime config written by setup (repoType: "single" | "monorepo")
├── AGENTS.md / CLAUDE.md / GEMINI.md  # Agent-specific instructions (kept in sync)
└── README.md                      # Public-facing documentation
```

#### Key relationships

- **`shared.ts` is the single source of truth** for all command template content. Both `claude.ts` and `gemini.ts` import `COMMAND_DEFINITIONS` from it and only differ in file format (Markdown vs TOML) and argument placeholder (`$ARGUMENTS` vs `{{args}}`).
- **`setup.ts`** orchestrates the interactive setup: calls `askAgents()` → `askRepoType()` → writes selected agent files → writes `.osddtrc`.
- **`meta-info.ts`** is referenced inside the generated templates so agents can fetch live branch/date at invocation time (not baked in at build time).
- **Test files** (`.spec.ts`) live next to the source file they cover. Template tests are pure (no mocks); command tests mock `fs-extra` and `child_process`.

### CLI Commands

All commands available via `npx @dezkareid/osddt <command>`:

| Command                        | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `@dezkareid/osddt setup`                  | Generate agent command files for Claude and Gemini            |
| `@dezkareid/osddt meta-info`              | Output current branch and date as JSON                        |
| `@dezkareid/osddt done <feature-name>`    | Move `working-on/<feature>` to `done/<feature>`               |

### Command Templates

Templates are generated by `npx @dezkareid/osddt setup` and placed in each agent's commands directory. Each template corresponds to a step in the spec-driven workflow.

| Template           | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `osddt.continue`   | Detect the current workflow phase and prompt the next command      |
| `osddt.research`   | Research a topic and write a research file to inform the spec      |
| `osddt.start`      | Start a new feature by creating a branch and working-on folder     |
| `osddt.spec`       | Analyze requirements and write a feature specification             |
| `osddt.plan`       | Create a technical implementation plan from a specification        |
| `osddt.tasks`      | Generate actionable tasks from an implementation plan              |
| `osddt.implement`  | Execute tasks from the task list one by one                        |
| `osddt.done`       | Mark a feature as done and move it from working-on to done         |

#### Template Workflow

`osddt.research` and `osddt.start` are **peer entry points** — use whichever fits your situation. Both lead to `osddt.spec`. Use `osddt.continue` to resume an in-progress feature from a new session.

```
osddt.continue ──────────────────────────────────────────────────────────────────────────────┐
                                                                                              │
osddt.research ──┐                                                                            │
                 ├──► osddt.spec → osddt.plan → osddt.tasks → osddt.implement → osddt.done ◄─┘
osddt.start    ──┘
```

- Use **`osddt.continue`** at the start of a new session to detect the current phase and get the exact command to run next. It inspects the `working-on/<feature-name>/` folder for phase files and reports which one was found.
- Use **`osddt.research`** when you want to explore the codebase and gather findings before writing the spec. It creates the `working-on/<feature-name>/` folder and writes `osddt.research.md`.
- Use **`osddt.start`** when you are ready to begin implementation directly. It creates the git branch and the `working-on/<feature-name>/` folder.
- Both `osddt.research` and `osddt.start` check whether the working directory already exists and ask to **Resume** or **Abort** if it does.

#### Generated File Locations

| Agent       | Directory           | File pattern               |
| ----------- | ------------------- | -------------------------- |
| Claude Code | `.claude/commands/` | `osddt.<name>.md`          |
| Gemini CLI  | `.gemini/commands/` | `osddt.<name>.toml`        |

#### osddt.continue behaviour

- **Input**: A feature name or branch name to locate the working directory.
- **Actions performed by the agent**:
  1. Runs `npx @dezkareid/osddt meta-info` and reads `.osddtrc` to resolve the project path.
  2. Checks the `working-on/<feature-name>/` folder for the following phase files **in order**: `osddt.tasks.md` (with unchecked tasks), `osddt.tasks.md` (all checked), `osddt.plan.md`, `osddt.spec.md`, `osddt.research.md`.
  3. Reports the file found, the current phase, and the **exact command** the user should run next.

#### osddt.start behaviour

- **Input**: Either a human-readable feature description (e.g. `"Add user authentication"`) or an existing branch name (e.g. `feat/add-user-auth`).
- **Branch name resolution**: input is used as-is if it looks like a branch name; otherwise a name is derived (lowercased, hyphens, prefixed with `feat/`), subject to the 30-character feature name limit.
- **Actions performed by the agent**:
  1. Checks for an existing branch — offers **Resume** (`git checkout`) or **Abort** if found, otherwise runs `git checkout -b <branch-name>`.
  2. Reads `.osddtrc` to resolve the project path (single vs monorepo).
  3. Checks for an existing `working-on/<feature-name>/` folder — offers **Resume** or **Abort** if found, otherwise creates it.

#### osddt.research behaviour

- **Input**: Either a human-readable topic description or a branch/feature name.
- **Actions performed by the agent**:
  1. Derives the feature name (subject to the 30-character limit).
  2. Checks for an existing `working-on/<feature-name>/` folder — offers **Resume** or **Abort** if found, otherwise creates it.
  3. Researches the topic (codebase exploration, external references) and writes `osddt.research.md`.

### Template Data Convention

When a template needs dynamic information (e.g. current branch, date, repo config), **do not pass it as a build-time argument**. Instead:

1. Create an `npx @dezkareid/osddt <command>` that outputs the data (preferably as JSON).
2. Reference that command in the template body, instructing the agent to run it at invocation time.

This keeps generated files deterministic and ensures agents always get live values.

## Testing

### Approach

Tests are written using **Vitest** and follow **BDD (Behaviour-Driven Development)** conventions:

- Test files live next to the source files they cover, using the `.spec.ts` suffix.
- Tests are structured with `describe` blocks that express the context ("given …") and `it` blocks that express the expected behaviour ("should …").
- Side effects (filesystem, child processes, `process.exit`) are isolated with `vi.mock` / `vi.spyOn` so tests remain fast and deterministic.
- Pure functions (template generators) are tested without mocks.

### Running Tests

```bash
# Run the full test suite once
pnpm test

# Run in watch mode during development
pnpm run test:watch
```

## Documentation

When a command in templates or npx commands are added/updated/removed/renamed/deprecated, ask to update the AGENTS.md and README.md files.