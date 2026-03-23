import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupCommand } from './commands/setup.js';
import { metaInfoCommand } from './commands/meta-info.js';
import { doneCommand } from './commands/done.js';
import { updateCommand } from './commands/update.js';
import { contextCommand } from './commands/context.js';
import { startWorktreeCommand } from './commands/start-worktree.js';
import { worktreeInfoCommand } from './commands/worktree-info.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = fs.readJsonSync(pkgPath);

const program = new Command();

program
  .name('osddt')
  .description('Spec-Driven Development tooling for monorepos and single-package repos')
  .version(pkg.version);

program.addCommand(setupCommand());
program.addCommand(metaInfoCommand());
program.addCommand(doneCommand());
program.addCommand(updateCommand());
program.addCommand(contextCommand());
program.addCommand(startWorktreeCommand());
program.addCommand(worktreeInfoCommand());

program.parse(process.argv);
