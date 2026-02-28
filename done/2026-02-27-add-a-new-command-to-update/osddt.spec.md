# Spec: Add an `update` Command to Regenerate Agent Command Files

## Overview

OSDDT generates agent command files during `osddt setup`. When the templates change (e.g. after upgrading the `osddt` package), users have no way to refresh those files without re-running the full `osddt setup` — which is interactive and prompts for agents and repo type again.

This feature adds an `osddt update` command that reads the existing `.osddtrc` configuration and regenerates the agent command files, without prompting the user for any input.

As part of this feature, `osddt setup` was also updated to persist the selected agents in `.osddtrc` alongside `repoType`, so that `osddt update` always knows which agents to regenerate.

## Requirements

1. `osddt update` reads `.osddtrc` from the target directory to determine which agents to regenerate.
2. If `.osddtrc` contains an `agents` key, the command uses it directly to determine which agents to regenerate.
3. If `.osddtrc` has no `agents` key (legacy config), the command scans each agent's command directory for `osddt`-prefixed command files (`osddt.*.md` for Claude, `osddt.*.toml` for Gemini) to infer the active agents, then writes the inferred list back into `.osddtrc`.
4. It regenerates the command files for every detected agent, overwriting the existing files.
5. It does **not** prompt the user for any input.
6. On success it prints a confirmation listing which agent files were regenerated.
7. If `.osddtrc` does not exist, the command exits with a clear error message telling the user to run `osddt setup` first.
8. If no active agents can be determined (no `agents` key and no matching command files found), the command exits with a clear error message telling the user to run `osddt setup` first.
9. The command accepts a `-d, --dir <directory>` option, consistent with other osddt commands, to target a specific directory (defaults to `cwd`).
10. `osddt setup` saves the selected agents list (`agents`) in `.osddtrc` alongside `repoType`.

## Scope

**In scope:**
- Reading `.osddtrc` to get the current configuration (agents + repoType)
- Inferring active agents from `osddt`-prefixed command files when `agents` is absent in config
- Writing inferred `agents` back into `.osddtrc` when absent
- Regenerating (overwriting) existing agent command files
- Persisting `agents` in `.osddtrc` during `osddt setup`

**Out of scope:**
- Creating new agent command directories that don't already exist
- Interactive prompts or wizard-style UX
- Selecting a subset of agents to regenerate

## Acceptance Criteria

- `osddt update` in a project where `.osddtrc` has `agents: ["claude"]` regenerates Claude command files and does not modify `.osddtrc`.
- `osddt update` in a project where `.osddtrc` has `agents: ["claude", "gemini"]` regenerates files for both agents and does not modify `.osddtrc`.
- `osddt update` in a project where `.osddtrc` has no `agents` key scans for `osddt.*.md` / `osddt.*.toml` files, infers active agents, writes them to `.osddtrc`, then regenerates.
- Running the command when `.osddtrc` does not exist exits with a non-zero code and instructs the user to run `osddt setup`.
- Running the command when no active agents can be determined exits with a non-zero code and instructs the user to run `osddt setup`.
- No prompts are shown to the user.
- The `-d, --dir <directory>` flag targets the specified directory instead of `cwd`.
- `osddt setup` writes `{ repoType, agents }` to `.osddtrc`.
