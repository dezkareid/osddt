import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');
vi.mock('child_process');
vi.mock('../utils/prompt.js');
vi.mock('../utils/worktree.js');
vi.mock('../templates/claude.js');
vi.mock('../templates/gemini.js');

import fs from 'fs-extra';
import { execSync } from 'child_process';
import { askAgents, askRepoType, askWorktreeUrl } from '../utils/prompt.js';
import { runWorktreeChecks, initStateFile } from '../utils/worktree.js';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import { setupCommand } from './setup.js';

const CLAUDE_FILE = { filePath: '/tmp/project/.claude/commands/osddt.spec.md', content: '# spec' };
const GEMINI_FILE = { filePath: '/tmp/project/.gemini/commands/osddt.spec.toml', content: 'spec' };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no worktree URL provided interactively
  vi.mocked(askWorktreeUrl).mockResolvedValue('');
  // Default: current directory is already a git repository
  vi.mocked(execSync).mockReturnValue(Buffer.from(''));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setup command', () => {
  describe('given --agents and --repo-type are both provided', () => {
    it('should skip both prompts and write claude files with single config', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(askAgents).not.toHaveBeenCalled();
      expect(askRepoType).not.toHaveBeenCalled();
      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        { repoType: 'single', agents: ['claude'] },
        { spaces: 2 },
      );
    });
  });

  describe('given --agents claude,gemini and --repo-type monorepo', () => {
    it('should write both claude and gemini files', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
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

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        { repoType: 'monorepo', agents: ['claude', 'gemini'] },
        { spaces: 2 },
      );
    });
  });

  describe('given only --agents is provided', () => {
    it('should skip askAgents but call askRepoType', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
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
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
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
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
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

  describe('given no package.json in the target directory', () => {
    it('should fall back to npx @dezkareid/osddt', async () => {
      vi.mocked(fs.readJson).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx @dezkareid/osddt');
    });
  });

  describe('given package.json without @dezkareid/osddt in deps', () => {
    it('should fall back to npx @dezkareid/osddt', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ dependencies: { 'some-other-package': '1.0.0' } });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx @dezkareid/osddt');
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

  describe('given --worktree-repository is provided and all checks pass', () => {
    it('should clone bare into .bare, write "bare-path" and "worktree-repository" to .osddtrc', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.mocked(runWorktreeChecks).mockResolvedValue(true);
      vi.mocked(initStateFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(
        ['--agents', 'claude', '--repo-type', 'single', '--worktree-repository', 'https://github.com/org/repo.git', '--dir', '/tmp/project'],
        { from: 'user' },
      );

      expect(execSync).toHaveBeenCalledWith(
        'git clone --bare "https://github.com/org/repo.git" "/tmp/project/.bare"',
        { stdio: 'inherit' },
      );
      expect(runWorktreeChecks).toHaveBeenCalledWith('/tmp/project/.bare');
      expect(initStateFile).toHaveBeenCalledWith('/tmp/project/.bare');
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        {
          'repoType': 'single',
          'agents': ['claude'],
          'worktree-repository': 'https://github.com/org/repo.git',
          'bare-path': '/tmp/project/.bare',
        },
        { spaces: 2 },
      );
    });
  });

  describe('given --worktree-repository is provided but environment checks fail', () => {
    it('should exit with code 1 and not write .osddtrc', async () => {
      vi.mocked(runWorktreeChecks).mockResolvedValue(false);
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
        throw new Error('process.exit');
      });

      const cmd = setupCommand();
      await expect(
        cmd.parseAsync(
          ['--agents', 'claude', '--repo-type', 'single', '--worktree-repository', 'https://github.com/org/repo.git', '--dir', '/tmp/project'],
          { from: 'user' },
        ),
      ).rejects.toThrow('process.exit');

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(vi.mocked(fs.writeJson)).not.toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('given no --worktree-repository flag and blank interactive URL', () => {
    it('should omit "worktree-repository" from .osddtrc', async () => {
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.mocked(askWorktreeUrl).mockResolvedValue('');
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(runWorktreeChecks).not.toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        { repoType: 'single', agents: ['claude'] },
        { spaces: 2 },
      );
    });
  });
});
