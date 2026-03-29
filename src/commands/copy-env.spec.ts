import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs-extra');

import fs from 'fs-extra';
import { copyEnvCommand } from './copy-env.js';

describe('copy-env command', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('given --target is omitted', () => {
    it('should return silently without copying anything', async () => {
      const copySpy = vi.spyOn(fs, 'copy').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src'], { from: 'user' });

      expect(copySpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('given --source is absent and no copy-env.source in .osddtrc', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({});
    });

    it('should return silently without copying anything', async () => {
      const copySpy = vi.spyOn(fs, 'copy').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--target', '/dest'], { from: 'user' });

      expect(copySpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('given .osddtrc does not exist and --source is not provided', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
    });

    it('should return silently without copying anything', async () => {
      const copySpy = vi.spyOn(fs, 'copy').mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--target', '/dest'], { from: 'user' });

      expect(copySpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('given --source and --target with matching files in a clean target', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.env') || String(p).endsWith('.env.local')) return false; // dest does not exist
        return true; // source dir exists
      });
      vi.mocked(fs.readJson).mockResolvedValue({});
      vi.mocked(fs.readdir).mockResolvedValue(['.env', '.env.local', 'README.md'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should copy matched files and log each one', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/src/.env', '/dest/.env', { overwrite: true });
      expect(fs.copy).toHaveBeenCalledWith('/src/.env.local', '/dest/.env.local', { overwrite: true });
      expect(fs.copy).not.toHaveBeenCalledWith(expect.stringContaining('README.md'), expect.anything(), expect.anything());
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Copied:'));
    });
  });

  describe('given a target file already exists and --force is not set', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true); // source dir and dest file both exist
      vi.mocked(fs.readJson).mockResolvedValue({});
      vi.mocked(fs.readdir).mockResolvedValue(['.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should skip the file and log Skipped', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest'], { from: 'user' });

      expect(fs.copy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped:'));
    });
  });

  describe('given a target file already exists and --force is set', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({});
      vi.mocked(fs.readdir).mockResolvedValue(['.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should overwrite the file and log Copied', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest', '--force'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/src/.env', '/dest/.env', { overwrite: true });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Copied:'));
    });
  });

  describe('given --dry-run flag', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({});
      vi.mocked(fs.readdir).mockResolvedValue(['.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should log dry-run output without writing any files', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest', '--dry-run'], { from: 'user' });

      expect(fs.copy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
    });
  });

  describe('given no files match the pattern in source', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readJson).mockResolvedValue({});
      vi.mocked(fs.readdir).mockResolvedValue(['README.md', 'package.json'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should return silently without copying anything', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest'], { from: 'user' });

      expect(fs.copy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('given copy-env.source in .osddtrc and no --source flag', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.env')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ 'copy-env': { source: '/configured-src' } });
      vi.mocked(fs.readdir).mockResolvedValue(['.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should use the configured source path', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--target', '/dest'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/configured-src/.env', '/dest/.env', { overwrite: true });
    });
  });

  describe('given copy-env.pattern in .osddtrc and no --pattern flag', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.secret')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ 'copy-env': { pattern: '.secret*' } });
      vi.mocked(fs.readdir).mockResolvedValue(['.secret', '.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should use the configured pattern', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/src/.secret', '/dest/.secret', { overwrite: true });
      expect(fs.copy).not.toHaveBeenCalledWith(expect.stringContaining('.env'), expect.anything(), expect.anything());
    });
  });

  describe('given both --source flag and copy-env.source in .osddtrc', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.env')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ 'copy-env': { source: '/configured-src' } });
      vi.mocked(fs.readdir).mockResolvedValue(['.env'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should use the --source flag over the config value', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/flag-src', '--target', '/dest'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/flag-src/.env', '/dest/.env', { overwrite: true });
    });
  });

  describe('given both --pattern flag and copy-env.pattern in .osddtrc', () => {
    beforeEach(() => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => {
        if (String(p).endsWith('.env')) return false;
        return true;
      });
      vi.mocked(fs.readJson).mockResolvedValue({ 'copy-env': { pattern: '.secret*' } });
      vi.mocked(fs.readdir).mockResolvedValue(['.env', '.secret'] as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.copy).mockResolvedValue(undefined);
    });

    it('should use the --pattern flag over the config value', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => { });

      const cmd = copyEnvCommand();
      await cmd.parseAsync(['--source', '/src', '--target', '/dest', '--pattern', '.env*'], { from: 'user' });

      expect(fs.copy).toHaveBeenCalledWith('/src/.env', '/dest/.env', { overwrite: true });
      expect(fs.copy).not.toHaveBeenCalledWith(expect.stringContaining('.secret'), expect.anything(), expect.anything());
    });
  });
});
