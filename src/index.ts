import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { metaInfoCommand } from './commands/meta-info.js';
import { doneCommand } from './commands/done.js';

const program = new Command();

program
  .name('osddt')
  .description('Spec-Driven Development tooling for monorepos and single-package repos')
  .version('0.0.0');

program.addCommand(setupCommand());
program.addCommand(metaInfoCommand());
program.addCommand(doneCommand());

program.parse(process.argv);
