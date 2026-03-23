import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');
vi.mock('../utils/worktree.js');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { resolveBarePath, findWorktreeByFeature } from '../utils/worktree.js';
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

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

  describe('given --worktree flag and a matching worktree found via git worktree list', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue('/home/user/myproject-my-feature');
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const s = String(p);
        if (s.endsWith('my-feature') && s.includes('working-on')) return true;
        if (s === '/home/user/myproject-my-feature') return true;
        return false;
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
      mockedExecSync.mockReturnValue('');
    });

    it('should move the feature folder and run git worktree remove', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining('working-on/my-feature'),
        expect.stringContaining('done/'),
      );
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git worktree remove'),
        expect.objectContaining({ cwd: '/home/user/myproject/.bare' }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('given --worktree flag but worktree path no longer exists on filesystem', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue('/home/user/myproject-my-feature');
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const s = String(p);
        if (s === '/home/user/myproject-my-feature') return false;
        if (s.endsWith('my-feature') && s.includes('working-on')) return true;
        return false;
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
      mockedExecSync.mockReturnValue('');
    });

    it('should skip git worktree remove when path is gone', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(mockedExecSync).not.toHaveBeenCalledWith(
        expect.stringContaining('git worktree remove'),
        expect.any(Object),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('given --worktree flag but no worktree entry found', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue(undefined);
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        return String(p).includes('working-on');
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
      mockedExecSync.mockReturnValue('');
    });

    it('should warn and skip worktree cleanup', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project', '--worktree'], { from: 'user' });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No worktree found'));
      expect(mockedExecSync).not.toHaveBeenCalledWith(
        expect.stringContaining('git worktree remove'),
        expect.any(Object),
      );
    });
  });

  describe('given the feature folder does not exist in working-on', () => {
    beforeEach(() => {
      mockedExecSync.mockReturnValue('');
      vi.mocked(fs.pathExists).mockResolvedValue(false);
    });

    it('should exit with an error message', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
