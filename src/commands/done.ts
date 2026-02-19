import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

async function runDone(featureName: string, cwd: string): Promise<void> {
  const configPath = path.join(cwd, '.osddtrc');

  if (!(await fs.pathExists(configPath))) {
    console.error('Error: .osddtrc not found. Run `osddt setup` first.');
    process.exit(1);
  }

  await fs.readJson(configPath);
  const projectPath = cwd;

  const src = path.join(projectPath, 'working-on', featureName);
  const dest = path.join(projectPath, 'done', featureName);

  if (!(await fs.pathExists(src))) {
    console.error(`Error: working-on/${featureName} does not exist.`);
    process.exit(1);
  }

  await fs.ensureDir(path.dirname(dest));
  await fs.move(src, dest);

  console.log(`Moved: working-on/${featureName} → done/${featureName}`);
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
