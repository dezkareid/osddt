import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');

import fs from 'fs-extra';
import { contextCommand } from './context.js';
import { COMMAND_DEFINITIONS } from '../templates/shared.js';

describe('context command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('read mode', () => {
    describe('given the context file exists', () => {
      beforeEach(() => {
        vi.mocked(fs.readFile).mockResolvedValue('# My custom context\n\nSome instructions.' as never);
      });

      it('should print the file contents to stdout', async () => {
        const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

        const cmd = contextCommand();
        await cmd.parseAsync(['plan', '--dir', '/tmp/project'], { from: 'user' });

        expect(writeSpy).toHaveBeenCalledWith('# My custom context\n\nSome instructions.');
      });
    });

    describe('given the context file does not exist', () => {
      beforeEach(() => {
        const enoentError = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        vi.mocked(fs.readFile).mockRejectedValue(enoentError);
      });

      it('should exit silently with no output and no error thrown', async () => {
        const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

        const cmd = contextCommand();
        await expect(
          cmd.parseAsync(['plan', '--dir', '/tmp/project'], { from: 'user' }),
        ).resolves.not.toThrow();

        expect(writeSpy).not.toHaveBeenCalled();
      });
    });

    describe('given an unexpected filesystem error', () => {
      beforeEach(() => {
        const permError = Object.assign(new Error('EACCES'), { code: 'EACCES' });
        vi.mocked(fs.readFile).mockRejectedValue(permError);
      });

      it('should re-throw the error', async () => {
        const cmd = contextCommand();
        await expect(
          cmd.parseAsync(['plan', '--dir', '/tmp/project'], { from: 'user' }),
        ).rejects.toThrow('EACCES');
      });
    });
  });

  describe('init mode', () => {
    describe('given the osddt-context folder does not exist', () => {
      beforeEach(() => {
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
        vi.mocked(fs.pathExists).mockResolvedValue(false);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      });

      it('should create the osddt-context folder', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = contextCommand();
        await cmd.parseAsync(['--init', '--dir', '/tmp/project'], { from: 'user' });

        expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('osddt-context'));
      });

      it('should create one stub file per command definition', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = contextCommand();
        await cmd.parseAsync(['--init', '--dir', '/tmp/project'], { from: 'user' });

        expect(fs.writeFile).toHaveBeenCalledTimes(COMMAND_DEFINITIONS.length);
      });

      it('should write stub files named after each command without the osddt. prefix', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = contextCommand();
        await cmd.parseAsync(['--init', '--dir', '/tmp/project'], { from: 'user' });

        for (const def of COMMAND_DEFINITIONS) {
          const bareName = def.name.replace(/^osddt\./, '');
          expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining(`${bareName}.md`),
            expect.stringContaining(`osddt context: ${bareName}`),
            'utf-8',
          );
        }
      });
    });

    describe('given some stub files already exist', () => {
      beforeEach(() => {
        vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
        vi.mocked(fs.pathExists).mockImplementation(async (p) => {
          return String(p).endsWith('plan.md');
        });
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      });

      it('should skip existing files and only create missing ones', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cmd = contextCommand();
        await cmd.parseAsync(['--init', '--dir', '/tmp/project'], { from: 'user' });

        expect(fs.writeFile).toHaveBeenCalledTimes(COMMAND_DEFINITIONS.length - 1);
        expect(fs.writeFile).not.toHaveBeenCalledWith(
          expect.stringContaining('plan.md'),
          expect.anything(),
          expect.anything(),
        );
      });
    });
  });
});
