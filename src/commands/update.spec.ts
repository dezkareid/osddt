import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('../templates/claude.js');
vi.mock('../templates/gemini.js');

import fs from 'fs-extra';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { updateCommand } from './update.js';

const CLAUDE_FILE = { filePath: '/tmp/project/.claude/commands/osddt.spec.md', content: '# spec' };
const GEMINI_FILE = { filePath: '/tmp/project/.gemini/commands/osddt.spec.toml', content: 'spec' };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('update command', () => {
  describe('given .osddtrc does not exist', () => {
    it('should print an error and exit with code 1', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = updateCommand();
      await expect(
        cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('osddt setup'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given .osddtrc exists but no agent directories are found', () => {
    it('should print an error and exit with code 1', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.endsWith('.osddtrc')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = updateCommand();
      await expect(
        cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('osddt setup'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given only .claude/commands/ is present', () => {
    it('should regenerate Claude files only', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.endsWith('.osddtrc')) return true as never;
        if (str.includes('.claude')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(getGeminiTemplates).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(CLAUDE_FILE.filePath, CLAUDE_FILE.content, 'utf-8');
    });
  });

  describe('given only .gemini/commands/ is present', () => {
    it('should regenerate Gemini files only', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.endsWith('.osddtrc')) return true as never;
        if (str.includes('.gemini')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(getClaudeTemplates).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(GEMINI_FILE.filePath, GEMINI_FILE.content, 'utf-8');
    });
  });

  describe('given both .claude/commands/ and .gemini/commands/ are present', () => {
    it('should regenerate files for both agents', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.endsWith('.osddtrc')) return true as never;
        if (str.includes('.claude') || str.includes('.gemini')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(fs.writeFile).toHaveBeenCalledWith(CLAUDE_FILE.filePath, CLAUDE_FILE.content, 'utf-8');
      expect(fs.writeFile).toHaveBeenCalledWith(GEMINI_FILE.filePath, GEMINI_FILE.content, 'utf-8');
    });
  });

  describe('given --dir flag is provided', () => {
    it('should target the specified directory', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.startsWith('/custom/dir') && str.endsWith('.osddtrc')) return true as never;
        if (str.startsWith('/custom/dir') && str.includes('.claude')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: 'other-package' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/custom/dir'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/custom/dir', 'npx @dezkareid/osddt');
    });
  });

  describe('given a successful update run', () => {
    it('should never write or modify .osddtrc', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.endsWith('.osddtrc')) return true as never;
        if (str.includes('.claude')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(fs.writeJson).not.toHaveBeenCalled();
      const writtenPaths = vi.mocked(fs.writeFile).mock.calls.map((c) => c[0]);
      expect(writtenPaths.every((p) => !String(p).endsWith('.osddtrc'))).toBe(true);
    });
  });
});
