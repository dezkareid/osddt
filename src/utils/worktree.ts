import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

export interface WorktreeEntry {
  featureName: string;
  branch: string;
  worktreePath: string;
  workingDir: string;
}

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

export async function checkTargetWritable(barePath: string): Promise<CheckResult> {
  const targetBase = path.dirname(barePath);
  try {
    await fs.access(targetBase, fs.constants.W_OK);
    return { label: 'Worktree target directory is writable', passed: true, detail: `${targetBase} is writable` };
  }
  catch {
    return { label: 'Worktree target directory is writable', passed: false, detail: `${targetBase} is not writable` };
  }
}

export async function resolveBarePath(cwd: string): Promise<string> {
  const rcPath = path.join(cwd, '.osddtrc');
  if (await fs.pathExists(rcPath)) {
    const rc = await fs.readJson(rcPath) as { 'bare-path'?: string };
    if (rc['bare-path']) return rc['bare-path'];
  }
  return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
}

export function findWorktreeByFeature(barePath: string, featureName: string): string | undefined {
  const output = execSync('git worktree list --porcelain', { cwd: barePath, encoding: 'utf-8' });
  const blocks = output.trim().split(/\n\n+/);
  for (const block of blocks) {
    const match = block.match(/^worktree (.+)$/m);
    if (!match) continue;
    const worktreePath = match[1].trim();
    const basename = path.basename(worktreePath);
    if (basename === featureName) {
      return worktreePath;
    }
  }
  return undefined;
}

export function printCheckResult(result: CheckResult): void {
  const icon = result.passed ? '✓' : '✗';
  console.log(`  ${icon} ${result.label}`);
  if (!result.passed) {
    console.log(`    → ${result.detail}`);
  }
}

export async function runWorktreeChecks(barePath: string): Promise<boolean> {
  const results: CheckResult[] = [
    checkGitVersion(),
    await checkTargetWritable(barePath),
  ];

  for (const result of results) {
    printCheckResult(result);
  }

  return results.every(r => r.passed);
}

export function listFeatureWorktrees(barePath: string, mainBranch: string): WorktreeEntry[] {
  const output = execSync('git worktree list --porcelain', { cwd: barePath, encoding: 'utf-8' });
  const blocks = output.trim().split(/\n\n+/);
  const entries: WorktreeEntry[] = [];

  for (const block of blocks) {
    const pathMatch = block.match(/^worktree (.+)$/m);
    const branchMatch = block.match(/^branch (.+)$/m);
    if (!pathMatch) continue;

    const worktreePath = pathMatch[1].trim();
    const featureName = path.basename(worktreePath);

    if (featureName === mainBranch) continue;

    const branch = branchMatch ? branchMatch[1].trim().replace(/^refs\/heads\//, '') : featureName;
    const workingDir = path.join(worktreePath, 'working-on', featureName);

    entries.push({ featureName, branch, worktreePath, workingDir });
  }

  return entries;
}
