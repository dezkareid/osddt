import { describe, it, expect } from 'vitest';
import {
  getRepoPreamble,
  FEATURE_NAME_RULES,
  WORKING_DIR_STEP,
  RESOLVE_FEATURE_NAME,
  getNextStepToSpec,
  getCustomContextStep,
  COMMAND_DEFINITIONS,
} from './shared.js';

describe('getRepoPreamble', () => {
  it('should include the provided npx command in the meta-info call', () => {
    expect(getRepoPreamble('npx osddt')).toContain('npx osddt meta-info');
    expect(getRepoPreamble('npx @dezkareid/osddt')).toContain('npx @dezkareid/osddt meta-info');
  });

  it('should describe the working-on folder structure', () => {
    expect(getRepoPreamble('npx osddt')).toContain('working-on/<feature-name>');
  });

  it('should explain single repo project path resolution', () => {
    expect(getRepoPreamble('npx osddt')).toContain('"single"');
    expect(getRepoPreamble('npx osddt')).toContain('repository root');
  });

  it('should explain monorepo project path resolution', () => {
    expect(getRepoPreamble('npx osddt')).toContain('"monorepo"');
    expect(getRepoPreamble('npx osddt')).toContain('packages/my-package');
  });
});

describe('FEATURE_NAME_RULES', () => {
  it('should enforce a maximum length of 30 characters', () => {
    expect(FEATURE_NAME_RULES).toContain('Maximum length: 30 characters');
  });

  it('should allow only lowercase letters, digits, and hyphens', () => {
    expect(FEATURE_NAME_RULES).toContain('a-z');
    expect(FEATURE_NAME_RULES).toContain('0-9');
    expect(FEATURE_NAME_RULES).toContain('-');
  });

  it('should instruct truncating at a hyphen boundary', () => {
    expect(FEATURE_NAME_RULES).toContain('truncate at the last hyphen boundary');
  });

  it('should instruct removing consecutive hyphens', () => {
    expect(FEATURE_NAME_RULES).toContain('consecutive hyphens');
  });

  it('should instruct removing leading and trailing hyphens', () => {
    expect(FEATURE_NAME_RULES).toContain('leading and trailing hyphens');
  });

  it('should instruct rejecting names that cannot be derived after truncation', () => {
    expect(FEATURE_NAME_RULES).toContain('ask the user to provide a shorter name');
  });

  it('should apply the 30-character limit to the last segment of a branch name', () => {
    expect(FEATURE_NAME_RULES).toContain('last segment only');
  });
});

describe('WORKING_DIR_STEP', () => {
  it('should instruct checking whether the working directory already exists', () => {
    expect(WORKING_DIR_STEP).toContain('working-on/<feature-name>');
    expect(WORKING_DIR_STEP).toContain('already exists');
  });

  it('should instruct creating the directory when it does not exist', () => {
    expect(WORKING_DIR_STEP).toContain('mkdir -p <project-path>/working-on/<feature-name>');
  });

  it('should offer Resume and Abort when the directory exists', () => {
    expect(WORKING_DIR_STEP).toContain('Resume');
    expect(WORKING_DIR_STEP).toContain('Abort');
  });
});

describe('RESOLVE_FEATURE_NAME', () => {
  it('should instruct deriving the feature name from arguments when provided', () => {
    expect(RESOLVE_FEATURE_NAME).toContain('arguments were provided');
  });

  it('should instruct listing folders under working-on/ when no arguments are provided', () => {
    expect(RESOLVE_FEATURE_NAME).toContain('working-on/');
    expect(RESOLVE_FEATURE_NAME).toContain('no arguments were provided');
  });

  it('should instruct using the only folder automatically when there is one', () => {
    expect(RESOLVE_FEATURE_NAME).toContain('only one folder');
  });

  it('should instruct asking the user to pick when there are multiple folders', () => {
    expect(RESOLVE_FEATURE_NAME).toContain('multiple folders');
  });

  it('should instruct stopping when no folders are found', () => {
    expect(RESOLVE_FEATURE_NAME).toContain('no in-progress features were found');
  });
});

