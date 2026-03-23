import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import {
  checkGitVersion,
  checkNotAWorktree,
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

describe('checkNotAWorktree', () => {
  it('should pass when git-dir equals git-common-dir', () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('--git-common-dir')) return '.git\n' as unknown as Buffer;
      if (cmd.includes('--git-dir')) return '.git\n' as unknown as Buffer;
      return '' as unknown as Buffer;
    });
    const result = checkNotAWorktree('/some/repo');
    expect(result.passed).toBe(true);
  });

  it('should fail when inside a worktree', () => {
    mockedExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('--git-common-dir')) return '/repo/.git\n' as unknown as Buffer;
      if (cmd.includes('--git-dir')) return '/repo/.git/worktrees/feat\n' as unknown as Buffer;
      return '' as unknown as Buffer;
    });
    const result = checkNotAWorktree('/some/worktree');
    expect(result.passed).toBe(false);
  });

  it('should fail when not inside a git repository', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('not a repo');
    });
    const result = checkNotAWorktree('/some/dir');
    expect(result.passed).toBe(false);
  });
});

describe('checkTargetWritable', () => {
  beforeEach(() => {
    mockedExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('--show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
      return '' as unknown as Buffer;
    });
  });

  it('should pass when target base is writable and no .osddtrc exists', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    const result = await checkTargetWritable('/home/user/myrepo');
    expect(result.passed).toBe(true);
  });

  it('should fail when target base is not writable', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.access).mockRejectedValue(new Error('EACCES'));
    const result = await checkTargetWritable('/home/user/myrepo');
    expect(result.passed).toBe(false);
  });

  it('should use worktreeBase from .osddtrc when present', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as boolean);
    vi.mocked(fs.readJson).mockResolvedValue({ worktreeBase: '/custom/base' });
    vi.mocked(fs.access).mockResolvedValue(undefined);
    const result = await checkTargetWritable('/home/user/myrepo');
    expect(result.passed).toBe(true);
    expect(result.detail).toContain('/custom/base');
  });
});

describe('initStateFile', () => {
  beforeEach(() => {
    mockedExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes('--show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
      return '' as unknown as Buffer;
    });
  });

  it('should create the state file when it does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await initStateFile('/home/user/myrepo');

    expect(vi.mocked(fs.writeJson)).toHaveBeenCalledWith(
      '/home/user/.osddt-worktrees',
      [],
      { spaces: 2 },
    );
  });

  it('should not overwrite the state file when it already exists', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as unknown as boolean);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await initStateFile('/home/user/myrepo');

    expect(vi.mocked(fs.writeJson)).not.toHaveBeenCalled();
  });
});
