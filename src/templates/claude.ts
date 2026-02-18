import path from 'path';

interface CommandFile {
  filePath: string;
  content: string;
}

const CLAUDE_COMMANDS_DIR = '.claude/commands';

const specContent = `---
description: "Analyze requirements and write a feature specification"
---

You are a spec-driven development assistant. Your task is to analyze the given requirements and produce a clear, structured specification document.

## Instructions

1. Analyze the requirements provided in $ARGUMENTS
2. Identify the core problem being solved
3. Define the scope, constraints, and acceptance criteria
4. Write the specification to \`osddt.spec.md\` in the current directory

## Specification Format

The spec should include:
- **Overview**: What and why
- **Requirements**: Functional and non-functional
- **Scope**: What is in and out of scope
- **Acceptance Criteria**: Clear, testable criteria
- **Open Questions**: Any ambiguities to resolve

## Arguments

$ARGUMENTS
`;

const planContent = `---
description: "Create a technical implementation plan from a specification"
---

You are a spec-driven development assistant. Your task is to read the existing specification and produce a detailed technical plan.

## Instructions

1. Read \`osddt.spec.md\` in the current directory
2. Break down the implementation into logical phases and steps
3. Identify technical decisions, dependencies, and risks
4. Write the plan to \`osddt.plan.md\` in the current directory

## Plan Format

The plan should include:
- **Architecture Overview**: High-level design decisions
- **Implementation Phases**: Ordered phases with goals
- **Technical Dependencies**: Libraries, APIs, services needed
- **Risks & Mitigations**: Known risks and how to address them
- **Out of Scope**: Explicitly what will not be built

## Arguments

$ARGUMENTS
`;

const tasksContent = `---
description: "Generate actionable tasks from an implementation plan"
---

You are a spec-driven development assistant. Your task is to convert the implementation plan into a concrete, actionable task list.

## Instructions

1. Read \`osddt.plan.md\` in the current directory
2. Break each phase into discrete, executable tasks
3. Estimate complexity (S/M/L) for each task
4. Write the task list to \`osddt.tasks.md\` in the current directory

## Tasks Format

The task list should include:
- **Checklist** of tasks grouped by phase
- Each task should be: \`- [ ] [S/M/L] Description of task\`
- **Dependencies**: Note which tasks must complete before others
- **Definition of Done**: Clear completion criteria per phase

## Arguments

$ARGUMENTS
`;

const implementContent = `---
description: "Execute tasks from the task list one by one"
---

You are a spec-driven development assistant. Your task is to implement the next pending task from the task list.

## Instructions

1. Read \`osddt.tasks.md\` in the current directory
2. Find the next unchecked task (\`- [ ]\`)
3. Implement that task following the spec (\`osddt.spec.md\`) and plan (\`osddt.plan.md\`)
4. Mark the task as complete (\`- [x]\`) in \`osddt.tasks.md\`
5. Report what was done and any issues encountered

## Guidelines

- Implement one task at a time
- Follow the existing code style and conventions
- Write tests for new functionality when applicable
- Ask for clarification if requirements are ambiguous

## Arguments

$ARGUMENTS
`;

export function getClaudeTemplates(cwd: string): CommandFile[] {
  const dir = path.join(cwd, CLAUDE_COMMANDS_DIR);

  return [
    { filePath: path.join(dir, 'osddt.spec.md'), content: specContent },
    { filePath: path.join(dir, 'osddt.plan.md'), content: planContent },
    { filePath: path.join(dir, 'osddt.tasks.md'), content: tasksContent },
    { filePath: path.join(dir, 'osddt.implement.md'), content: implementContent },
  ];
}
