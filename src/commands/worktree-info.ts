import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import type { WorktreeEntry } from './start-worktree.js';

async function resolveRepoRoot(cwd: string): Promise<string> {
  const rcPath = path.join(cwd, '.osddtrc');
  if (await fs.pathExists(rcPath)) {
    const rc = await fs.readJson(rcPath) as { 'bare-path'?: string };
    if (rc['bare-path']) return rc['bare-path'];
  }
  return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
}

function stateFilePath(repoRoot: string): string {
  return path.join(path.dirname(repoRoot), '.osddt-worktrees');
}

async function runWorktreeInfo(featureName: string): Promise<void> {
  const repoRoot = await resolveRepoRoot(process.cwd());
  const stateFile = stateFilePath(repoRoot);

  if (!(await fs.pathExists(stateFile))) {
    console.error(`No .osddt-worktrees file found at: ${stateFile}`);
    process.exit(1);
  }

  const entries = await fs.readJson(stateFile) as WorktreeEntry[];
  const entry = entries.find(e => e.featureName === featureName);

  if (!entry) {
    console.error(`No worktree entry found for feature: ${featureName}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ worktreePath: entry.worktreePath, workingDir: entry.workingDir, branch: entry.branch }));
}

export function worktreeInfoCommand(): Command {
  const cmd = new Command('worktree-info');

  cmd
    .description('Look up worktree paths for a feature from the state file')
    .argument('<feature-name>', 'feature name to look up')
    .action(async (featureName: string) => {
      await runWorktreeInfo(featureName);
    });

  return cmd;
}
