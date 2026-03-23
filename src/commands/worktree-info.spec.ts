import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');
vi.mock('../utils/worktree.js');

import fs from 'fs-extra';
import { resolveBarePath, listFeatureWorktrees } from '../utils/worktree.js';
import { worktreeInfoCommand } from './worktree-info.js';

const FEATURE_ENTRY = {
  featureName: 'my-feature',
  branch: 'feat/my-feature',
  worktreePath: '/home/user/myrepo/.bare/my-feature',
  workingDir: '/home/user/myrepo/.bare/my-feature/working-on/my-feature',
};

describe('worktree-info command', () => {
  beforeEach(() => {
    vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myrepo/.bare');
    vi.mocked(fs.pathExists).mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given a feature name argument that matches a worktree', () => {
    beforeEach(() => {
      vi.mocked(listFeatureWorktrees).mockReturnValue([FEATURE_ENTRY]);
    });

    it('should print JSON with worktreePath, workingDir, and branch', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = worktreeInfoCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({
          worktreePath: FEATURE_ENTRY.worktreePath,
          workingDir: FEATURE_ENTRY.workingDir,
          branch: FEATURE_ENTRY.branch,
        }),
      );
    });
  });

  describe('given a feature name argument that does not match any worktree', () => {
    beforeEach(() => {
      vi.mocked(listFeatureWorktrees).mockReturnValue([FEATURE_ENTRY]);
    });

    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = worktreeInfoCommand();
      await expect(
        cmd.parseAsync(['unknown-feature'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unknown-feature'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given no argument and exactly one feature worktree', () => {
    beforeEach(() => {
      vi.mocked(listFeatureWorktrees).mockReturnValue([FEATURE_ENTRY]);
    });

    it('should use the single entry automatically and print JSON', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = worktreeInfoCommand();
      await cmd.parseAsync([], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({
          worktreePath: FEATURE_ENTRY.worktreePath,
          workingDir: FEATURE_ENTRY.workingDir,
          branch: FEATURE_ENTRY.branch,
        }),
      );
    });
  });

  describe('given no argument and zero feature worktrees', () => {
    beforeEach(() => {
      vi.mocked(listFeatureWorktrees).mockReturnValue([]);
    });

    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = worktreeInfoCommand();
      await expect(
        cmd.parseAsync([], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No feature worktrees found'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given .osddtrc with mainBranch set', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({ mainBranch: 'master' });
      vi.mocked(listFeatureWorktrees).mockReturnValue([FEATURE_ENTRY]);
    });

    it('should pass mainBranch from .osddtrc to listFeatureWorktrees', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = worktreeInfoCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(listFeatureWorktrees).toHaveBeenCalledWith('/home/user/myrepo/.bare', 'master');
    });
  });
});
