import path from 'path';
import { COMMAND_DEFINITIONS } from './shared.js';

interface CommandFile {
  filePath: string;
  content: string;
}

const CLAUDE_COMMANDS_DIR = '.claude/commands';

function formatClaudeCommand(description: string, body: string): string {
  return `---
description: "${description}"
---

${body}`;
}

export function getClaudeTemplates(cwd: string, npxCommand: string): CommandFile[] {
  const dir = path.join(cwd, CLAUDE_COMMANDS_DIR);

  return COMMAND_DEFINITIONS.map((cmd) => ({
    filePath: path.join(dir, `${cmd.name}.md`),
    content: formatClaudeCommand(cmd.description, cmd.body('$ARGUMENTS', npxCommand)),
  }));
}
