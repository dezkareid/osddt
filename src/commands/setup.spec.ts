import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('../utils/prompt.js');
vi.mock('../templates/claude.js');
vi.mock('../templates/gemini.js');

import fs from 'fs-extra';
import { askAgents, askRepoType } from '../utils/prompt.js';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { setupCommand } from './setup.js';

const CLAUDE_FILE = { filePath: '/tmp/project/.claude/commands/osddt.spec.md', content: '# spec' };
const GEMINI_FILE = { filePath: '/tmp/project/.gemini/commands/osddt.spec.toml', content: 'spec' };

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setup command', () => {
  describe('given --agents and --repo-type are both provided', () => {
    it('should skip both prompts and write claude files with single config', async () => {
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(askAgents).not.toHaveBeenCalled();
      expect(askRepoType).not.toHaveBeenCalled();
      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project');
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        { repoType: 'single' },
        { spaces: 2 },
      );
    });
  });

  describe('given --agents claude,gemini and --repo-type monorepo', () => {
    it('should write both claude and gemini files', async () => {
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(
        ['--agents', 'claude,gemini', '--repo-type', 'monorepo', '--dir', '/tmp/project'],
        { from: 'user' },
      );

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project');
      expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project');
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        { repoType: 'monorepo' },
        { spaces: 2 },
      );
    });
  });

  describe('given only --agents is provided', () => {
    it('should skip askAgents but call askRepoType', async () => {
      vi.mocked(askRepoType).mockResolvedValue('single');
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--dir', '/tmp/project'], { from: 'user' });

      expect(askAgents).not.toHaveBeenCalled();
      expect(askRepoType).toHaveBeenCalledOnce();
    });
  });

  describe('given only --repo-type is provided', () => {
    it('should skip askRepoType but call askAgents', async () => {
      vi.mocked(askAgents).mockResolvedValue(['claude']);
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(askRepoType).not.toHaveBeenCalled();
      expect(askAgents).toHaveBeenCalledOnce();
    });
  });

  describe('given no flags are provided', () => {
    it('should call both prompts', async () => {
      vi.mocked(askAgents).mockResolvedValue(['claude']);
      vi.mocked(askRepoType).mockResolvedValue('single');
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(askAgents).toHaveBeenCalledOnce();
      expect(askRepoType).toHaveBeenCalledOnce();
    });
  });

  describe('given an invalid --agents value', () => {
    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = setupCommand();
      await expect(
        cmd.parseAsync(['--agents', 'unknown', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unknown'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('given an invalid --repo-type value', () => {
    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = setupCommand();
      await expect(
        cmd.parseAsync(['--agents', 'claude', '--repo-type', 'invalid', '--dir', '/tmp/project'], { from: 'user' }),
      ).rejects.toThrow('process.exit');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"invalid"'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
