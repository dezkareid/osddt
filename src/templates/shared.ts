
export function getRepoPreamble(npxCommand: string): string {
  return `## Context

Before proceeding, run the following command and parse the JSON output to get the current branch and date:

\`\`\`
${npxCommand} meta-info
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

All generated files live under \`<project-path>/working-on/<feature-name>/\`.

> All file paths in the instructions below are relative to \`<project-path>/working-on/<feature-name>/\`.

`;
}

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

export const RESOLVE_FEATURE_NAME = `### Resolving the Feature Name

Use the following logic to determine \`<feature-name>\`:

1. If arguments were provided, derive the feature name from them:
   - If the argument looks like a branch name (no spaces, kebab-case or slash-separated), use the last segment (after the last \`/\`, or the full value if no \`/\` is present).
   - Otherwise treat it as a human-readable description and convert it to a feature name following the constraints in the Feature Name Constraints section.
2. If **no arguments were provided**:
   - List all folders under \`<project-path>/working-on/\`.
   - If there is **only one folder**, use it automatically and inform the user.
   - If there are **multiple folders**, present the list to the user and ask them to pick one.
   - If there are **no folders**, inform the user that no in-progress features were found and stop.`;

export function getNextStepToSpec(args: ArgPlaceholder): string {
  return `## Next Step

- If ${args} was a **human-readable description** (not a branch name):

  Your description will be used as the starting point for the spec. Run:

  \`\`\`
  /osddt.spec
  \`\`\`

  > You can append more details if you want the spec to capture additional context.

- If ${args} was a **branch name** (or no arguments were provided):

  Run the following command to write the feature specification:

  \`\`\`
  /osddt.spec <brief feature description, e.g. "add user authentication with JWT">
  \`\`\`

  > Add a short description of what you're building so the spec has the right starting point.`;
}

export type ArgPlaceholder = '$ARGUMENTS' | '{{args}}';