describe('getCustomContextStep', () => {
  it('should include the npx command and context subcommand with the given name', () => {
    expect(getCustomContextStep('npx osddt', 'plan')).toContain('npx osddt context plan');
    expect(getCustomContextStep('npx @dezkareid/osddt', 'spec')).toContain('npx @dezkareid/osddt context spec');
  });

  it('should include the ## Custom Context heading', () => {
    expect(getCustomContextStep('npx osddt', 'plan')).toContain('## Custom Context');
  });

  it('should instruct skipping when the command returns no output', () => {
    expect(getCustomContextStep('npx osddt', 'plan')).toContain('no output');
  });
});

describe('getNextStepToSpec', () => {
  it('should include the /osddt.spec command for both input types', () => {
    expect(getNextStepToSpec('$ARGUMENTS')).toContain('/osddt.spec');
  });

  it('should acknowledge the description as a starting point for the description variant', () => {
    expect(getNextStepToSpec('$ARGUMENTS')).toContain('starting point');
  });

  it('should show an example argument for the branch variant', () => {
    expect(getNextStepToSpec('$ARGUMENTS')).toContain('e.g.');
  });

  it('should use the provided args placeholder in the conditional text', () => {
    expect(getNextStepToSpec('$ARGUMENTS')).toContain('$ARGUMENTS');
    expect(getNextStepToSpec('{{args}}')).toContain('{{args}}');
  });
});

