import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { worktreeInfoCommand } from './worktree-info.js';

const mockedExecSync = vi.mocked(execSync);

describe('worktree-info command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given the feature exists in the state file', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('/home/user/myrepo\n' as unknown as Buffer);
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue([
        {
          featureName: 'my-feature',
          branch: 'feat/my-feature',
          worktreePath: '/home/user/myrepo-my-feature',
          workingDir: '/home/user/myrepo-my-feature/working-on/my-feature',
          repoRoot: '/home/user/myrepo',
        },
      ]);
    });

    it('should print JSON with worktreePath, workingDir, and branch', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = worktreeInfoCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({
          worktreePath: '/home/user/myrepo-my-feature',
          workingDir: '/home/user/myrepo-my-feature/working-on/my-feature',
          branch: 'feat/my-feature',
        }),
      );
    });
  });

  describe('given the feature does not exist in the state file', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('/home/user/myrepo\n' as unknown as Buffer);
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue([]);
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

  describe('given the state file does not exist', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('/home/user/myrepo\n' as unknown as Buffer);
      vi.mocked(fs.pathExists).mockResolvedValue(false);
    });

    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = worktreeInfoCommand();
      await expect(
        cmd.parseAsync(['my-feature'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('.osddt-worktrees'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
