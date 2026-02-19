import { Command } from 'commander';
import { execSync } from 'child_process';

function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function metaInfoCommand(): Command {
  const cmd = new Command('meta-info');

  cmd
    .description('Output project meta information as JSON (branch, date)')
    .action(() => {
      const info = {
        branch: getCurrentBranch(),
        date: getCurrentDate(),
      };

      console.log(JSON.stringify(info));
    });

  return cmd;
}
