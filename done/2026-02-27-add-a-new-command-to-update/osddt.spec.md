# Spec: Add an `update` Command to Regenerate Agent Command Files

## Overview

OSDDT generates agent command files during `osddt setup`. When the templates change (e.g. after upgrading the `osddt` package), users have no way to refresh those files without re-running the full `osddt setup` — which is interactive and prompts for agents and repo type again.

This feature adds an `osddt update` command that reads the existing `.osddtrc` configuration and regenerates the agent command files, without prompting the user for any input.

## Requirements

1. `osddt update` reads `.osddtrc` from the target directory to determine the current `repoType`.
2. It detects which agents are active by checking for the presence of their command directories (`.claude/commands/` and/or `.gemini/commands/`).
3. It regenerates the command files for every detected agent directory, overwriting the existing files.
4. It does **not** modify `.osddtrc`.
5. It does **not** prompt the user for any input.
6. On success it prints a confirmation listing which agent files were regenerated.
7. If `.osddtrc` does not exist, the command exits with a clear error message telling the user to run `osddt setup` first.
8. If no agent command directories are found, the command exits with a clear error message telling the user to run `osddt setup` first.
9. The command accepts a `-d, --dir <directory>` option, consistent with other osddt commands, to target a specific directory (defaults to `cwd`).

## Scope

**In scope:**
- Reading `.osddtrc` to get the current configuration
- Detecting active agents from existing command directories
- Regenerating (overwriting) existing agent command files

**Out of scope:**
- Modifying `.osddtrc`
- Creating new agent command directories that don't already exist
- Interactive prompts or wizard-style UX
- Selecting a subset of agents to regenerate

## Acceptance Criteria

- `osddt update` in a project with `.osddtrc` and `.claude/commands/` regenerates all Claude command files and prints a confirmation.
- `osddt update` in a project with both `.claude/commands/` and `.gemini/commands/` regenerates files for both agents.
- Running the command when `.osddtrc` does not exist exits with a non-zero code and instructs the user to run `osddt setup`.
- Running the command when no agent directories exist exits with a non-zero code and instructs the user to run `osddt setup`.
- `.osddtrc` is unchanged after the command runs.
- No prompts are shown to the user.
- The `-d, --dir <directory>` flag targets the specified directory instead of `cwd`.
