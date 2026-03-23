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
import { runWorktreeChecks } from '../utils/worktree.js';
import { getClaudeTemplates } from '../templates/claude.js';
import { getGeminiTemplates } from '../templates/gemini.js';
import {
  setupCommand,
  cloneBareRepository,
  detectDefaultBranch,
  addDefaultBranchWorktree,
  detectPackageManager,
  writeAgentPointerFiles,
} from './setup.js';

const CLAUDE_FILE = { filePath: '/tmp/project/.claude/commands/osddt.spec.md', content: '# spec' };
const GEMINI_FILE = { filePath: '/tmp/project/.gemini/commands/osddt.spec.toml', content: 'spec' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(askWorktreeUrl).mockResolvedValue('');
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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = setupCommand();
      await cmd.parseAsync(['--agents', 'claude', '--repo-type', 'single', '--dir', '/tmp/project'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx @dezkareid/osddt');
    });
  });

  describe('given an invalid --agents value', () => {
    it('should print an error and exit with code 1', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
    it('should clone bare, detect branch, add worktree, and write bare-path + packageManager to .osddtrc', async () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes('git clone')) return Buffer.from('');
        if (cmd.includes('git remote show')) return 'HEAD branch: main\n' as unknown as Buffer;
        if (cmd.includes('git worktree add')) return Buffer.from('');
        return Buffer.from('');
      });
      vi.mocked(fs.readJson).mockResolvedValue({ name: '@dezkareid/osddt' });
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      vi.mocked(runWorktreeChecks).mockResolvedValue(true);
      vi.spyOn(console, 'log').mockImplementation(() => { });

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
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('.osddtrc'),
        expect.objectContaining({
          'repoType': 'single',
          'agents': ['claude'],
          'worktree-repository': 'https://github.com/org/repo.git',
          'bare-path': '/tmp/project/.bare',
          'mainBranch': 'main',
        }),
        { spaces: 2 },
      );
    });
  });

  describe('given --worktree-repository is provided but environment checks fail', () => {
    it('should exit with code 1 and not write .osddtrc', async () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes('git clone')) return Buffer.from('');
        if (cmd.includes('git remote show')) return 'HEAD branch: main\n' as unknown as Buffer;
        if (cmd.includes('git worktree add')) return Buffer.from('');
        return Buffer.from('');
      });
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      vi.mocked(runWorktreeChecks).mockResolvedValue(false);
      vi.spyOn(console, 'log').mockImplementation(() => { });
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
      vi.spyOn(console, 'log').mockImplementation(() => { });

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

describe('cloneBareRepository', () => {
  it('should run git clone --bare into <cwd>/.bare and return barePath', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));
    vi.spyOn(console, 'log').mockImplementation(() => { });
    const result = cloneBareRepository('/tmp/project', 'https://github.com/org/repo.git');
    expect(result).toBe('/tmp/project/.bare');
    expect(execSync).toHaveBeenCalledWith(
      'git clone --bare "https://github.com/org/repo.git" "/tmp/project/.bare"',
      { stdio: 'inherit' },
    );
  });
});

describe('detectDefaultBranch', () => {
  it('should parse HEAD branch from git remote show origin output', () => {
    vi.mocked(execSync).mockReturnValue('  HEAD branch: main\n' as unknown as Buffer);
    const result = detectDefaultBranch('/tmp/project/.bare');
    expect(result).toBe('main');
  });

  it('should fall back to main when remote show output has no HEAD branch line', () => {
    vi.mocked(execSync).mockImplementation((cmd: string) => {
      if (cmd.includes('git remote show')) return 'no HEAD line here\n' as unknown as Buffer;
      if (cmd.includes('rev-parse --verify main')) return Buffer.from('');
      throw new Error('not found');
    });
    const result = detectDefaultBranch('/tmp/project/.bare');
    expect(result).toBe('main');
  });
});

describe('addDefaultBranchWorktree', () => {
  it('should run git worktree add inside barePath for the given branch', () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));
    addDefaultBranchWorktree('/tmp/project/.bare', 'main');
    expect(execSync).toHaveBeenCalledWith(
      'git worktree add "/tmp/project/.bare/main" main',
      { cwd: '/tmp/project/.bare', stdio: 'inherit' },
    );
  });
});

describe('detectPackageManager', () => {
  it('should detect pnpm when pnpm-lock.yaml exists', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async p =>
      String(p).endsWith('pnpm-lock.yaml'),
    );
    const result = await detectPackageManager('/tmp/project/.bare/main');
    expect(result).toBe('pnpm');
  });

  it('should detect yarn when yarn.lock exists and no pnpm-lock.yaml', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async p =>
      String(p).endsWith('yarn.lock'),
    );
    const result = await detectPackageManager('/tmp/project/.bare/main');
    expect(result).toBe('yarn');
  });

  it('should detect npm when package-lock.json exists and no other locks', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async p =>
      String(p).endsWith('package-lock.json'),
    );
    const result = await detectPackageManager('/tmp/project/.bare/main');
    expect(result).toBe('npm');
  });

  it('should default to npm when no lockfile is found', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    const result = await detectPackageManager('/tmp/project/.bare/main');
    expect(result).toBe('npm');
  });
});

describe('writeAgentPointerFiles', () => {
  it('should write CLAUDE.md only when claude is selected', async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => { });
    await writeAgentPointerFiles('/tmp/project', ['claude'], 'main');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/project/CLAUDE.md',
      '@.bare/main/CLAUDE.md\n',
      'utf-8',
    );
    expect(fs.writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('GEMINI.md'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('should write GEMINI.md only when gemini is selected', async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => { });
    await writeAgentPointerFiles('/tmp/project', ['gemini'], 'main');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/project/GEMINI.md',
      '@.bare/main/GEMINI.md\n',
      'utf-8',
    );
    expect(fs.writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('CLAUDE.md'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('should write both files when both agents are selected', async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => { });
    await writeAgentPointerFiles('/tmp/project', ['claude', 'gemini'], 'master');
    expect(fs.writeFile).toHaveBeenCalledWith('/tmp/project/CLAUDE.md', '@.bare/master/CLAUDE.md\n', 'utf-8');
    expect(fs.writeFile).toHaveBeenCalledWith('/tmp/project/GEMINI.md', '@.bare/master/GEMINI.md\n', 'utf-8');
  });
});
