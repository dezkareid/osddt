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

// resolveNpxCommand reads package.json first, then runUpdate reads .osddtrc.
// Tests must mock readJson in that order.
const PACKAGE_JSON_OSDDT = { name: '@dezkareid/osddt' };
const PACKAGE_JSON_OTHER = { name: 'other-package' };

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

  describe('given .osddtrc has agents key', () => {
    describe('and only claude is configured', () => {
      it('should regenerate Claude files only without touching .osddtrc', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          return String(p).endsWith('.osddtrc') as never;
        });
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single', agents: ['claude'] }) // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);                        // resolveNpxCommand → package.json
        vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = updateCommand();
        await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

        expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(getGeminiTemplates).not.toHaveBeenCalled();
        expect(fs.writeJson).not.toHaveBeenCalled();
      });
    });

    describe('and only gemini is configured', () => {
      it('should regenerate Gemini files only without touching .osddtrc', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          return String(p).endsWith('.osddtrc') as never;
        });
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single', agents: ['gemini'] }) // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);                        // resolveNpxCommand → package.json
        vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = updateCommand();
        await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

        expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(getClaudeTemplates).not.toHaveBeenCalled();
        expect(fs.writeJson).not.toHaveBeenCalled();
      });
    });

    describe('and both agents are configured', () => {
      it('should regenerate files for both agents without touching .osddtrc', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          return String(p).endsWith('.osddtrc') as never;
        });
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single', agents: ['claude', 'gemini'] }) // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);                                  // resolveNpxCommand → package.json
        vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
        vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = updateCommand();
        await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

        expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(fs.writeJson).not.toHaveBeenCalled();
      });
    });
  });

  describe('given .osddtrc has no agents key', () => {
    describe('and only .claude/commands/ has command files', () => {
      it('should infer claude, write agents to .osddtrc, and regenerate Claude files', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          const str = String(p);
          if (str.endsWith('.osddtrc')) return true as never;
          if (str.includes('.claude') && str.includes('commands')) return true as never;
          return false as never;
        });
        vi.mocked(fs.readdir).mockImplementation(async (p) => {
          if (String(p).includes('.claude')) return ['osddt.start.md', 'osddt.spec.md'] as never;
          return [] as never;
        });
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single' })  // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);     // resolveNpxCommand → package.json
        vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.mocked(fs.writeJson).mockResolvedValue(undefined);
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = updateCommand();
        await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

        expect(fs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining('.osddtrc'),
          { repoType: 'single', agents: ['claude'] },
          { spaces: 2 },
        );
        expect(getClaudeTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(getGeminiTemplates).not.toHaveBeenCalled();
      });
    });

    describe('and only .gemini/commands/ has command files', () => {
      it('should infer gemini, write agents to .osddtrc, and regenerate Gemini files', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          const str = String(p);
          if (str.endsWith('.osddtrc')) return true as never;
          if (str.includes('.gemini') && str.includes('commands')) return true as never;
          return false as never;
        });
        vi.mocked(fs.readdir).mockImplementation(async (p) => {
          if (String(p).includes('.gemini')) return ['osddt.start.toml', 'osddt.spec.toml'] as never;
          return [] as never;
        });
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single' })  // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);     // resolveNpxCommand → package.json
        vi.mocked(getGeminiTemplates).mockReturnValue([GEMINI_FILE]);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.mocked(fs.writeJson).mockResolvedValue(undefined);
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = updateCommand();
        await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

        expect(fs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining('.osddtrc'),
          { repoType: 'single', agents: ['gemini'] },
          { spaces: 2 },
        );
        expect(getGeminiTemplates).toHaveBeenCalledWith('/tmp/project', 'npx osddt');
        expect(getClaudeTemplates).not.toHaveBeenCalled();
      });
    });

    describe('and no agent directories have command files', () => {
      it('should print an error and exit with code 1', async () => {
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          return String(p).endsWith('.osddtrc') as never;
        });
        vi.mocked(fs.readdir).mockResolvedValue([] as never);
        vi.mocked(fs.readJson)
          .mockResolvedValueOnce({ repoType: 'single' })  // runUpdate → .osddtrc
          .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);     // resolveNpxCommand → package.json
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
  });

  describe('given --dir flag is provided', () => {
    it('should target the specified directory', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        const str = String(p);
        if (str.startsWith('/custom/dir') && str.endsWith('.osddtrc')) return true as never;
        return false as never;
      });
      vi.mocked(fs.readJson)
        .mockResolvedValueOnce({ repoType: 'single', agents: ['claude'] }) // runUpdate → .osddtrc
        .mockResolvedValueOnce(PACKAGE_JSON_OTHER);                        // resolveNpxCommand → package.json
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/custom/dir'], { from: 'user' });

      expect(getClaudeTemplates).toHaveBeenCalledWith('/custom/dir', 'npx @dezkareid/osddt');
    });
  });

  describe('given agents key is already present in .osddtrc', () => {
    it('should never write or modify .osddtrc', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        return String(p).endsWith('.osddtrc') as never;
      });
      vi.mocked(fs.readJson)
        .mockResolvedValueOnce({ repoType: 'single', agents: ['claude'] }) // runUpdate → .osddtrc
        .mockResolvedValueOnce(PACKAGE_JSON_OSDDT);                        // resolveNpxCommand → package.json
      vi.mocked(getClaudeTemplates).mockReturnValue([CLAUDE_FILE]);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const cmd = updateCommand();
      await cmd.parseAsync(['--dir', '/tmp/project'], { from: 'user' });

      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });
});