describe('COMMAND_DEFINITIONS', () => {
  it('should define exactly 10 commands', () => {
    expect(COMMAND_DEFINITIONS).toHaveLength(10);
  });

  it('should list commands with osddt.continue first, then entry points, then the rest of the workflow', () => {
    const names = COMMAND_DEFINITIONS.map(c => c.name);
    expect(names).toEqual([
      'osddt.continue',
      'osddt.research',
      'osddt.start',
      'osddt.spec',
      'osddt.clarify',
      'osddt.plan',
      'osddt.tasks',
      'osddt.implement',
      'osddt.fast',
      'osddt.done',
    ]);
  });

  describe('osddt.continue', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.continue')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx @dezkareid/osddt' })).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should instruct using worktree-info when worktree-repository is present (worktree mode)', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('worktree-repository` is present');
      expect(body).toContain('npx osddt worktree-info');
    });

    it('should instruct listing working-on/ folders in standard mode', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('worktree-repository` is absent');
      expect(body).toContain('working-on/');
      expect(body).toContain('no arguments were provided');
    });

    it('should not use interactive-selection language in the standard-mode multiple-folders path', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).not.toContain('ask them to pick');
      expect(body).not.toContain('ask the user to pick');
    });

    it('should detect the implementing phase from osddt.tasks.md with unchecked tasks', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('osddt.tasks.md');
      expect(body).toContain('- [ ]');
      expect(body).toContain('/osddt.implement');
    });

    it('should detect the ready-to-close phase when all tasks are checked', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('- [x]');
      expect(body).toContain('/osddt.done');
    });

    it('should detect spec-done phase from osddt.spec.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.plan');
    });

    it('should detect research-done phase from osddt.research.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.spec');
    });

    it('should report the file found and the command to run next', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('exact command the user should run next');
    });

    it('should recommend osddt.clarify when spec or plan phase has unanswered open questions', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('/osddt.clarify');
      expect(body).toContain('unanswered open questions');
    });

    it('should include the custom context step for "continue"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context continue');
    });

    it('should instruct running worktree-info to resolve the working directory', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('npx osddt worktree-info');
    });

    it('should instruct using workingDir from worktree-info when exit code is 0', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('workingDir');
      expect(body).toContain('exit');
    });

    it('should instruct handling structured JSON output from worktree-info without re-running the command', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('"error": "multiple"');
      expect(body).toContain('"error": "none"');
      expect(body).toContain('"error": "not-found"');
      expect(body).not.toContain('fall back to the standard resolution');
    });
  });

  describe('osddt.research', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.research')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx @dezkareid/osddt' })).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('$ARGUMENTS');
    });

    it('should instruct writing to osddt.research.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.research.md');
    });

    it('should instruct creating the working-on directory', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('working-on/<feature-name>');
    });

    it('should instruct exploring the existing codebase', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('existing codebase');
    });

    it('should define a research file format with key sections', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Key Insights');
      expect(body).toContain('Constraints & Risks');
      expect(body).toContain('Open Questions');
    });

    it('should apply feature name constraints', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Maximum length: 30 characters');
    });

    it('should include the shared working directory check step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(WORKING_DIR_STEP);
    });

    it('should include the next step to spec in the body', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain(getNextStepToSpec('$ARGUMENTS'));
    });

    it('should include the custom context step for "research"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context research');
    });
  });

  describe('osddt.start', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.start')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the meta-info step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt meta-info');
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('$ARGUMENTS');
    });

    it('should instruct deriving branch name from description when no branch is given', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('feat/<derived-name>');
    });

    it('should apply feature name constraints', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Maximum length: 30 characters');
    });

    it('should branch on worktree-repository field presence', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('worktree-repository');
    });

    it('should include the worktree workflow path using start-worktree CLI', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt start-worktree');
    });

    it('should include the standard workflow path using git checkout -b', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('git checkout -b');
    });

    it('should include the shared working directory check step in the standard path', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(WORKING_DIR_STEP);
    });

    it('should include the next step to spec in the body', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(getNextStepToSpec('$ARGUMENTS'));
    });

    it('should include the custom context step for "start"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context start');
    });
  });

  describe('osddt.spec', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.spec')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('$ARGUMENTS');
    });

    it('should instruct writing to osddt.spec.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.spec.md');
    });

    it('should instruct checking for osddt.research.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.research.md');
    });

    it('should instruct using research findings when the file exists', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('key insights, constraints, open questions, codebase findings');
    });

    it('should instruct incorporating research findings when the file exists', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('read it and incorporate its findings');
    });

    it('should instruct adding a Research Summary section when research was found', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Research Summary');
    });

    it('should prompt the user to run osddt.plan as the next step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.plan');
    });

    it('should include the custom context step for "spec"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context spec');
    });
  });

  describe('osddt.clarify', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.clarify')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should instruct locating osddt.spec.md and stopping when absent', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('osddt.spec.md');
      expect(body).toContain('/osddt.spec');
    });

    it('should instruct reading the Open Questions section', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Open Questions');
    });

    it('should instruct reading the Decisions section to detect already-answered questions', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Decisions');
    });

    it('should instruct writing decisions back to the Decisions section of osddt.spec.md', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Decisions');
      expect(body).toContain('osddt.spec.md');
    });

    it('should prompt the user to run osddt.plan as the next step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.plan');
    });

    it('should include the custom context step for "clarify"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context clarify');
    });
  });

  describe('osddt.plan', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.plan')!;

    it('should include the feature name resolution step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(RESOLVE_FEATURE_NAME);
    });

    it('should instruct reading osddt.spec.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.spec.md');
    });

    it('should instruct writing to osddt.plan.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.plan.md');
    });

    it('should check whether osddt.plan.md already exists', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('already exists');
    });

    it('should offer Regenerate, Update, and Do nothing when the file exists', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Regenerate');
      expect(body).toContain('Update');
      expect(body).toContain('Do nothing');
    });

    it('should check for unanswered open questions and offer Clarify first or Proceed anyway', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('unanswered open question');
      expect(body).toContain('/osddt.clarify');
      expect(body).toContain('Clarify first');
      expect(body).toContain('Proceed anyway');
    });

    it('should prompt the user to run osddt.tasks as the next step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.tasks');
    });

    it('should include the custom context step for "plan"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context plan');
    });
  });

  describe('osddt.tasks', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.tasks')!;

    it('should include the feature name resolution step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(RESOLVE_FEATURE_NAME);
    });

    it('should instruct reading osddt.plan.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.plan.md');
    });

    it('should instruct writing to osddt.tasks.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.tasks.md');
    });

    it('should check whether osddt.tasks.md already exists', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('already exists');
    });

    it('should offer Regenerate and Do nothing when the file exists (no Update option)', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Regenerate');
      expect(body).not.toContain('Update');
      expect(body).toContain('Do nothing');
    });

    it('should prompt the user to run osddt.implement as the next step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.implement');
    });

    it('should include the custom context step for "tasks"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context tasks');
    });
  });

  describe('osddt.implement', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.implement')!;

    it('should instruct reading osddt.tasks.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.tasks.md');
    });

    it('should instruct stopping when osddt.tasks.md does not exist', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.tasks');
    });

    it('should instruct implementing one task at a time', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('one task at a time');
    });

    it('should prompt the user to run osddt.done as the next step', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.done');
    });

    it('should include the custom context step for "implement"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context implement');
    });
  });

  describe('osddt.fast', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.fast')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx @dezkareid/osddt' })).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('$ARGUMENTS');
    });

    it('should use {{args}} placeholder for Gemini', () => {
      expect(cmd.body({ args: '{{args}}', npxCommand: 'npx osddt' })).toContain('{{args}}');
    });

    it('should instruct creating the git branch', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('git checkout -b');
    });

    it('should apply feature name constraints', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('Maximum length: 30 characters');
    });

    it('should warn and offer Resume or Abort when branch or working directory already exists', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Resume');
      expect(body).toContain('Abort');
    });

    it('should instruct writing osddt.spec.md without asking the user questions', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('osddt.spec.md');
      expect(body).toContain('Do **not** ask the user any questions');
    });

    it('should instruct writing osddt.plan.md with an Assumptions section', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('osddt.plan.md');
      expect(body).toContain('Assumptions');
    });

    it('should instruct writing osddt.tasks.md', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.tasks.md');
    });

    it('should prompt the user to run osddt.implement after completion', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('/osddt.implement');
    });

    it('should include the custom context step for "fast"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context fast');
    });
  });

  describe('osddt.done', () => {
    const cmd = COMMAND_DEFINITIONS.find(c => c.name === 'osddt.done')!;

    it('should instruct verifying all tasks are checked off', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('osddt.tasks.md');
    });

    it('should instruct running worktree-info to detect whether the feature uses a worktree', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('npx osddt worktree-info');
    });

    it('should instruct running done with --worktree when worktree-info exits with code 0', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('--worktree');
    });

    it('should instruct checking for uncommitted changes with git status --porcelain', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('git -C <worktreePath> status --porcelain');
    });

    it('should instruct running git diff and deriving a conventional commit message', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('git -C <worktreePath> diff');
      expect(body).toContain('conventional commit');
    });

    it('should ask the user to confirm or provide their own commit message', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('Use this commit message, or provide your own');
    });

    it('should instruct pushing the branch with --set-upstream', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('git -C <worktreePath> push --set-upstream origin <branch>');
    });

    it('should instruct running the npx command with done and --dir', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain(`${'npx osddt'} done <feature-name> --dir <project-path>`);
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx @dezkareid/osddt' })).toContain(`${'npx @dezkareid/osddt'} done <feature-name> --dir <project-path>`);
    });

    it('should inform the agent that the destination folder is prefixed with the date', () => {
      const body = cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' });
      expect(body).toContain('YYYY-MM-DD');
      expect(body).toContain('YYYY-MM-DD-feature-a');
    });

    it('should include the custom context step for "done"', () => {
      expect(cmd.body({ args: '$ARGUMENTS', npxCommand: 'npx osddt' })).toContain('npx osddt context done');
    });
  });
});
