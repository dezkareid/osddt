import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');

import fs from 'fs-extra';
import { doneCommand } from './done.js';

describe('done command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given a valid project with .osddtrc and an existing working-on feature', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const s = String(p);
        return s.endsWith('.osddtrc') || s.includes('working-on/my-feature');
      });
      vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.move).mockResolvedValue(undefined);
    });

    it('should move the feature folder from working-on to done', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = doneCommand();
      await cmd.parseAsync(['my-feature', '--dir', '/tmp/project'], { from: 'user' });

      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining('working-on/my-feature'),
        expect.stringContaining('done/my-feature'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('working-on/my-feature'),
      );
    });
  });

  describe('given .osddtrc does not exist', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
    });

    it('should exit with an error message', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = doneCommand();
      await expect(
        cmd.parseAsync(['my-feature', '--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('.osddtrc not found'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given the feature folder does not exist in working-on', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        return String(p).endsWith('.osddtrc');
      });
      vi.mocked(fs.readJson).mockResolvedValue({ repoType: 'single' });
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
