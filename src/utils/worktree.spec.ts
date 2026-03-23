import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import {
  checkGitVersion,
  checkTargetWritable,
  resolveBarePath,
  findWorktreeByFeature,
} from './worktree.js';

const mockedExecSync = vi.mocked(execSync);

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('checkGitVersion', () => {
  it('should pass when git version is >= 2.5', () => {
    mockedExecSync.mockReturnValue('git version 2.39.3\n' as unknown as Buffer);
    const result = checkGitVersion();
    expect(result.passed).toBe(true);
  });

  it('should fail when git version is < 2.5', () => {
    mockedExecSync.mockReturnValue('git version 2.4.0\n' as unknown as Buffer);
    const result = checkGitVersion();
    expect(result.passed).toBe(false);
  });

  it('should fail when git is not found', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('not found');
    });
    const result = checkGitVersion();
    expect(result.passed).toBe(false);
    expect(result.detail).toContain('git not found');
  });
});

describe('checkTargetWritable', () => {
  it('should pass when the parent of barePath is writable', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    const result = await checkTargetWritable('/home/user/myproject/.bare');
    expect(result.passed).toBe(true);
    expect(result.detail).toContain('/home/user/myproject');
  });

  it('should fail when the parent of barePath is not writable', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('EACCES'));
    const result = await checkTargetWritable('/home/user/myproject/.bare');
    expect(result.passed).toBe(false);
    expect(result.detail).toContain('/home/user/myproject');
  });
});

describe('resolveBarePath', () => {
  it('should return bare-path from .osddtrc when present', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as boolean);
    vi.mocked(fs.readJson).mockResolvedValue({ 'bare-path': '/home/user/myproject/.bare' });
    const result = await resolveBarePath('/home/user/myproject');
    expect(result).toBe('/home/user/myproject/.bare');
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it('should fall back to git rev-parse when .osddtrc has no bare-path', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as boolean);
    vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
    mockedExecSync.mockReturnValue('/home/user/myrepo\n' as unknown as Buffer);
    const result = await resolveBarePath('/home/user/myrepo');
    expect(result).toBe('/home/user/myrepo');
  });

  it('should fall back to git rev-parse when .osddtrc does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    mockedExecSync.mockReturnValue('/home/user/myrepo\n' as unknown as Buffer);
    const result = await resolveBarePath('/home/user/myrepo');
    expect(result).toBe('/home/user/myrepo');
  });
});

describe('findWorktreeByFeature', () => {
  const PORCELAIN_OUTPUT = [
    'worktree /home/user/myproject/.bare',
    'HEAD abc123',
    'branch refs/heads/main',
    '',
    'worktree /home/user/myproject-my-feature',
    'HEAD def456',
    'branch refs/heads/feat/my-feature',
    '',
  ].join('\n');

  it('should return the worktree path matching the feature name', () => {
    mockedExecSync.mockReturnValue(PORCELAIN_OUTPUT as unknown as Buffer);
    const result = findWorktreeByFeature('/home/user/myproject/.bare', 'my-feature');
    expect(result).toBe('/home/user/myproject-my-feature');
  });

  it('should return undefined when no worktree matches', () => {
    mockedExecSync.mockReturnValue(PORCELAIN_OUTPUT as unknown as Buffer);
    const result = findWorktreeByFeature('/home/user/myproject/.bare', 'unknown-feature');
    expect(result).toBeUndefined();
  });

  it('should not match partial feature names', () => {
    mockedExecSync.mockReturnValue(PORCELAIN_OUTPUT as unknown as Buffer);
    const result = findWorktreeByFeature('/home/user/myproject/.bare', 'feature');
    expect(result).toBeUndefined();
  });
});
