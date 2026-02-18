import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';

interface CommandFile {
  filePath: string;
  content: string;
}

async function writeCommandFile(file: CommandFile): Promise<void> {
  await fs.ensureDir(path.dirname(file.filePath));
  await fs.writeFile(file.filePath, file.content, 'utf-8');
  console.log(`  Created: ${file.filePath}`);
}

async function runSetup(cwd: string): Promise<void> {
  console.log('Setting up OSDDT command files...\n');

  const claudeFiles = getClaudeTemplates(cwd);
  const geminiFiles = getGeminiTemplates(cwd);

  console.log('Claude Code commands (.claude/commands/):');
  for (const file of claudeFiles) {
    await writeCommandFile(file);
  }

  console.log('\nGemini CLI commands (.gemini/commands/):');
  for (const file of geminiFiles) {
    await writeCommandFile(file);
  }

  console.log('\nSetup complete!');
  console.log('Commands created: osddt.spec, osddt.plan, osddt.tasks, osddt.implement');
}

export function setupCommand(): Command {
  const cmd = new Command('setup');

  cmd
    .description('Create OSDDT command files for Claude and Gemini CLI agents')
    .option('-d, --dir <directory>', 'target directory', process.cwd())
    .action(async (options: { dir: string }) => {
      const targetDir = path.resolve(options.dir);
      await runSetup(targetDir);
    });

  return cmd;
}
