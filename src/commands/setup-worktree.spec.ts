import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { setupWorktreeCommand } from './setup-worktree.js';

const mockedExecSync = vi.mocked(execSync);

describe('setup-worktree command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given a fully supported environment', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('git --version')) return 'git version 2.39.3\n' as unknown as Buffer;
        if (cmd.includes('--git-common-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--git-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.access).mockResolvedValue(undefined);
    });

    it('should print pass for all checks and not exit with error', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupWorktreeCommand();
      await cmd.parseAsync([], { from: 'user' });

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('✓');
      expect(output).toContain('All checks passed');
    });
  });

  describe('given an unsupported git version', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('git --version')) return 'git version 2.4.0\n' as unknown as Buffer;
        if (cmd.includes('--git-common-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--git-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.access).mockResolvedValue(undefined);
    });

    it('should print fail for the git version check and exit with code 1', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = setupWorktreeCommand();
      await expect(cmd.parseAsync([], { from: 'user' })).rejects.toThrow('process.exit');

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('✗');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given the directory is not writable', () => {
    beforeEach(() => {
      mockedExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('git --version')) return 'git version 2.39.3\n' as unknown as Buffer;
        if (cmd.includes('--git-common-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--git-dir')) return '.git\n' as unknown as Buffer;
        if (cmd.includes('--show-toplevel')) return '/home/user/myrepo\n' as unknown as Buffer;
        return '' as unknown as Buffer;
      });
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(fs.access).mockRejectedValue(new Error('EACCES'));
    });

    it('should print fail for the writable check and exit with code 1', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = setupWorktreeCommand();
      await expect(cmd.parseAsync([], { from: 'user' })).rejects.toThrow('process.exit');

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('✗');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
