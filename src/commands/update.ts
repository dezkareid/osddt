import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { resolveNpxCommand } from './setup.js';

interface UpdateOptions {
  dir: string;
}

interface CommandFile {
  filePath: string;
  content: string;
}

async function writeCommandFile(file: CommandFile): Promise<void> {
  await fs.writeFile(file.filePath, file.content, 'utf-8');
  console.log(`  Updated: ${file.filePath}`);
}

async function runUpdate(cwd: string): Promise<void> {
  const configPath = path.join(cwd, '.osddtrc');

  if (!(await fs.pathExists(configPath))) {
    console.error('Error: .osddtrc not found. Run `osddt setup` first.');
    process.exit(1);
  }

  const npxCommand = await resolveNpxCommand(cwd);

  const claudeDir = path.join(cwd, '.claude', 'commands');
  const geminiDir = path.join(cwd, '.gemini', 'commands');

  const hasClaude = await fs.pathExists(claudeDir);
  const hasGemini = await fs.pathExists(geminiDir);

  if (!hasClaude && !hasGemini) {
    console.error('Error: No agent command directories found. Run `osddt setup` first.');
    process.exit(1);
  }

  console.log('Updating OSDDT command files...\n');

  if (hasClaude) {
    const claudeFiles = getClaudeTemplates(cwd, npxCommand);
    console.log('Claude Code commands (.claude/commands/):');
    for (const file of claudeFiles) {
      await writeCommandFile(file);
    }
    console.log('');
  }

  if (hasGemini) {
    const geminiFiles = getGeminiTemplates(cwd, npxCommand);
    console.log('Gemini CLI commands (.gemini/commands/):');
    for (const file of geminiFiles) {
      await writeCommandFile(file);
    }
    console.log('');
  }

  console.log('Update complete!');
}

export function updateCommand(): Command {
  const cmd = new Command('update');

  cmd
    .description('Regenerate agent command files from the existing .osddtrc configuration')
    .option('-d, --dir <directory>', 'target directory', process.cwd())
    .action(async (options: UpdateOptions) => {
      const targetDir = path.resolve(options.dir);
      await runUpdate(targetDir);
    });

  return cmd;
}
