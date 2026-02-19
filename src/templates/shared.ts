export const REPO_PREAMBLE = `## Context

Before proceeding, run the following command and parse the JSON output to get the current branch and date:

\`\`\`
npx osddt meta-info
\`\`\`

## Repository Configuration

Before proceeding, read the \`.osddtrc\` file in the root of the repository to determine the project path.

\`\`\`json
// .osddtrc example
{ "repoType": "monorepo" | "single" }
\`\`\`

- If \`repoType\` is \`"single"\`: the project path is the repository root.
- If \`repoType\` is \`"monorepo"\`: ask the user which package to work on (e.g. \`packages/my-package\`), then use \`<repo-root>/<package>\` as the project path.

## Working Directory

All generated files live under \`<project-path>/working-on/<feature-name>/\`. The \`<feature-name>\` is derived from the arguments provided. Create the directory if it does not exist.

> All file paths in the instructions below are relative to \`<project-path>/working-on/<feature-name>/\`.

`;

export type ArgPlaceholder = '$ARGUMENTS' | '{{args}}';

export interface CommandDefinition {
  name: string;
  description: string;
  body: (args: ArgPlaceholder) => string;
}

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    name: 'osddt.start',
    description: 'Start a new feature by creating a branch and working-on folder',
    body: (args) => `## Instructions

The argument provided is: ${args}

Determine the branch name using the following logic:

1. If ${args} looks like a branch name (e.g. \`feat/my-feature\`, \`fix/some-bug\`, \`my-feature-branch\` — no spaces, kebab-case or slash-separated), use it as-is.
2. Otherwise treat ${args} as a human-readable feature description and derive a branch name from it:
   - Convert to lowercase
   - Replace spaces and special characters with hyphens
   - Use the format \`feat/<derived-name>\`
   - Example: "Add user authentication" → \`feat/add-user-authentication\`

Once the branch name is determined:

3. Create and switch to the branch:

\`\`\`
git checkout -b <branch-name>
\`\`\`

4. Read the \`.osddtrc\` file in the root of the repository to determine the project path.

\`\`\`json
// .osddtrc example
{ "repoType": "monorepo" | "single" }
\`\`\`

- If \`repoType\` is \`"single"\`: the project path is the repository root.
- If \`repoType\` is \`"monorepo"\`: ask the user which package to work on (e.g. \`packages/my-package\`), then use \`<repo-root>/<package>\` as the project path.

5. Create the working directory:

\`\`\`
mkdir -p <project-path>/working-on/<feature-name>
\`\`\`

Where \`<feature-name>\` is the last segment of the branch name (after the last \`/\`, or the full branch name if no \`/\` is present).

6. Report the branch name and working directory that were created.

## Arguments

${args}
`,
  },
  {
    name: 'osddt.spec',
    description: 'Analyze requirements and write a feature specification',
    body: (args) => `${REPO_PREAMBLE}## Instructions

1. Analyze the requirements provided in ${args}
2. Identify the core problem being solved
3. Define the scope, constraints, and acceptance criteria
4. Write the specification to \`osddt.spec.md\` in the working directory

## Specification Format

The spec should include:
- **Overview**: What and why
- **Requirements**: Functional and non-functional
- **Scope**: What is in and out of scope
- **Acceptance Criteria**: Clear, testable criteria
- **Open Questions**: Any ambiguities to resolve

## Arguments

${args}
`,
  },
  {
    name: 'osddt.plan',
    description: 'Create a technical implementation plan from a specification',
    body: (args) => `${REPO_PREAMBLE}## Instructions

1. Read \`osddt.spec.md\` from the working directory
2. Break down the implementation into logical phases and steps
3. Identify technical decisions, dependencies, and risks
4. Write the plan to \`osddt.plan.md\` in the working directory

## Plan Format

The plan should include:
- **Architecture Overview**: High-level design decisions
- **Implementation Phases**: Ordered phases with goals
- **Technical Dependencies**: Libraries, APIs, services needed
- **Risks & Mitigations**: Known risks and how to address them
- **Out of Scope**: Explicitly what will not be built

## Arguments

${args}
`,
  },
  {
    name: 'osddt.tasks',
    description: 'Generate actionable tasks from an implementation plan',
    body: (args) => `${REPO_PREAMBLE}## Instructions

1. Read \`osddt.plan.md\` from the working directory
2. Break each phase into discrete, executable tasks
3. Estimate complexity (S/M/L) for each task
4. Write the task list to \`osddt.tasks.md\` in the working directory

## Tasks Format

The task list should include:
- **Checklist** of tasks grouped by phase
- Each task should be: \`- [ ] [S/M/L] Description of task\`
- **Dependencies**: Note which tasks must complete before others
- **Definition of Done**: Clear completion criteria per phase

## Arguments

${args}
`,
  },
  {
    name: 'osddt.implement',
    description: 'Execute tasks from the task list one by one',
    body: (args) => `${REPO_PREAMBLE}## Instructions

1. Read \`osddt.tasks.md\` from the working directory
2. Find the next unchecked task (\`- [ ]\`)
3. Implement that task following the spec (\`osddt.spec.md\`) and plan (\`osddt.plan.md\`) in the working directory
4. Mark the task as complete (\`- [x]\`) in \`osddt.tasks.md\`
5. Report what was done and any issues encountered

## Guidelines

- Implement one task at a time
- Follow the existing code style and conventions
- Write tests for new functionality when applicable
- Ask for clarification if requirements are ambiguous

## Arguments

${args}
`,
  },
  {
    name: 'osddt.done',
    description: 'Mark a feature as done and move it from working-on to done',
    body: (args) => `${REPO_PREAMBLE}## Instructions

1. Confirm all tasks in \`osddt.tasks.md\` are checked off (\`- [x]\`)
2. Run the following command to move the feature folder from \`working-on\` to \`done\`:

\`\`\`
npx osddt done ${args}
\`\`\`

3. Report the result of the command

## Arguments

${args}
`,
  },
];
