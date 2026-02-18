# Agent Instructions: Other Spec-Driven Development Tooling (OSDDT)

This project is a command line utility for spec-driven development. It is intended to be used in monorepos or single package repos.

## Agents Support
Each agent has its own conventions for:

- **Command file formats** (Markdown, TOML, etc.)
- **Directory structures** (`.claude/commands/`, `.windsurf/workflows/`, etc.)
- **Command invocation patterns** (slash commands, CLI tools, etc.)
- **Argument passing conventions** (`$ARGUMENTS`, `{{args}}`, etc.)

| Agent                      | Directory              | Format   | CLI Tool        | Description                 |
| -------------------------- | ---------------------- | -------- | --------------- | --------------------------- |
| **Claude Code**            | `.claude/commands/`    | Markdown | `claude`        | Anthropic's Claude Code CLI |
| **Gemini CLI**             | `.gemini/commands/`    | TOML     | `gemini`        | Google's Gemini CLI         |


## Command File Formats

### Markdown Format

Used by: Claude, Cursor, opencode, Windsurf, Amazon Q Developer, Amp, SHAI, IBM Bob

**Standard format:**

```markdown
---
description: "Command description"
---

Command content with {SCRIPT} and $ARGUMENTS placeholders.
```

### TOML Format

Used by: Gemini

```toml
description = "Command description"

prompt = """
Command content with {SCRIPT} and {{args}} placeholders.
"""
```

## Directory Conventions

- **CLI agents**: Usually `.<agent-name>/commands/`

## Argument Patterns

Different agents use different argument placeholders:

- **Markdown/prompt-based**: `$ARGUMENTS`
- **TOML-based**: `{{args}}`

## Critical Dependency Versions

The following versions are established across the project's packages and should be respected when adding new dependencies or troubleshooting.

### Core Languages & Runtimes
- **TypeScript**: `5.9.3`

### Build & Bundling Tools
- **Rollup**: `4.56.0`

### Testing Frameworks
- **Vitest**: `4.0.18`

### Linting & Formatting
- **ESLint**: `9.39.2`
- **Prettier**: `3.8.1`

### Type Definitions
- **@types/node**: `25.0.10`
- **@types/fs-extra**: `11.0.4`

### Key Libraries
- **Commander**: `12.0.0` (for CLI tools)
- **fs-extra**: `11.2.0`
- **globby**: `14.0.1`

## Project Structure & Conventions
- **Package Manager**: `npm` is the required package manager.
