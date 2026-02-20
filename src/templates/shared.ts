export const REPO_PREAMBLE = `## Context

Before proceeding, run the following command and parse the JSON output to get the current branch and date:

\`\`\`
npx @dezkareid/osddt meta-info
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

export const FEATURE_NAME_RULES = `### Feature Name Constraints

When deriving a feature name from a description:

- Use only lowercase letters, digits, and hyphens (\`a-z\`, \`0-9\`, \`-\`)
- Replace spaces and special characters with hyphens
- Remove consecutive hyphens (e.g. \`--\` → \`-\`)
- Remove leading and trailing hyphens
- **Maximum length: 30 characters** — if the derived name exceeds 30 characters, truncate at the last hyphen boundary before or at the 30th character
- If the input is already a valid branch name (no spaces, kebab-case or slash-separated), apply the 30-character limit to the last segment only (after the last \`/\`)
- Reject (and ask the user to provide a shorter name) if no valid name can be derived after truncation

**Examples:**

| Input | Derived feature name |
| ----------------------------------------------------- | ---------------------------- |
| \`Add user authentication\` | \`add-user-authentication\` |
| \`Implement real-time notifications for dashboard\` | \`implement-real-time\` |
| \`feat/add-user-authentication\` | \`add-user-authentication\` |
| \`feat/implement-real-time-notifications-for-dashboard\` | \`implement-real-time\` |
`;

export const WORKING_DIR_STEP = `Check whether the working directory \`<project-path>/working-on/<feature-name>\` already exists:
   - If it **does not exist**, create it:
     \`\`\`
     mkdir -p <project-path>/working-on/<feature-name>
     \`\`\`
   - If it **already exists**, warn the user and ask whether to:
     - **Resume** — continue into the existing folder (proceed to the next step without recreating it)
     - **Abort** — stop and do nothing`;

export type ArgPlaceholder = '$ARGUMENTS' | '{{args}}';

export interface CommandDefinition {
  name: string;
  description: string;
  body: (args: ArgPlaceholder) => string;
}

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    name: 'osddt.continue',
    description: 'Detect the current workflow phase and prompt the next command to run',
    body: (args) => `${REPO_PREAMBLE}## Instructions

Check the working directory \`<project-path>/working-on/<feature-name>\` for the files listed below **in order** to determine the current phase. Use the first matching condition:

| Condition | Current phase | Run next |
| --------- | ------------- | -------- |
| \`osddt.tasks.md\` exists **and** has at least one unchecked task (\`- [ ]\`) | Implementing | \`/osddt.implement ${args}\` |
| \`osddt.tasks.md\` exists **and** all tasks are checked (\`- [x]\`) | Ready to close | \`/osddt.done ${args}\` |
| \`osddt.plan.md\` exists | Planning done | \`/osddt.tasks ${args}\` |
| \`osddt.spec.md\` exists | Spec done | \`/osddt.plan ${args}\` |
| \`osddt.research.md\` exists | Research done | \`/osddt.spec ${args}\` |
| None of the above | Not started | \`/osddt.spec ${args}\` (or \`/osddt.research ${args}\` if research is needed first) |

Report which file was found, which phase that corresponds to, and the exact command the user should run next.

## Arguments

${args}
`,
  },
  {
    name: 'osddt.research',
    description: 'Research a topic and write a research file to inform the feature specification',
    body: (args) => `${REPO_PREAMBLE}## Instructions

The argument provided is: ${args}

Determine the feature name using the following logic:

1. If ${args} looks like a branch name (e.g. \`feat/my-feature\`, \`my-feature-branch\` — no spaces, kebab-case or slash-separated), derive the feature name from the last segment (after the last \`/\`, or the full value if no \`/\` is present).
2. Otherwise treat ${args} as a human-readable topic description and convert it to a feature name.

Apply the constraints below before using the name:

${FEATURE_NAME_RULES}

Once the feature name is determined:

3. ${WORKING_DIR_STEP}

4. Research the topic thoroughly:
   - Explore the existing codebase for relevant patterns, conventions, and prior art
   - Identify related files, modules, and dependencies
   - Note any constraints, risks, or open questions

5. Write the findings to \`osddt.research.md\` in the working directory using the following format:

## Research Format

The research file should include:
- **Topic**: What was researched and why
- **Codebase Findings**: Relevant existing code, patterns, and conventions found
- **External References**: Libraries, APIs, or documentation consulted
- **Key Insights**: Important discoveries that should inform the specification
- **Constraints & Risks**: Known limitations or risks uncovered during research
- **Open Questions**: Ambiguities that the specification phase should resolve

## Arguments

${args}

## Next Step

Run the following command to write the feature specification:

\`\`\`
/osddt.spec ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.start',
    description: 'Start a new feature by creating a branch and working-on folder',
    body: (args) => `${REPO_PREAMBLE}## Instructions

The argument provided is: ${args}

Determine the branch name using the following logic:

1. If ${args} looks like a branch name (e.g. \`feat/my-feature\`, \`fix/some-bug\`, \`my-feature-branch\` — no spaces, kebab-case or slash-separated), use it as-is.
2. Otherwise treat ${args} as a human-readable feature description, convert it to a feature name, and use the format \`feat/<derived-name>\` as the branch name.

Apply the constraints below to the feature name (the segment after the last \`/\`) before using it:

${FEATURE_NAME_RULES}

Once the branch name is determined:

3. Check whether the branch already exists locally or remotely:
   - If it **does not exist**, create and switch to it:
     \`\`\`
     git checkout -b <branch-name>
     \`\`\`
   - If it **already exists**, warn the user and ask whether to:
     - **Resume** — switch to the existing branch (\`git checkout <branch-name>\`) and continue
     - **Abort** — stop and do nothing

4. ${WORKING_DIR_STEP}

Where \`<feature-name>\` is the last segment of the branch name (after the last \`/\`, or the full branch name if no \`/\` is present).

5. Report the branch name and working directory that were created or resumed.

## Arguments

${args}

## Next Step

Run the following command to write the feature specification:

\`\`\`
/osddt.spec ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.spec',
    description: 'Analyze requirements and write a feature specification',
    body: (args) => `## Instructions

1. Check whether \`osddt.research.md\` exists in the working directory.
   - If it exists, read it and use its findings (key insights, constraints, open questions, codebase findings) as additional context when writing the specification.
   - If it does not exist, proceed using only the requirements provided in ${args}.
2. Analyze the requirements provided in ${args}
3. Identify the core problem being solved
4. Define the scope, constraints, and acceptance criteria
5. Write the specification to \`osddt.spec.md\` in the working directory

## Specification Format

The spec should include:
- **Overview**: What and why
- **Requirements**: Functional and non-functional
- **Scope**: What is in and out of scope
- **Acceptance Criteria**: Clear, testable criteria
- **Open Questions**: Any ambiguities to resolve

> If \`osddt.research.md\` was found, add a **Research Summary** section that briefly references the key insights and constraints it identified.

## Arguments

${args}

## Next Step

Run the following command to create the implementation plan:

\`\`\`
/osddt.plan ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.plan',
    description: 'Create a technical implementation plan from a specification',
    body: (args) => `## Instructions

1. Check whether \`osddt.plan.md\` already exists in the working directory:
   - If it **does not exist**, proceed to generate it.
   - If it **already exists**, ask the user whether to:
     - **Regenerate** — discard the existing file and create a fresh plan from scratch
     - **Update** — read the existing file and apply targeted changes based on ${args}
     - **Do nothing** — stop here and leave the file as-is
2. Read \`osddt.spec.md\` from the working directory
3. Break down the implementation into logical phases and steps
4. Identify technical decisions, dependencies, and risks
5. Write the plan to \`osddt.plan.md\` in the working directory

## Plan Format

The plan should include:
- **Architecture Overview**: High-level design decisions
- **Implementation Phases**: Ordered phases with goals
- **Technical Dependencies**: Libraries, APIs, services needed
- **Risks & Mitigations**: Known risks and how to address them
- **Out of Scope**: Explicitly what will not be built

## Arguments

${args}

## Next Step

Run the following command to generate the task list:

\`\`\`
/osddt.tasks ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.tasks',
    description: 'Generate actionable tasks from an implementation plan',
    body: (args) => `## Instructions

1. Check whether \`osddt.tasks.md\` already exists in the working directory:
   - If it **does not exist**, proceed to generate it.
   - If it **already exists**, ask the user whether to:
     - **Regenerate** — discard the existing file and create a fresh task list from scratch
     - **Update** — read the existing file and apply targeted changes based on ${args}
     - **Do nothing** — stop here and leave the file as-is
2. Read \`osddt.plan.md\` from the working directory
3. Break each phase into discrete, executable tasks
4. Estimate complexity (S/M/L) for each task
5. Write the task list to \`osddt.tasks.md\` in the working directory

## Tasks Format

The task list should include:
- **Checklist** of tasks grouped by phase
- Each task should be: \`- [ ] [S/M/L] Description of task\`
- **Dependencies**: Note which tasks must complete before others
- **Definition of Done**: Clear completion criteria per phase

## Arguments

${args}

## Next Step

Run the following command to start implementing tasks:

\`\`\`
/osddt.implement ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.implement',
    description: 'Execute tasks from the task list one by one',
    body: (args) => `## Instructions

1. Check whether \`osddt.tasks.md\` exists in the working directory:
   - If it **does not exist**, stop and ask the user to run \`/osddt.tasks ${args}\` first.
   - If it **already exists**, ask the user whether to:
     - **Continue** — find the next unchecked task and implement it (default)
     - **Update tasks** — edit \`osddt.tasks.md\` before implementing (e.g. to add, remove, or reorder tasks)
     - **Do nothing** — stop here without making any changes
2. Read \`osddt.tasks.md\` from the working directory
3. Find the next unchecked task (\`- [ ]\`)
4. Implement that task following the spec (\`osddt.spec.md\`) and plan (\`osddt.plan.md\`) in the working directory
5. Mark the task as complete (\`- [x]\`) in \`osddt.tasks.md\`
6. Report what was done and any issues encountered

## Guidelines

- Implement one task at a time
- Follow the existing code style and conventions
- Write tests for new functionality when applicable
- Ask for clarification if requirements are ambiguous

## Arguments

${args}

## Next Step

Once all tasks are checked off, run the following command to mark the feature as done:

\`\`\`
/osddt.done ${args}
\`\`\`
`,
  },
  {
    name: 'osddt.done',
    description: 'Mark a feature as done and move it from working-on to done',
    body: (args) => `## Instructions

1. Confirm all tasks in \`osddt.tasks.md\` are checked off (\`- [x]\`)
2. Run the following command to move the feature folder from \`working-on\` to \`done\`:

\`\`\`
npx @dezkareid/osddt done ${args}
\`\`\`

   The command will automatically prefix the destination folder name with today's date in \`YYYY-MM-DD\` format.
   For example, \`working-on/feature-a\` will be moved to \`done/YYYY-MM-DD-feature-a\`.

3. Report the result of the command, including the full destination path

## Arguments

${args}
`,
  },
];
