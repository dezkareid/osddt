import path from 'path';
import { COMMAND_DEFINITIONS } from './shared.js';

interface CommandFile {
  filePath: string;
  content: string;
}

const GEMINI_COMMANDS_DIR = '.gemini/commands';

function formatGeminiCommand(description: string, body: string): string {
  return `description = "${description}"

prompt = """
${body}"""
`;
}

export function getGeminiTemplates(cwd: string, npxCommand: string): CommandFile[] {
  const dir = path.join(cwd, GEMINI_COMMANDS_DIR);

  return COMMAND_DEFINITIONS.map((cmd) => ({
    filePath: path.join(dir, `${cmd.name}.toml`),
    content: formatGeminiCommand(cmd.description, cmd.body('{{args}}', npxCommand)),
  }));
}
