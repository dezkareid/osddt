import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import readline from 'readline';
import { resolveBarePath, findWorktreeByFeature, type WorktreeEntry } from '../utils/worktree.js';

export type { WorktreeEntry };

function branchExists(branch: string, cwd: string): boolean {
  try {
    execSync(`git rev-parse --verify ${branch}`, { cwd, stdio: 'ignore' });
    return true;
  }
  catch {
    return false;
  }
}

function remoteBranchExists(branch: string, cwd: string): boolean {
  try {
    execSync(`git ls-remote --exit-code --heads origin ${branch}`, { cwd, stdio: 'ignore' });
    return true;
  }
  catch {
    return false;
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

interface OsddtRc {
  repoType: 'single' | 'monorepo';
  worktreeBase?: string;
  packageManager?: string;
  mainBranch?: string;
}

async function createWorktree(branch: string, worktreePath: string, repoRoot: string, mainBranch: string): Promise<void> {
  if (await fs.pathExists(worktreePath)) {
    console.log(`\nDirectory already exists at: ${worktreePath}`);
    const answer = await prompt('Resume or Abort? [R/a] ');
    if (answer.toLowerCase() === 'a') {
      console.log('Aborted.');
      process.exit(0);
    }
    return;
  }

  const localExists = branchExists(branch, repoRoot);
  const remoteExists = !localExists && remoteBranchExists(branch, repoRoot);

  if (localExists || remoteExists) {
    console.log(`\nBranch "${branch}" already exists ${localExists ? 'locally' : 'on remote'}.`);
    const answer = await prompt('Resume or Abort? [R/a] ');
    if (answer.toLowerCase() === 'a') {
      console.log('Aborted.');
      process.exit(0);
    }
    execSync(`git worktree add "${worktreePath}" ${branch}`, { cwd: repoRoot, stdio: 'inherit' });
  }
  else {
    execSync(`git worktree add "${worktreePath}" -b ${branch} ${mainBranch}`, { cwd: repoRoot, stdio: 'inherit' });
  }
}

function runInstall(worktreePath: string, packageManager?: string): void {
  if (!packageManager) {
    console.log(`\n  ℹ No packageManager configured in .osddtrc — skipping install. Run it manually inside ${worktreePath}`);
    return;
  }
  console.log(`\n  Running ${packageManager} install...`);
  execSync(`${packageManager} install`, { cwd: worktreePath, stdio: 'inherit' });
}

async function runStartWorktree(featureName: string, options: { dir?: string }): Promise<void> {
  const cwd = process.cwd();
  const repoRoot = await resolveBarePath(cwd);
  const branch = `feat/${featureName}`;

  // Read .osddtrc
  const rcPath = path.join(cwd, '.osddtrc');
  let rc: OsddtRc = { repoType: 'single' };
  if (await fs.pathExists(rcPath)) {
    rc = await fs.readJson(rcPath) as OsddtRc;
  }

  // Check for existing worktree via git worktree list
  const existingPath = findWorktreeByFeature(repoRoot, featureName);
  if (existingPath) {
    const workingDir = path.join(existingPath, 'working-on', featureName);
    console.log(`\nWorktree for "${featureName}" already exists at: ${existingPath}`);
    const answer = await prompt('Resume or Abort? [R/a] ');
    if (answer.toLowerCase() === 'a') {
      console.log('Aborted.');
      process.exit(0);
    }
    console.log(`\nResuming existing worktree.`);
    console.log(`  Branch:          ${branch}`);
    console.log(`  Worktree path:   ${existingPath}`);
    console.log(`  Working dir:     ${workingDir}`);
    return;
  }

  // Resolve worktree path — inside .bare as <barePath>/<featureName>
  const base = rc['worktreeBase'] ?? repoRoot;
  const worktreePath = path.join(base, featureName);
  const mainBranch = rc['mainBranch'] ?? 'main';

  await createWorktree(branch, worktreePath, repoRoot, mainBranch);

  // Resolve working dir
  let projectPath: string;
  if (rc['repoType'] === 'monorepo') {
    const pkg = options.dir ?? await prompt('Package path (e.g. packages/my-package): ');
    projectPath = path.join(worktreePath, pkg);
  }
  else {
    projectPath = worktreePath;
  }

  const workingDir = path.join(projectPath, 'working-on', featureName);
  await fs.ensureDir(workingDir);

  runInstall(worktreePath, rc['packageManager']);

  console.log(`\nWorktree feature started:`);
  console.log(`  Branch:          ${branch}`);
  console.log(`  Worktree path:   ${worktreePath}`);
  console.log(`  Working dir:     ${workingDir}`);
}

export function startWorktreeCommand(): Command {
  const cmd = new Command('start-worktree');

  cmd
    .description('Start a new feature using a git worktree')
    .argument('<feature-name>', 'feature name (kebab-case, max 30 chars)')
    .option('-d, --dir <package>', 'package path within monorepo (skips prompt)')
    .action(async (featureName: string, options: { dir?: string }) => {
      await runStartWorktree(featureName, options);
    });

  return cmd;
}
