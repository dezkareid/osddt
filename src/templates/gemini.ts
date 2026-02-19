import path from 'path';

interface CommandFile {
  filePath: string;
  content: string;
}

const GEMINI_COMMANDS_DIR = '.gemini/commands';

const REPO_PREAMBLE = `## Repository Configuration

Before proceeding, read the \`.osddtrc\` file in the root of the repository to determine the repository type.

\`\`\`json
// .osddtrc example
{ "repoType": "monorepo" | "single" }
\`\`\`

- If \`repoType\` is \`"single"\`: use the repository root as the working directory for all generated files.
- If \`repoType\` is \`"monorepo"\`: ask the user for the relative path to the target package (e.g. \`packages/my-feature\`), then use that directory as the working directory for all generated files. Create the directory if it does not exist.

> All file paths in the instructions below are relative to the resolved working directory.

`;

const specContent = `description = "Analyze requirements and write a feature specification"

prompt = """
${REPO_PREAMBLE}## Instructions

1. Analyze the requirements provided in {{args}}
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

{{args}}
"""
`;

const planContent = `description = "Create a technical implementation plan from a specification"

prompt = """
${REPO_PREAMBLE}## Instructions

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

{{args}}
"""
`;

const tasksContent = `description = "Generate actionable tasks from an implementation plan"

prompt = """
${REPO_PREAMBLE}## Instructions

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

{{args}}
"""
`;

const implementContent = `description = "Execute tasks from the task list one by one"

prompt = """
${REPO_PREAMBLE}## Instructions

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

{{args}}
"""
`;

export function getGeminiTemplates(cwd: string): CommandFile[] {
  const dir = path.join(cwd, GEMINI_COMMANDS_DIR);

  return [
    { filePath: path.join(dir, 'osddt.spec.toml'), content: specContent },
    { filePath: path.join(dir, 'osddt.plan.toml'), content: planContent },
    { filePath: path.join(dir, 'osddt.tasks.toml'), content: tasksContent },
    { filePath: path.join(dir, 'osddt.implement.toml'), content: implementContent },
  ];
}
