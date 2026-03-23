import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { resolveBarePath, listFeatureWorktrees, type WorktreeEntry } from '../utils/worktree.js';

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
      console.error('Multiple feature worktrees found. Re-run with a feature name:');
      entries.forEach(e => console.error(`  - ${e.featureName} (${e.branch})`));
      process.exit(1);
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
