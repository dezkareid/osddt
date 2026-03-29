import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

interface CopyEnvOptions {
  source?: string;
  target?: string;
  pattern?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface OsddtRc {
  'copy-env'?: {
    source?: string;
    pattern?: string;
  };
}

function matchesPatterns(filename: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Convert glob pattern to regex: only support leading/trailing * and literal chars
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(filename);
  });
}

async function readRc(cwd: string): Promise<OsddtRc> {
  const rcPath = path.join(cwd, '.osddtrc');
  if (await fs.pathExists(rcPath)) {
    return await fs.readJson(rcPath) as OsddtRc;
  }
  return {};
}

async function copyFile(src: string, dest: string, force: boolean, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`[dry-run] Would copy: ${src} → ${dest}`);
    return;
  }
  if ((await fs.pathExists(dest)) && !force) {
    console.log(`Skipped: ${dest} (already exists)`);
    return;
  }
  await fs.copy(src, dest, { overwrite: true });
  console.log(`Copied: ${src} → ${dest}`);
}

async function findMatchedFiles(source: string, patterns: string[]): Promise<string[]> {
  if (!(await fs.pathExists(source))) return [];
  const entries = await fs.readdir(source);
  return entries.filter(entry => matchesPatterns(entry, patterns));
}

async function runCopyEnv(options: CopyEnvOptions): Promise<void> {
  const cwd = process.cwd();

  if (!options.target) return;

  const rc = await readRc(cwd);

  const source = options.source ?? rc['copy-env']?.source;
  if (!source) return;

  const rawPattern = options.pattern ?? rc['copy-env']?.pattern ?? '.env*';
  const patterns = rawPattern.split(',').map(p => p.trim()).filter(Boolean);

  const matched = await findMatchedFiles(source, patterns);
  if (matched.length === 0) return;

  await fs.ensureDir(options.target);

  for (const filename of matched) {
    await copyFile(
      path.join(source, filename),
      path.join(options.target, filename),
      options.force ?? false,
      options.dryRun ?? false,
    );
  }
}

export function copyEnvCommand(): Command {
  const cmd = new Command('copy-env');

  cmd
    .description('Copy environment files from a source directory to a target directory')
    .option('--source <path>', 'source directory to copy env files from')
    .option('--target <path>', 'target directory to copy env files into')
    .option('--pattern <globs>', 'comma-separated glob patterns (default: .env*)')
    .option('--force', 'overwrite existing files in target')
    .option('--dry-run', 'print what would be copied without writing')
    .action(async (options: CopyEnvOptions) => {
      try {
        await runCopyEnv(options);
      }
      catch {
        // fail silently
      }
    });

  return cmd;
}
