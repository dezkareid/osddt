import select from '@inquirer/select';
import checkbox from '@inquirer/checkbox';

export type RepoType = 'monorepo' | 'single';
export type AgentType = 'claude' | 'gemini';

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

export async function askAgents(): Promise<AgentType[]> {
  return checkbox<AgentType>({
    message: 'Which AI assistant tools do you want to set up?',
    choices: [
      {
        name: 'Claude Code',
        value: 'claude',
        checked: true,
      },
      {
        name: 'Gemini CLI',
        value: 'gemini',
        checked: true,
      },
    ],
    validate(choices) {
      if (choices.length === 0) {
        return 'You must select at least one agent.';
      }
      return true;
    },
  });
}
