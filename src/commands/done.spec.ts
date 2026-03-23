import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { doneCommand } from './done.js';

const mockedExecSync = vi.mocked(execSync);

describe('done command', () => {
  let datePrefix: string;

  beforeAll(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    datePrefix = `${yyyy}-${mm}-${dd}`;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('given an existing working-on feature', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('');
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
    });

    it('should move the feature folder from working-on to done with a date prefix', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project'], { from: 'user' });

      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining('working-on/my-feature'),
        expect.stringContaining(`done/${datePrefix}-my-feature`),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`done/${datePrefix}-my-feature`),
      );
    });
  });

  describe('given --worktree flag and a matching state file entry', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --show-toplevel')) return '/home/user/myrepo\n';
        return '';
      });
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('my-feature')) return true;
        if (String(p).endsWith('.osddt-worktrees')) return true;
        if (String(p).includes('myrepo-my-feature') && !String(p).includes('working-on')) return true;
        return false;
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
      vi.mocked(fs.readJson).mockResolvedValue([
        {
          featureName: 'my-feature',
          branch: 'feat/my-feature',
          worktreePath: '/home/user/myrepo-my-feature',
          workingDir: '/home/user/myrepo-my-feature/working-on/my-feature',
          repoRoot: '/home/user/myrepo',
        },
      ]);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    });

    it('should move the feature folder and run git worktree remove', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining('working-on/my-feature'),
        expect.stringContaining('done/'),
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git worktree remove'),
        expect.any(Object),
      );
      consoleSpy.mockRestore();
    });

    it('should remove the entry from .osddt-worktrees after cleanup', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddt-worktrees'),
        expect.not.arrayContaining([expect.objectContaining({ featureName: 'my-feature' })]),
        expect.any(Object),
      );
    });
  });

  describe('given --worktree flag but worktree path no longer exists on filesystem', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('/home/user/myrepo\n');
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const s = String(p);
        if (s === '/home/user/myrepo-my-feature') return false; // worktree gone
        if (s.endsWith('my-feature')) return true;
        if (s.endsWith('.osddt-worktrees')) return true;
        return false;
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
      vi.mocked(fs.readJson).mockResolvedValue([
        {
          featureName: 'my-feature',
          branch: 'feat/my-feature',
          worktreePath: '/home/user/myrepo-my-feature',
          workingDir: '/home/user/myrepo-my-feature/working-on/my-feature',
          repoRoot: '/home/user/myrepo',
        },
      ]);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
    });

    it('should skip git worktree remove but still clean the state file', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(mockedExecSync).not.toHaveBeenCalledWith(
        expect.stringContaining('git worktree remove'),
        expect.any(Object),
      );
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddt-worktrees'),
        expect.not.arrayContaining([expect.objectContaining({ featureName: 'my-feature' })]),
        expect.any(Object),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('given the feature folder does not exist in working-on', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('');
      vi.mocked(fs.pathExists).mockResolvedValue(false);
    });

    it('should exit with an error message', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = doneCommand();
      await expect(
        cmd.parseAsync(['unknown-feature', '--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('working-on/unknown-feature'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
