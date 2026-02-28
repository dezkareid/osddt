import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { resolveNpxCommand } from './setup.js';
import type { AgentType } from '../utils/prompt.js';

interface UpdateOptions {
  dir: string;
}

interface CommandFile {
  filePath: string;
  content: string;
}

interface OsddtConfig {
  repoType: string;
  agents?: AgentType[];
}

interface AgentConfig {
  dir: string[];
  filePattern: RegExp;
}

const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  claude: { dir: ['.claude', 'commands'], filePattern: /^osddt\..+\.md$/ },
  gemini: { dir: ['.gemini', 'commands'], filePattern: /^osddt\..+\.toml$/ },
};

async function hasOsddtCommandFile(dir: string, pattern: RegExp): Promise<boolean> {
  if (!(await fs.pathExists(dir))) return false;
  const entries = await fs.readdir(dir);
  return entries.some((f) => pattern.test(f));
}

async function inferAgents(cwd: string): Promise<AgentType[]> {
  const detected: AgentType[] = [];
  for (const [agent, config] of Object.entries(AGENT_CONFIGS) as [AgentType, AgentConfig][]) {
    const dir = path.join(cwd, ...config.dir);
    if (await hasOsddtCommandFile(dir, config.filePattern)) {
      detected.push(agent);
    }
  }
  return detected;
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

  const config = await fs.readJson(configPath) as OsddtConfig;
  const npxCommand = await resolveNpxCommand(cwd);

  let agents = config.agents;

  if (!agents || agents.length === 0) {
    agents = await inferAgents(cwd);
    if (agents.length === 0) {
      console.error('Error: No agent command directories found. Run `osddt setup` first.');
      process.exit(1);
    }
    await fs.writeJson(configPath, { ...config, agents }, { spaces: 2 });
    console.log(`Inferred agents from command directories and saved to .osddtrc: ${agents.join(', ')}\n`);
  }

  console.log('Updating OSDDT command files...\n');

  if (agents.includes('claude')) {
    const claudeFiles = getClaudeTemplates(cwd, npxCommand);
    console.log('Claude Code commands (.claude/commands/):');
    for (const file of claudeFiles) {
      await writeCommandFile(file);
    }
    console.log('');
  }

  if (agents.includes('gemini')) {
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
