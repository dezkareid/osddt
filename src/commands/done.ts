import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

function todayPrefix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runDone(featureName: string, cwd: string): Promise<void> {
  const src = path.join(cwd, 'working-on', featureName);
  const destName = `${todayPrefix()}-${featureName}`;
  const dest = path.join(cwd, 'done', destName);

  if (!(await fs.pathExists(src))) {
    console.error(`Error: working-on/${featureName} does not exist.`);
    process.exit(1);
  }

  await fs.ensureDir(path.dirname(dest));
  await fs.move(src, dest);

  console.log(`Moved: working-on/${featureName} → done/${destName}`);
}

export function doneCommand(): Command {
  const cmd = new Command('done');

  cmd
    .description('Move a feature from working-on/<feature-name> to done/<feature-name>')
    .argument('<feature-name>', 'name of the feature to mark as done')
    .option('-d, --dir <directory>', 'project directory', process.cwd())
    .action(async (featureName: string, options: { dir: string }) => {
      const targetDir = path.resolve(options.dir);
      await runDone(featureName, targetDir);
    });

  return cmd;
}
