# Spec: Embeddable Context in Commands via Convention Folder

## Overview

Currently, OSDDT generates command files (for Claude, Gemini, etc.) with fixed content derived entirely from `shared.ts` templates. There is no way for users to inject project-specific context — such as architecture notes, team conventions, or domain-specific instructions — into the generated commands without manually editing the output files (which would be overwritten on the next `osddt update`).

This feature introduces a convention-based folder (`osddt-context/`) where users place Markdown files named after the command they want to augment. Rather than baking the content in at generation time, generated command files instruct the agent to call a new CLI command (`osddt context <name>`) at invocation time — the same pattern used by `meta-info`. This keeps generated files deterministic and means context changes take effect immediately without re-running `osddt update`.

A new `osddt context` CLI command serves two purposes: scaffolding stub files for users to fill in, and outputting a named context file's contents at agent invocation time.

## Session Context

The feature evolved through clarification: no `.osddtrc` changes; discovery is filesystem-based via a convention folder; context is per-command via filename matching; injection happens at agent runtime (not generation time) via a CLI command following the `meta-info` pattern; a `osddt context` command both scaffolds and serves context content.

## Requirements

1. A new `osddt context <name>` CLI command outputs the contents of `osddt-context/<name>.md` to stdout (plain text, not JSON).
2. When `osddt setup` or `osddt update` is run, generated command files include an instruction to call `osddt context <command-name>` at invocation time and incorporate the output as project context, just before `## Arguments` or `## Next Step`.
3. The instruction is included in generated commands regardless of whether `osddt-context/` exists — the agent calls the command and uses the output only if it returns content.
4. If `osddt-context/<name>.md` does not exist, `osddt context <name>` exits silently with no output (no error), so the agent gracefully skips the context step.
5. Running `osddt context --init` (or `osddt context init`) creates the `osddt-context/` folder and one stub `.md` file per command with placeholder content.
6. If `osddt-context/` already exists when `--init` is run, it does not overwrite existing files — only creates missing stubs.
7. The runtime instruction is included in both Claude (Markdown) and Gemini (TOML) generated command formats.

## Scope

### In Scope
- New `osddt context <name>` subcommand: reads and outputs `osddt-context/<name>.md`.
- `osddt context --init` (or subcommand): scaffolds `osddt-context/` with stub files.
- Generated command templates include a runtime instruction to call `osddt context <command-name>` and embed the result under a `## Custom Context` heading just before `## Arguments` or `## Next Step`.
- Support for both Claude (Markdown) and Gemini (TOML) output formats.
- `osddt setup` and `osddt update` both emit the runtime instruction in generated commands.

### Out of Scope
- Any changes to `.osddtrc` for context configuration.
- Baking context content into generated files at setup/update time.
- A global/shared context file applied to all commands at once.
- User-customizable section heading (fixed as `## Custom Context`).
- Validation or linting of context file content.
- Multiple context blocks per command.

## Acceptance Criteria

1. A user who creates `osddt-context/plan.md` with custom content and invokes the `osddt.plan` agent command sees that content appear under `## Custom Context` in the agent's working context (retrieved via `osddt context plan` at runtime).
2. A user with no `osddt-context/plan.md` file experiences no error — `osddt context plan` exits silently and the agent skips the context step.
3. A user can edit `osddt-context/plan.md` and immediately see the updated content on the next agent invocation, without re-running `osddt update`.
4. Running `osddt context --init` creates `osddt-context/` with one stub `.md` file per command; re-running it does not overwrite files that already exist.
5. Generated command files (Claude and Gemini) include the instruction to run `osddt context <name>` at invocation time after `osddt setup` or `osddt update`.
6. `osddt context <name>` outputs the raw Markdown content of the file to stdout with no additional formatting or wrapper.

## Decisions

1. **Injection timing**: Runtime (agent invocation), not generation time — follows the `meta-info` pattern, keeps generated files deterministic, and means context edits take effect without re-running `osddt update`.
2. **Discovery mechanism**: Convention folder `osddt-context/` at project root; filename matches command name without the `osddt.` prefix (e.g. `plan.md` for `osddt.plan`).
3. **CLI command**: `osddt context <name>` outputs file contents; `osddt context --init` scaffolds stubs.
4. **Label/heading**: Fixed as `## Custom Context` — simplifies implementation and keeps agent output predictable.
5. **Missing file behaviour**: Silent exit with no output — agent skips gracefully, no hard failure.
