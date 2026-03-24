import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { resolveBarePath, findWorktreeByFeature } from '../utils/worktree.js';

function todayPrefix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runDone(featureName: string, cwd: string, worktree: boolean): Promise<void> {
  const barePath = worktree ? await resolveBarePath(process.cwd()) : undefined;
  const worktreePath = worktree ? findWorktreeByFeature(barePath!, featureName) : undefined;

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

  if (!worktreePath) {
    console.error(`Warning: No worktree found for "${featureName}". Skipping worktree cleanup.`);
    return;
  }

  if (await fs.pathExists(worktreePath)) {
    execSync(`git worktree remove "${worktreePath}" --force`, { cwd: barePath, stdio: 'inherit' });
    console.log(`Removed worktree: ${worktreePath}`);
  }
  else {
    console.log(`Worktree path not found on filesystem, skipping git worktree remove.`);
  }
}

export function doneCommand(): Command {
  const cmd = new Command('done');

  cmd
    .description('Move a feature from working-on/<feature-name> to done/<feature-name>')
    .argument('<feature-name>', 'name of the feature to mark as done')
    .option('-d, --dir <directory>', 'project directory', process.cwd())
    .option('--worktree', 'also remove the git worktree')
    .action(async (featureName: string, options: { dir: string; worktree?: boolean }) => {
      const targetDir = path.resolve(options.dir);
      await runDone(featureName, targetDir, options.worktree ?? false);
    });

  return cmd;
}
