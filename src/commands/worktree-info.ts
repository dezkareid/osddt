import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { resolveBarePath, listFeatureWorktrees, type WorktreeEntry } from '../utils/worktree.js';

async function resolveWorkingDir(worktreePath: string, featureName: string): Promise<string> {
  const target = path.join('working-on', featureName);
  // Check root first (single repo)
  if (await fs.pathExists(path.join(worktreePath, target))) {
    return path.join(worktreePath, target);
  }
  // Search one level deep (monorepo packages)
  try {
    const entries = await fs.readdir(worktreePath);
    for (const entry of entries) {
      const candidate = path.join(worktreePath, entry, target);
      if (await fs.pathExists(candidate)) {
        return candidate;
      }
    }
  }
  catch {
    // worktreePath not accessible — fall through to default
  }
  return path.join(worktreePath, target);
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
      console.log(JSON.stringify({ error: 'not-found', featureName }));
      process.exit(1);
    }
  }
  else {
    if (entries.length === 0) {
      console.log(JSON.stringify({ error: 'none' }));
      process.exit(1);
    }
    else if (entries.length === 1) {
      entry = entries[0];
    }
    else {
      console.log(JSON.stringify({ error: 'multiple', worktrees: entries.map(e => ({ featureName: e.featureName, branch: e.branch })) }));
      process.exit(1);
    }
  }

  const workingDir = await resolveWorkingDir(entry.worktreePath, entry.featureName);
  console.log(JSON.stringify({ worktreePath: entry.worktreePath, workingDir, branch: entry.branch }));
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
