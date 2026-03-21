import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { COMMAND_DEFINITIONS } from '../templates/shared.js';

const CONTEXT_DIR = 'osddt-context';

function stubContent(name: string): string {
  return `<!-- osddt context: ${name}
     The content of this file will be shown to the agent under the "## Custom Context" section
     when the osddt.${name} command is invoked. Add your project-specific instructions below. -->
`;
}

async function runRead(name: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, CONTEXT_DIR, `${name}.md`);
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw err;
  }
  process.stdout.write(content);
}

async function runInit(cwd: string): Promise<void> {
  const contextDir = path.join(cwd, CONTEXT_DIR);
  await fs.ensureDir(contextDir);

  for (const cmd of COMMAND_DEFINITIONS) {
    const name = cmd.name.replace(/^osddt\./, '');
    const filePath = path.join(contextDir, `${name}.md`);
    if (await fs.pathExists(filePath)) {
      console.log(`  Skipped (exists): ${CONTEXT_DIR}/${name}.md`);
    } else {
      await fs.writeFile(filePath, stubContent(name), 'utf-8');
      console.log(`  Created: ${CONTEXT_DIR}/${name}.md`);
    }
  }
}

export function contextCommand(): Command {
  const cmd = new Command('context');

  cmd
    .description('Output a custom context file or scaffold context stubs')
    .argument('[name]', 'command name to read context for (e.g. plan, spec)')
    .option('-d, --dir <directory>', 'project directory', process.cwd())
    .option('--init', 'scaffold osddt-context/ with stub files for all commands')
    .action(async (name: string | undefined, options: { dir: string; init?: boolean }) => {
      const targetDir = path.resolve(options.dir);
      if (options.init) {
        await runInit(targetDir);
      } else if (name) {
        await runRead(name, targetDir);
      } else {
        cmd.help();
      }
    });

  return cmd;
}
