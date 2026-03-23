import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

interface CheckResult {
  label: string;
  passed: boolean;
  detail: string;
}

function checkGitVersion(): CheckResult {
  try {
    const output = execSync('git --version', { encoding: 'utf-8' }).trim();
    // e.g. "git version 2.39.3"
    const match = output.match(/git version (\d+)\.(\d+)/);
    if (!match) {
      return { label: 'Git version >= 2.5', passed: false, detail: `Could not parse git version: ${output}` };
    }
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const ok = major > 2 || (major === 2 && minor >= 5);
    return {
      label: 'Git version >= 2.5',
      passed: ok,
      detail: ok ? output : `Found ${output} — git worktree requires >= 2.5`,
    };
  }
  catch {
    return { label: 'Git version >= 2.5', passed: false, detail: 'git not found or not executable' };
  }
}

function checkNotAWorktree(cwd: string): CheckResult {
  try {
    const gitCommonDir = execSync('git rev-parse --git-common-dir', { cwd, encoding: 'utf-8' }).trim();
    const gitDir = execSync('git rev-parse --git-dir', { cwd, encoding: 'utf-8' }).trim();
    const isWorktree = gitDir !== gitCommonDir && gitDir !== '.git';
    return {
      label: 'Current directory is not a worktree',
      passed: !isWorktree,
      detail: isWorktree
        ? `This directory is itself a worktree (git-dir: ${gitDir}). Run setup-worktree from the main repository.`
        : 'OK',
    };
  }
  catch {
    return { label: 'Current directory is not a worktree', passed: false, detail: 'Not inside a git repository' };
  }
}

async function checkTargetWritable(cwd: string): Promise<CheckResult> {
  let targetBase: string;
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
    const rcPath = path.join(repoRoot, '.osddtrc');
    if (await fs.pathExists(rcPath)) {
      const rc = await fs.readJson(rcPath) as { worktreeBase?: string };
      targetBase = rc.worktreeBase ?? path.dirname(repoRoot);
    }
    else {
      targetBase = path.dirname(repoRoot);
    }
  }
  catch {
    return { label: 'Worktree target directory is writable', passed: false, detail: 'Could not resolve repo root' };
  }

  try {
    await fs.access(targetBase, fs.constants.W_OK);
    return { label: 'Worktree target directory is writable', passed: true, detail: `${targetBase} is writable` };
  }
  catch {
    return { label: 'Worktree target directory is writable', passed: false, detail: `${targetBase} is not writable` };
  }
}

function printResult(result: CheckResult): void {
  const icon = result.passed ? '✓' : '✗';
  console.log(`  ${icon} ${result.label}`);
  if (!result.passed) {
    console.log(`    → ${result.detail}`);
  }
}

async function runSetupWorktree(cwd: string): Promise<void> {
  console.log('Checking environment for git worktree support...\n');

  const results: CheckResult[] = [
    checkGitVersion(),
    checkNotAWorktree(cwd),
    await checkTargetWritable(cwd),
  ];

  for (const result of results) {
    printResult(result);
  }

  const allPassed = results.every(r => r.passed);
  console.log('');
  if (allPassed) {
    console.log('All checks passed. You can use the worktree workflow.');
  }
  else {
    console.log('Some checks failed. Resolve the issues above before using the worktree workflow.');
    process.exit(1);
  }
}

export function setupWorktreeCommand(): Command {
  const cmd = new Command('setup-worktree');

  cmd
    .description('Validate the environment for git worktree usage')
    .option('-d, --dir <directory>', 'directory to check', process.cwd())
    .action(async (options: { dir: string }) => {
      await runSetupWorktree(path.resolve(options.dir));
    });

  return cmd;
}
