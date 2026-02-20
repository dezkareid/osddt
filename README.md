# osddt
Other spec driven development tool but for monorepo

## CLI Commands

| Command                        | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `@dezkareid/osddt setup`                  | Generate agent command files for Claude and Gemini            |
| `@dezkareid/osddt meta-info`              | Output current branch and date as JSON                        |
| `@dezkareid/osddt done <feature-name>`    | Move `working-on/<feature>` to `done/<feature>`               |

## Command Templates

Run `npx @dezkareid/osddt setup` once to generate the agent command files.

`osddt.research` and `osddt.start` are **peer entry points** — use whichever fits your situation. Both lead to `osddt.spec`. Use `osddt.continue` to resume an in-progress feature from a new session.

```
osddt.continue ──────────────────────────────────────────────────────────────────────────────┐
                                                                                              │
osddt.research ──┐                                                                            │
                 ├──► osddt.spec → osddt.plan → osddt.tasks → osddt.implement → osddt.done ◄─┘
osddt.start    ──┘
```

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

Generated files are placed in:

- `.claude/commands/osddt.<name>.md` (Claude Code)
- `.gemini/commands/osddt.<name>.toml` (Gemini CLI)

## Development

### Running Tests

```bash
# Run the full test suite once
pnpm test

# Run in watch mode during development
pnpm run test:watch
```

### Local Setup

After making changes to the source, rebuild and regenerate the agent command files in the repository:

```bash
pnpm run setup-local
```

This runs `pnpm run build` followed by `npx osddt setup`, prompting you to select which agents to configure and the repo type.
