import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import type { WorktreeEntry } from './start-worktree.js';

function todayPrefix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function resolveRepoRoot(cwd: string): string {
  return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
}

function stateFilePath(repoRoot: string): string {
  return path.join(path.dirname(repoRoot), '.osddt-worktrees');
}

async function runDone(featureName: string, cwd: string, worktree: boolean): Promise<void> {
  const src = path.join(cwd, 'working-on', featureName);
  const destName = `${todayPrefix()}-${featureName}`;
  const dest = path.join(cwd, 'done', destName);

  if (!(await fs.pathExists(src))) {
    console.error(`Error: working-on/${featureName} does not exist.`);
    process.exit(1);
  }

  await fs.ensureDir(path.dirname(dest));
  await fs.move(src, dest);
  console.log(`Moved: working-on/${featureName} → done/${destName}`);

  if (!worktree) return;

  const repoRoot = resolveRepoRoot(process.cwd());
  const stateFile = stateFilePath(repoRoot);

  if (!(await fs.pathExists(stateFile))) {
    console.error(`Warning: .osddt-worktrees not found at ${stateFile}. Skipping worktree cleanup.`);
    return;
  }

  const entries = await fs.readJson(stateFile) as WorktreeEntry[];
  const entry = entries.find(e => e.featureName === featureName);

  if (!entry) {
    console.error(`Warning: No worktree entry found for "${featureName}". Skipping worktree cleanup.`);
    return;
  }

  if (await fs.pathExists(entry.worktreePath)) {
    execSync(`git worktree remove "${entry.worktreePath}" --force`, { cwd: repoRoot, stdio: 'inherit' });
    console.log(`Removed worktree: ${entry.worktreePath}`);
  }
  else {
    console.log(`Worktree path not found on filesystem, skipping git worktree remove.`);
  }

  const updated = entries.filter(e => e.featureName !== featureName);
  await fs.writeJson(stateFile, updated, { spaces: 2 });
  console.log(`Removed state entry for "${featureName}" from .osddt-worktrees`);
}

export function doneCommand(): Command {
  const cmd = new Command('done');

  cmd
    .description('Move a feature from working-on/<feature-name> to done/<feature-name>')
    .argument('<feature-name>', 'name of the feature to mark as done')
    .option('-d, --dir <directory>', 'project directory', process.cwd())
    .option('--worktree', 'also remove the git worktree and clean up the state file')
    .action(async (featureName: string, options: { dir: string; worktree?: boolean }) => {
      const targetDir = path.resolve(options.dir);
      await runDone(featureName, targetDir, options.worktree ?? false);
    });

  return cmd;
}
