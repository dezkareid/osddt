import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');
vi.mock('../utils/worktree.js');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { resolveBarePath, findWorktreeByFeature } from '../utils/worktree.js';
import { startWorktreeCommand } from './start-worktree.js';

const mockedExecSync = vi.mocked(execSync);

describe('start-worktree command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('given a fresh feature with no existing worktree (bare-path in .osddtrc)', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue(undefined);
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --verify')) throw new Error('branch not found');
        if (cmd.includes('ls-remote')) throw new Error('not found');
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return true;
        if (String(p).endsWith('.bare/my-feature')) return false;
        return false;
      });
      vi.mocked(fs.readJson).mockResolvedValue({
        repoType: 'single',
        packageManager: 'pnpm',
        mainBranch: 'main',
      });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    });

    it('should create a new branch and worktree using barePath as cwd, branching off mainBranch', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringMatching(/worktree add.*-b feat\/my-feature main/),
        expect.objectContaining({ cwd: '/home/user/myproject/.bare' }),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('feat/my-feature'));
    });

    it('should place the worktree inside .bare as <barePath>/<featureName>', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      // worktreePath = path.join(barePath, featureName) = '/home/user/myproject/.bare/my-feature'
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('/home/user/myproject/.bare/my-feature'),
        expect.objectContaining({ cwd: '/home/user/myproject/.bare' }),
      );
    });

    it('should create the working-on directory inside the worktree', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('working-on/my-feature'));
    });

    it('should run package manager install after creating the worktree', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(mockedExecSync).toHaveBeenCalledWith(
        'pnpm install',
        expect.objectContaining({ stdio: 'inherit' }),
      );
    });

    it('should print a summary with branch, worktree path, and working dir', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Branch:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Worktree path:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Working dir:'));
    });
  });

  describe('given a feature that already exists in git worktree list', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue('/home/user/myproject/.bare/my-feature');
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
    });

    it('should abort when the user chooses Abort on Resume prompt', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });
      vi.mock('readline', () => ({
        default: {
          createInterface: () => ({
            question: (_q: string, cb: (ans: string) => void) => cb('a'),
            close: () => { },
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

  describe('given mainBranch is absent from .osddtrc', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue(undefined);
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --verify')) throw new Error('branch not found');
        if (cmd.includes('ls-remote')) throw new Error('not found');
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return true;
        return false;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    });

    it('should fall back to main as the base branch', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringMatching(/worktree add.*-b feat\/my-feature main/),
        expect.objectContaining({ cwd: '/home/user/myproject/.bare' }),
      );
    });
  });

  describe('given no packageManager in .osddtrc', () => {
    beforeEach(() => {
      vi.mocked(resolveBarePath).mockResolvedValue('/home/user/myproject/.bare');
      vi.mocked(findWorktreeByFeature).mockReturnValue(undefined);
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('rev-parse --verify')) throw new Error('branch not found');
        if (cmd.includes('ls-remote')) throw new Error('not found');
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.osddtrc')) return true;
        return false;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    });

    it('should skip install and print a reminder', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = startWorktreeCommand();
      await cmd.parseAsync(['my-feature'], { from: 'user' });

      const installCalls = mockedExecSync.mock.calls.filter(([cmd]) =>
        typeof cmd === 'string' && cmd.includes('install') && !cmd.includes('git'),
      );
      expect(installCalls).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('skipping install'));
    });
  });
});
