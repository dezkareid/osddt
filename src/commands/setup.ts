import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { askRepoType, askAgents, type RepoType, type AgentType } from '../utils/prompt.js';

const CANONICAL_PACKAGE_NAME = '@dezkareid/osddt';
const NPX_COMMAND = 'npx osddt';
const NPX_COMMAND_FALLBACK = `npx ${CANONICAL_PACKAGE_NAME}`;

export async function resolveNpxCommand(cwd: string): Promise<string> {
  const pkgPath = path.join(cwd, 'package.json');
  try {
    const pkg = await fs.readJson(pkgPath) as { name?: string };
    if (pkg.name === CANONICAL_PACKAGE_NAME) return NPX_COMMAND;
  } catch {
    // no package.json or unreadable — fall through to default
  }
  return NPX_COMMAND_FALLBACK;
}

interface CommandFile {
  filePath: string;
  content: string;
}

interface OsddtConfig {
  repoType: RepoType;
  agents: AgentType[];
}

interface SetupOptions {
  dir: string;
  agents?: string;
  repoType?: string;
}

const VALID_AGENTS: AgentType[] = ['claude', 'gemini'];
const VALID_REPO_TYPES: RepoType[] = ['single', 'monorepo'];

function parseAgents(raw: string): AgentType[] {
  const values = raw.split(',').map((s) => s.trim());
  if (values.length === 0) {
    console.error('Error: --agents requires at least one value.');
    process.exit(1);
  }
  const invalid = values.filter((v) => !VALID_AGENTS.includes(v as AgentType));
  if (invalid.length > 0) {
    console.error(`Error: Invalid agent(s): ${invalid.join(', ')}. Valid values: ${VALID_AGENTS.join(', ')}.`);
    process.exit(1);
  }
  return values as AgentType[];
}

function parseRepoType(raw: string): RepoType {
  if (!VALID_REPO_TYPES.includes(raw as RepoType)) {
    console.error(`Error: Invalid repo type: "${raw}". Valid values: ${VALID_REPO_TYPES.join(', ')}.`);
    process.exit(1);
  }
  return raw as RepoType;
}

async function writeCommandFile(file: CommandFile): Promise<void> {
  await fs.ensureDir(path.dirname(file.filePath));
  await fs.writeFile(file.filePath, file.content, 'utf-8');
  console.log(`  Created: ${file.filePath}`);
}

async function writeConfig(cwd: string, config: OsddtConfig): Promise<void> {
  const configPath = path.join(cwd, '.osddtrc');
  await fs.writeJson(configPath, config, { spaces: 2 });
  console.log(`\nSaved config: ${configPath}`);
}

async function runSetup(cwd: string, rawAgents?: string, rawRepoType?: string): Promise<void> {
  const agents: AgentType[] =
    rawAgents !== undefined ? parseAgents(rawAgents) : await askAgents();
  if (rawAgents === undefined) console.log('');

  const repoType: RepoType =
    rawRepoType !== undefined ? parseRepoType(rawRepoType) : await askRepoType();
  if (rawRepoType === undefined) console.log('');

  const npxCommand = await resolveNpxCommand(cwd);

  console.log('Setting up OSDDT command files...\n');

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

  await writeConfig(cwd, { repoType, agents });

  console.log('\nSetup complete!');
  console.log('Commands created: osddt.spec, osddt.plan, osddt.tasks, osddt.implement');
}

export function setupCommand(): Command {
  const cmd = new Command('setup');

  cmd
    .description('Create OSDDT command files for Claude and Gemini CLI agents')
    .option('-d, --dir <directory>', 'target directory', process.cwd())
    .option('--agents <list>', 'comma-separated agents to set up (claude, gemini)')
    .option('--repo-type <type>', 'repository type (single, monorepo)')
    .action(async (options: SetupOptions) => {
      const targetDir = path.resolve(options.dir);
      await runSetup(targetDir, options.agents, options.repoType);
    });

  return cmd;
}
