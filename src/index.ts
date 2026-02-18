import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';

const program = new Command();

program
  .name('osddt')
  .description('Spec-Driven Development tooling for monorepos and single-package repos')
  .version('0.0.0');

program.addCommand(setupCommand());

program.parse(process.argv);
