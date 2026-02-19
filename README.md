# osddt
Other spec driven development tool but for monorepo

## CLI Commands

| Command                        | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `osddt setup`                  | Generate agent command files for Claude and Gemini            |
| `osddt meta-info`              | Output current branch and date as JSON                        |
| `osddt done <feature-name>`    | Move `working-on/<feature>` to `done/<feature>`               |

## Command Templates

Run `osddt setup` once to generate the agent command files. Each template maps to a step in the spec-driven workflow:

```
osddt.start → osddt.spec → osddt.plan → osddt.tasks → osddt.implement → osddt.done
```

| Template           | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `osddt.start`      | Start a new feature by creating a branch and working-on folder |
| `osddt.spec`       | Analyze requirements and write a feature specification        |
| `osddt.plan`       | Create a technical implementation plan from a specification   |
| `osddt.tasks`      | Generate actionable tasks from an implementation plan         |
| `osddt.implement`  | Execute tasks from the task list one by one                   |
| `osddt.done`       | Mark a feature as done and move it from working-on to done    |

Generated files are placed in:

- `.claude/commands/osddt.<name>.md` (Claude Code)
- `.gemini/commands/osddt.<name>.toml` (Gemini CLI)
