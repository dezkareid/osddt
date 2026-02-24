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
│   │   ├── setup.ts               # `osddt setup` — prompts for agents & repo type (or reads --agents/--repo-type flags), writes command files and .osddtrc
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
- **`setup.ts`** orchestrates setup: reads `--agents`/`--repo-type` flags when provided (non-interactive), otherwise calls `askAgents()` → `askRepoType()` → writes selected agent files → writes `.osddtrc`.
- **`meta-info.ts`** is referenced inside the generated templates so agents can fetch live branch/date at invocation time (not baked in at build time).
- **Test files** (`.spec.ts`) live next to the source file they cover. Template tests are pure (no mocks); command tests mock `fs-extra` and `child_process`.

### CLI Commands

#### Invocation forms

There are two contexts in which osddt commands are invoked:

| Context | Command prefix | When to use |
| ------- | -------------- | ----------- |
| **Local development of this package** | `osddt` | Working inside this repository — the binary is available directly because the package is installed locally |
| **External project** (using osddt as a dependency) | `npx @dezkareid/osddt` | Running from a project that lists `@dezkareid/osddt` as a dependency |

When `osddt setup` is run, it reads the `name` field of `package.json` in the target directory. If the name is `@dezkareid/osddt`, templates are written with `npx osddt`. Otherwise they fall back to `npx @dezkareid/osddt`. The resolution lives in `resolveNpxCommand()` in `src/commands/setup.ts`.

#### Available commands

| Command                                                              | Context       | Description                                                   |
| -------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| `osddt setup`                                                        | Local dev     | Generate agent command files for Claude and Gemini            |
| `osddt setup --agents <list> --repo-type <type>`                     | Local dev     | Non-interactive setup (for CI/scripted environments)          |
| `npx @dezkareid/osddt setup`                                         | External      | Generate agent command files for Claude and Gemini            |
| `npx @dezkareid/osddt setup --agents <list> --repo-type <type>`      | External      | Non-interactive setup (for CI/scripted environments)          |
| `osddt meta-info`                                                    | Local dev     | Output current branch and date as JSON                        |
| `npx @dezkareid/osddt meta-info`                                     | External      | Output current branch and date as JSON                        |
| `osddt done <feature-name> --dir <project-path>`                     | Local dev     | Move `working-on/<feature>` to `done/<feature>`               |
| `npx @dezkareid/osddt done <feature-name> --dir <project-path>`      | External      | Move `working-on/<feature>` to `done/<feature>`               |

#### `osddt setup` options

| Flag | Values | Description |
| ---- | ------ | ----------- |
| `--agents <list>` | `claude`, `gemini` (comma-separated) | Skip the agents prompt and use the provided value(s) |
| `--repo-type <type>` | `single`, `monorepo` | Skip the repo type prompt and use the provided value |
| `-d, --dir <directory>` | any path | Target directory (defaults to current working directory) |

Both flags are optional. Providing neither runs the fully interactive mode. Providing both skips all prompts.

### Command Templates

Templates are generated by `npx @dezkareid/osddt setup` and placed in each agent's commands directory. Each template corresponds to a step in the spec-driven workflow.

| Template           | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `osddt.continue`   | Detect the current workflow phase and prompt the next command      |
| `osddt.research`   | Research a topic and write a research file to inform the spec      |
| `osddt.start`      | Start a new feature by creating a branch and working-on folder     |
| `osddt.spec`       | Analyze requirements and write a feature specification             |
| `osddt.clarify`    | Resolve open questions in the spec and record decisions (optional) |
| `osddt.plan`       | Create a technical implementation plan from a specification        |
| `osddt.tasks`      | Generate actionable tasks from an implementation plan              |
| `osddt.implement`  | Execute tasks from the task list one by one                        |
| `osddt.done`       | Resolve project path, verify tasks, and move the feature to done   |

#### Template Workflow

`osddt.research` and `osddt.start` are **peer entry points** — use whichever fits your situation. Both lead to `osddt.spec`. If you close the coding session, you should execute the `osddt.continue` command to resume the workflow.

```
osddt.continue ──────────────────────────────────────────────────────────────────────────────────────┐
                                                                                                      │
osddt.research ──┐                                                                                    │
                 ├──► osddt.spec → [osddt.clarify] → osddt.plan → osddt.tasks → osddt.implement → osddt.done ◄─┘
osddt.start    ──┘
```

- Use **`osddt.continue`** if you closed the coding session to detect the current phase and get the exact command to run next. It inspects the `working-on/<feature-name>/` folder for phase files and reports which one was found.
- Use **`osddt.research`** when you want to explore the codebase and gather findings before writing the spec. It creates the `working-on/<feature-name>/` folder and writes `osddt.research.md`.
- Use **`osddt.start`** when you are ready to begin implementation directly. It creates the git branch and the `working-on/<feature-name>/` folder.
- Both `osddt.research` and `osddt.start` check whether the working directory already exists and ask to **Resume** or **Abort** if it does.
- Use **`osddt.clarify`** (optional) to resolve any Open Questions in the spec before planning. It can be invoked at any point in the workflow; after each session it always prompts to run (or re-run) `osddt.plan`.

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
  3. Reports the file found, the current phase, and the **exact command** the user should run next. Commands that require no further arguments (`/osddt.implement`, `/osddt.done`, `/osddt.tasks`) are suggested without arguments; commands that still need feature context (`/osddt.plan`, `/osddt.spec`, `/osddt.research`, `/osddt.clarify`) are suggested with the feature name.
  4. If the detected phase is **Spec done** or **Planning done** and the spec has unanswered open questions, additionally recommends running `/osddt.clarify`.

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

#### osddt.clarify behaviour

- **Input**: A feature name or branch name identifying the feature whose spec to clarify.
- **Actions performed by the agent**:
  1. Locates `osddt.spec.md` in `working-on/<feature-name>/`; if absent, suggests running `osddt.spec` first.
  2. Reads the **Open Questions** section and the **Decisions** section (if present) to determine which questions are already answered.
  3. Informs the user of any already-resolved questions and only asks the remaining unanswered ones.
  4. Records all new answers in a `## Decisions` section of `osddt.spec.md` (the Open Questions section is left unchanged).
  5. Always prompts the user to run (or re-run) `osddt.plan` to reflect the updated decisions.

#### osddt.done behaviour

- **Input**: None — the feature is identified automatically.
- **Actions performed by the agent**:
  1. Reads `.osddtrc` to resolve the project path (single vs monorepo). For monorepos, asks the user which package.
  2. Lists all folders under `working-on/`. If there is only one, uses it automatically; if there are multiple, asks the user to pick one.
  3. Confirms all tasks in `osddt.tasks.md` are checked off (`- [x]`).
  4. Runs `npx @dezkareid/osddt done <feature-name> --dir <project-path>` to move the folder.

Note: the `osddt done` CLI command does **not** read `.osddtrc` — project path resolution is the agent's responsibility, handled in step 1 above.

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