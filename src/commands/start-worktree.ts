import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import readline from 'readline';

export interface WorktreeEntry {
  featureName: string;
  branch: string;
  worktreePath: string;
  workingDir: string;
  repoRoot: string;
}

function repoName(repoRoot: string): string {
  return path.basename(repoRoot);
}

function stateFilePath(repoRoot: string): string {
  return path.join(path.dirname(repoRoot), '.osddt-worktrees');
}

async function readStateFile(stateFile: string): Promise<WorktreeEntry[]> {
  if (!(await fs.pathExists(stateFile))) return [];
  return fs.readJson(stateFile) as Promise<WorktreeEntry[]>;
}

async function writeStateFile(stateFile: string, entries: WorktreeEntry[]): Promise<void> {
  await fs.writeJson(stateFile, entries, { spaces: 2 });
}

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
  'bare-path'?: string;
}

async function resolveRepoRoot(cwd: string): Promise<string> {
  const rcPath = path.join(cwd, '.osddtrc');
  if (await fs.pathExists(rcPath)) {
    const rc = await fs.readJson(rcPath) as OsddtRc;
    if (rc['bare-path']) return rc['bare-path'];
  }
  return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
}

async function createWorktree(branch: string, worktreePath: string, repoRoot: string): Promise<void> {
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
    execSync(`git worktree add "${worktreePath}" -b ${branch}`, { cwd: repoRoot, stdio: 'inherit' });
  }
}

async function runStartWorktree(featureName: string, options: { dir?: string }): Promise<void> {
  const cwd = process.cwd();
  const repoRoot = await resolveRepoRoot(cwd);
  const branch = `feat/${featureName}`;

  // Read .osddtrc
  const rcPath = path.join(cwd, '.osddtrc');
  let rc: OsddtRc = { repoType: 'single' };
  if (await fs.pathExists(rcPath)) {
    rc = await fs.readJson(rcPath) as OsddtRc;
  }

  // Resolve worktree path — base is parent of repoRoot (i.e. cwd when using .bare)
  const base = rc.worktreeBase ?? path.dirname(repoRoot);
  const worktreePath = path.join(base, `${repoName(repoRoot)}-${featureName}`);

  // Check state file for existing entry
  const stateFile = stateFilePath(repoRoot);
  const entries = await readStateFile(stateFile);
  const existing = entries.find(e => e.featureName === featureName);

  if (existing) {
    console.log(`\nWorktree for "${featureName}" already exists at: ${existing.worktreePath}`);
    const answer = await prompt('Resume or Abort? [R/a] ');
    if (answer.toLowerCase() === 'a') {
      console.log('Aborted.');
      process.exit(0);
    }
    console.log(`\nResuming existing worktree.`);
    console.log(`  Branch:          ${existing.branch}`);
    console.log(`  Worktree path:   ${existing.worktreePath}`);
    console.log(`  Working dir:     ${existing.workingDir}`);
    return;
  }

  await createWorktree(branch, worktreePath, repoRoot);

  // Resolve working dir
  let projectPath: string;
  if (rc.repoType === 'monorepo') {
    const pkg = options.dir ?? await prompt('Package path (e.g. packages/my-package): ');
    projectPath = path.join(worktreePath, pkg);
  }
  else {
    projectPath = worktreePath;
  }

  const workingDir = path.join(projectPath, 'working-on', featureName);
  await fs.ensureDir(workingDir);

  // Write state file entry
  entries.push({ featureName, branch, worktreePath, workingDir, repoRoot });
  await writeStateFile(stateFile, entries);

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
