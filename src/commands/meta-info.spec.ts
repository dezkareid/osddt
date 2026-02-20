import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock child_process before importing the module under test
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
import { metaInfoCommand } from './meta-info.js';

describe('meta-info command', () => {
  describe('given a git repository', () => {
    beforeEach(() => {
      vi.mocked(execSync).mockReturnValue('my-feature-branch\n');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should output JSON with branch and date to stdout', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = metaInfoCommand();
      cmd.parse([], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledOnce();

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output).toHaveProperty('branch', 'my-feature-branch');
      expect(output).toHaveProperty('date');
    });

    it('should output date in YYYY-MM-DD format', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = metaInfoCommand();
      cmd.parse([], { from: 'user' });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('given git is not available', () => {
    beforeEach(() => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('git not found');
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should output "unknown" as the branch', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = metaInfoCommand();
      cmd.parse([], { from: 'user' });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.branch).toBe('unknown');
    });
  });
});
