import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

vi.mock('fs-extra');

import fs from 'fs-extra';
import { doneCommand } from './done.js';

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
    vi.restoreAllMocks();
  });

  describe('given an existing working-on feature', () => {
    beforeEach(() => {
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

  describe('given the feature folder does not exist in working-on', () => {
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
        cmd.parseAsync(['unknown-feature', '--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('working-on/unknown-feature'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
