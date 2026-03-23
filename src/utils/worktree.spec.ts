import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import {
  checkGitVersion,
  checkTargetWritable,
  initStateFile,
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

describe('initStateFile', () => {
  it('should create the state file in the parent of barePath when it does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await initStateFile('/home/user/myproject/.bare');

    expect(vi.mocked(fs.writeJson)).toHaveBeenCalledWith(
      '/home/user/myproject/.osddt-worktrees',
      [],
      { spaces: 2 },
    );
  });

  it('should not overwrite the state file when it already exists', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as boolean);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await initStateFile('/home/user/myproject/.bare');

    expect(vi.mocked(fs.writeJson)).not.toHaveBeenCalled();
  });
});
