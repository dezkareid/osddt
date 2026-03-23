import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

export interface CheckResult {
  label: string;
  passed: boolean;
  detail: string;
}

export function checkGitVersion(): CheckResult {
  try {
    const output = execSync('git --version', { encoding: 'utf-8' }).trim();
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

export function checkNotAWorktree(cwd: string): CheckResult {
  try {
    const gitCommonDir = execSync('git rev-parse --git-common-dir', { cwd, encoding: 'utf-8' }).trim();
    const gitDir = execSync('git rev-parse --git-dir', { cwd, encoding: 'utf-8' }).trim();
    const isWorktree = gitDir !== gitCommonDir && gitDir !== '.git';
    return {
      label: 'Current directory is not a worktree',
      passed: !isWorktree,
      detail: isWorktree
        ? `This directory is itself a worktree (git-dir: ${gitDir}). Run setup from the main repository.`
        : 'OK',
    };
  }
  catch {
    return { label: 'Current directory is not a worktree', passed: false, detail: 'Not inside a git repository' };
  }
}

export async function checkTargetWritable(cwd: string): Promise<CheckResult> {
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

export async function initStateFile(cwd: string): Promise<void> {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
    const stateFile = path.join(path.dirname(repoRoot), '.osddt-worktrees');
    if (!(await fs.pathExists(stateFile))) {
      await fs.writeJson(stateFile, [], { spaces: 2 });
      console.log(`  ✓ Initialized worktree state file: ${stateFile}`);
    }
    else {
      console.log(`  ✓ Worktree state file already exists: ${stateFile}`);
    }
  }
  catch {
    console.log('  ✗ Could not initialize worktree state file');
  }
}

export function printCheckResult(result: CheckResult): void {
  const icon = result.passed ? '✓' : '✗';
  console.log(`  ${icon} ${result.label}`);
  if (!result.passed) {
    console.log(`    → ${result.detail}`);
  }
}

export async function runWorktreeChecks(cwd: string): Promise<boolean> {
  const results: CheckResult[] = [
    checkGitVersion(),
    checkNotAWorktree(cwd),
    await checkTargetWritable(cwd),
  ];

  for (const result of results) {
    printCheckResult(result);
  }

  return results.every(r => r.passed);
}
