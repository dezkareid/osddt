import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import readline from 'readline';
import { resolveBarePath, listFeatureWorktrees, type WorktreeEntry } from '../utils/worktree.js';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectWorktree(entries: WorktreeEntry[]): Promise<WorktreeEntry> {
  console.log('\nMultiple feature worktrees found:');
  entries.forEach((e, i) => {
    console.log(`  ${i + 1}) ${e.featureName} (${e.branch})`);
  });
  const answer = await prompt(`Select a feature [1-${entries.length}]: `);
  const index = parseInt(answer, 10) - 1;
  if (index < 0 || index >= entries.length || isNaN(index)) {
    console.error('Invalid selection.');
    process.exit(1);
  }
  return entries[index];
}

async function runWorktreeInfo(featureName: string | undefined): Promise<void> {
  const cwd = process.cwd();
  const barePath = await resolveBarePath(cwd);

  const rcPath = path.join(cwd, '.osddtrc');
  let mainBranch = 'main';
  if (await fs.pathExists(rcPath)) {
    const rc = await fs.readJson(rcPath) as { mainBranch?: string };
    if (rc.mainBranch) mainBranch = rc.mainBranch;
  }

  const entries = listFeatureWorktrees(barePath, mainBranch);

  let entry: WorktreeEntry | undefined;

  if (featureName) {
    entry = entries.find(e => e.featureName === featureName);
    if (!entry) {
      console.error(`No worktree found for feature: ${featureName}`);
      process.exit(1);
    }
  }
  else {
    if (entries.length === 0) {
      console.error('No feature worktrees found.');
      process.exit(1);
    }
    else if (entries.length === 1) {
      entry = entries[0];
    }
    else {
      entry = await selectWorktree(entries);
    }
  }

  console.log(JSON.stringify({ worktreePath: entry.worktreePath, workingDir: entry.workingDir, branch: entry.branch }));
}

export function worktreeInfoCommand(): Command {
  const cmd = new Command('worktree-info');

  cmd
    .description('Look up worktree paths for a feature from git worktree list')
    .argument('[feature-name]', 'feature name to look up (optional if only one worktree exists)')
    .action(async (featureName: string | undefined) => {
      await runWorktreeInfo(featureName);
    });

  return cmd;
}
