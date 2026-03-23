import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { startWorktreeCommand } from './start-worktree.js';

const mockedExecSync = vi.mocked(execSync);

describe('start-worktree command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given a fresh feature with no existing branch or worktree', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
        if (cmd.includes('rev-parse --verify')) throw new Error('branch not found');
        if (cmd.includes('ls-remote')) throw new Error('not found');
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return false;
        if (String(p).endsWith('.osddt-worktrees')) return false;
        if (String(p).endsWith('myrepo-my-feature')) return false;
        return false;
      });
      vi.mocked(fs.readJson).mockResolvedValue([]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    });

    it('should create a new branch and worktree via git worktree add -b', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('worktree add'),
        expect.objectContaining({ cwd: '/home/user/myrepo' }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('feat/my-feature'));
    });

    it('should create the working-on directory inside the worktree', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('working-on/my-feature'));
    });

    it('should write an entry to the .osddt-worktrees state file', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddt-worktrees'),
        expect.arrayContaining([
          expect.objectContaining({ featureName: 'my-feature', branch: 'feat/my-feature' }),
        ]),
        expect.any(Object),
      );
    });

    it('should print a summary with branch, worktree path, and working dir', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Branch:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worktree path:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Working dir:'));
    });
  });

  describe('given a feature that already exists in the state file', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue([{
        featureName: 'my-feature',
        branch: 'feat/my-feature',
        worktreePath: '/home/user/myrepo-my-feature',
        workingDir: '/home/user/myrepo-my-feature/working-on/my-feature',
        repoRoot: '/home/user/myrepo',
      }]);
    });

    it('should abort when the user chooses Abort on Resume prompt', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });
      // Mock readline to return 'a' (abort)
      vi.mock('readline', () => ({
        default: {
          createInterface: () => ({
            question: (_q: string, cb: (ans: string) => void) => cb('a'),
            close: () => {},
          }),
        },
      }));

      const cmd = startWorktreeCommand();
      await expect(
        cmd.parseAsync(['my-feature'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(exitSpy).toHaveBeenCalledWith(0);
      consoleSpy.mockRestore();
    });
  });
});