export interface CommandDefinitionContext {
  args: ArgPlaceholder;
  npxCommand: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  body: (ctx: CommandDefinitionContext) => string;
}

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    name: 'osddt.continue',
    description: 'Detect the current workflow phase and prompt the next command to run',
    body: ({ args, npxCommand }) => `${getRepoPreamble(npxCommand)}${RESOLVE_FEATURE_NAME}

## Instructions

Check the working directory \`<project-path>/working-on/<feature-name>\` for the files listed below **in order** to determine the current phase. Use the first matching condition:

| Condition | Current phase | Run next |
| --------- | ------------- | -------- |
| \`osddt.tasks.md\` exists **and** has at least one unchecked task (\`- [ ]\`) | Implementing | \`/osddt.implement\` |
| \`osddt.tasks.md\` exists **and** all tasks are checked (\`- [x]\`) | Ready to close | \`/osddt.done\` |
| \`osddt.plan.md\` exists | Planning done | \`/osddt.tasks\` |
| \`osddt.spec.md\` exists | Spec done | \`/osddt.plan <tech stack and key technical decisions>\` |
| \`osddt.research.md\` exists | Research done | \`/osddt.spec <brief feature description>\` |
| None of the above | Not started | \`/osddt.spec <brief feature description>\` (or \`/osddt.research <topic>\` if research is needed first) |

Report which file was found, which phase that corresponds to, and the exact command the user should run next.

> **Open Questions check**: After reporting the phase, if the detected phase is **Spec done** or **Planning done**, also check whether \`osddt.spec.md\` contains any unanswered open questions (items in the **Open Questions** section with no corresponding entry in the **Decisions** section). If unanswered questions exist, inform the user and recommend running \`/osddt.clarify <feature-name>\` before (or in addition to) the suggested next command.

## Arguments

${args}
`,
  },
  {
    name: 'osddt.research',
    description: 'Research a topic and write a research file to inform the feature specification',
    body: ({ args, npxCommand }) => `${getRepoPreamble(npxCommand)}## Instructions

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

${getNextStepToSpec(args)}
`,
  },
  {
    name: 'osddt.start',
    description: 'Start a new feature by creating a branch and working-on folder',
    body: ({ args, npxCommand }) => `${getRepoPreamble(npxCommand)}## Instructions

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

${getNextStepToSpec(args)}
`,
  },
  {
    name: 'osddt.spec',
    description: 'Analyze requirements and write a feature specification',
    body: ({ args }) => `## Instructions

1. Gather requirements from all available sources — combine them when multiple sources are present:
   - **Arguments** (${args}): use as the primary description of the feature, if provided.
   - **Conversation context**: consider any additional details, clarifications, or constraints discussed in the current session that are not captured in ${args}.
   - **Research file**: if \`osddt.research.md\` exists in the working directory, read it and incorporate its findings (key insights, constraints, open questions, codebase findings).
2. Analyze the combined requirements
3. Identify the core problem being solved
4. Define the scope, user-facing constraints, and acceptance criteria
5. Write the specification to \`osddt.spec.md\` in the working directory
6. After writing the spec, check whether the **Open Questions** section contains any items:
   - If it does, inform the user: "I have some open questions — can we clarify these? You can answer them now, or run \`/osddt.clarify\` to go through them one by one."
   - If it does not (or the section is absent), proceed to the Next Step without mentioning clarification.

## Specification Format

The spec should describe **what** the feature does and **why**, from a product and user perspective. Do **not** include implementation details, technology choices, or technical architecture — those belong in the plan.

The spec should include:
- **Overview**: What the feature is and why it is needed
- **Requirements**: Functional requirements only — what the system must do, expressed as user-observable behaviours
- **Scope**: What is in and out of scope, described in product terms
- **Acceptance Criteria**: Clear, testable criteria written from a user or business perspective
- **Open Questions**: Ambiguities about desired behaviour or product decisions to resolve

> If \`osddt.research.md\` was found, add a **Research Summary** section that briefly references the key insights and user-facing constraints it identified.
> If additional context was gathered from the conversation session, add a **Session Context** section summarising any extra details, decisions, or constraints discussed beyond what was passed as arguments.

## Arguments

${args}

## Next Step

Run the following command to create the implementation plan:

\`\`\`
/osddt.plan <tech stack and key technical decisions, e.g. "use Node.js with SQLite, REST API, no auth">
\`\`\`
`,
  },
  {
    name: 'osddt.clarify',
    description: 'Resolve open questions in the spec and record decisions',
    body: () => `## Instructions

1. Check whether \`osddt.spec.md\` exists in the working directory:
   - If it **does not exist**, inform the user that no spec was found and suggest running \`/osddt.spec <brief feature description>\` first. Stop here.

2. Read \`osddt.spec.md\` and extract all items listed under the **Open Questions** section.
   - If the **Open Questions** section is absent or empty, inform the user that there are no open questions to resolve. Skip to step 6.

3. Read the **Decisions** section of \`osddt.spec.md\` (if it exists) to determine which questions have already been answered.
   - A question is considered answered if there is a corresponding numbered entry in the **Decisions** section.
   - List the already-answered questions to the user and inform them they will be skipped.

4. For each **unanswered** question (in order), present it to the user and collect a response.
   - If all questions were already answered, inform the user and skip to step 6.

5. Update \`osddt.spec.md\`:
   - Remove each answered question from the **Open Questions** section.
   - If the **Open Questions** section becomes empty after removal, remove the section heading as well.
   - If a **Decisions** section already exists, append new entries to it (do not modify existing entries).
   - If no **Decisions** section exists, add one at the end of the file.
   - Each decision entry uses the format: \`N. **<short question summary>**: <answer>\`

6. Inform the user that all questions are now resolved (or were already resolved). Then prompt them to run (or re-run) the plan step so it reflects the updated decisions:

\`\`\`
/osddt.plan <tech stack and key technical decisions, e.g. "use Node.js with SQLite, REST API, no auth">
\`\`\`

> Note: if \`osddt.plan.md\` already exists, the plan should be regenerated to incorporate the decisions.
`,
  },
  {
    name: 'osddt.plan',
    description: 'Create a technical implementation plan from a specification',
    body: ({ args }) => `${RESOLVE_FEATURE_NAME}

## Instructions

1. Check whether \`osddt.plan.md\` already exists in the working directory:
   - If it **does not exist**, proceed to generate it.
   - If it **already exists**, ask the user whether to:
     - **Regenerate** — discard the existing file and create a fresh plan from scratch
     - **Update** — read the existing file and apply targeted changes based on ${args}
     - **Do nothing** — stop here and leave the file as-is
2. Read \`osddt.spec.md\` from the working directory
3. Check for unanswered open questions in the spec:
   - Count the items in the **Open Questions** section that have no corresponding entry in the **Decisions** section.
   - If there are any unanswered questions, inform the user: "This spec has X unanswered open question(s)."
   - Ask the user whether to:
     - **Clarify first** — stop here and suggest running \`/osddt.clarify <feature-name>\` instead
     - **Proceed anyway** — continue with plan generation using the spec as-is
   - If there are no unanswered questions, proceed silently.
4. Break down the implementation into logical phases and steps
5. Identify technical decisions, dependencies, and risks
6. Write the plan to \`osddt.plan.md\` in the working directory

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
/osddt.tasks
\`\`\`
`,
  },
  {
    name: 'osddt.tasks',
    description: 'Generate actionable tasks from an implementation plan',
    body: () => `${RESOLVE_FEATURE_NAME}

## Instructions

1. Check whether \`osddt.tasks.md\` already exists in the working directory:
   - If it **does not exist**, proceed to generate it.
   - If it **already exists**, ask the user whether to:
     - **Regenerate** — discard the existing file and create a fresh task list from scratch
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

## Next Step

Run the following command to start implementing tasks:

\`\`\`
/osddt.implement
\`\`\`
`,
  },
  {
    name: 'osddt.implement',
    description: 'Execute tasks from the task list one by one',
    body: () => `## Instructions

1. Check whether \`osddt.tasks.md\` exists in the working directory:
   - If it **does not exist**, stop and ask the user to run \`/osddt.tasks\` first.
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

## Next Step

Once all tasks are checked off, run the following command to mark the feature as done:

\`\`\`
/osddt.done
\`\`\`
`,
  },
  {
    name: 'osddt.done',
    description: 'Mark a feature as done and move it from working-on to done',
    body: ({ npxCommand }) => `## Instructions

1. Confirm all tasks in \`osddt.tasks.md\` are checked off (\`- [x]\`)
2. Run the following command to move the feature folder from \`working-on\` to \`done\`:

\`\`\`
${npxCommand} done <feature-name> --dir <project-path>
\`\`\`

   The command will automatically prefix the destination folder name with today's date in \`YYYY-MM-DD\` format.
   For example, \`working-on/feature-a\` will be moved to \`done/YYYY-MM-DD-feature-a\`.

3. Report the result of the command, including the full destination path
`,
  },
];
