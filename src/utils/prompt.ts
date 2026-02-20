import select from '@inquirer/select';

export type RepoType = 'monorepo' | 'single';

export async function askRepoType(): Promise<RepoType> {
  return select<RepoType>({
    message: 'What type of repository is this?',
    choices: [
      {
        name: 'Single repo',
        value: 'single',
        description: 'A standalone project with one package',
      },
      {
        name: 'Monorepo',
        value: 'monorepo',
        description: 'A repository containing multiple packages',
      },
    ],
  });
}
