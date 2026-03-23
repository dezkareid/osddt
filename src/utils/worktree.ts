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

export async function initStateFile(barePath: string): Promise<void> {
  try {
    const stateFile = path.join(path.dirname(barePath), '.osddt-worktrees');
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
