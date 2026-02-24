import { describe, it, expect } from 'vitest';
import {
  getRepoPreamble,
  FEATURE_NAME_RULES,
  WORKING_DIR_STEP,
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

describe('COMMAND_DEFINITIONS', () => {
  it('should define exactly 9 commands', () => {
    expect(COMMAND_DEFINITIONS).toHaveLength(9);
  });

  it('should list commands with osddt.continue first, then peer entry points, then the rest of the workflow', () => {
    const names = COMMAND_DEFINITIONS.map((c) => c.name);
    expect(names).toEqual([
      'osddt.continue',
      'osddt.research',
      'osddt.start',
      'osddt.spec',
      'osddt.clarify',
      'osddt.plan',
      'osddt.tasks',
      'osddt.implement',
      'osddt.done',
    ]);
  });

  describe('osddt.continue', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.continue')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body('$ARGUMENTS', 'npx @dezkareid/osddt')).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should detect the implementing phase from osddt.tasks.md with unchecked tasks', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('osddt.tasks.md');
      expect(body).toContain('- [ ]');
      expect(body).toContain('/osddt.implement $ARGUMENTS');
    });

    it('should detect the ready-to-close phase when all tasks are checked', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('- [x]');
      expect(body).toContain('/osddt.done $ARGUMENTS');
    });

    it('should detect spec-done phase from osddt.spec.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.plan $ARGUMENTS');
    });

    it('should detect research-done phase from osddt.research.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.spec $ARGUMENTS');
    });

    it('should report the file found and the command to run next', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('exact command the user should run next');
    });

    it('should recommend osddt.clarify when spec or plan phase has unanswered open questions', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('/osddt.clarify $ARGUMENTS');
      expect(body).toContain('unanswered open questions');
    });
  });

  describe('osddt.research', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.research')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body('$ARGUMENTS', 'npx @dezkareid/osddt')).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('$ARGUMENTS');
    });

    it('should instruct writing to osddt.research.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.research.md');
    });

    it('should instruct creating the working-on directory', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('working-on/<feature-name>');
    });

    it('should instruct exploring the existing codebase', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('existing codebase');
    });

    it('should define a research file format with key sections', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('Key Insights');
      expect(body).toContain('Constraints & Risks');
      expect(body).toContain('Open Questions');
    });

    it('should apply feature name constraints', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('Maximum length: 30 characters');
    });

    it('should include the shared working directory check step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(WORKING_DIR_STEP);
    });

    it('should prompt the user to run osddt.spec as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.spec $ARGUMENTS');
    });
  });

  describe('osddt.start', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.start')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body('$ARGUMENTS', 'npx @dezkareid/osddt')).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('$ARGUMENTS');
    });

    it('should instruct deriving branch name from description when no branch is given', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('feat/<derived-name>');
    });

    it('should instruct using input as-is when it looks like a branch name', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('use it as-is');
    });

    it('should instruct creating the git branch', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('git checkout -b');
    });

    it('should explain feature-name derivation from branch name', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('last segment of the branch name');
    });

    it('should apply feature name constraints', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('Maximum length: 30 characters');
    });

    it('should warn and offer Resume or Abort when branch already exists', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('already exists');
      expect(body).toContain('Resume');
      expect(body).toContain('Abort');
    });

    it('should include the shared working directory check step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(WORKING_DIR_STEP);
    });

    it('should prompt the user to run osddt.spec as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.spec $ARGUMENTS');
    });
  });

  describe('osddt.spec', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.spec')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('$ARGUMENTS');
    });

    it('should instruct writing to osddt.spec.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.spec.md');
    });

    it('should instruct checking for osddt.research.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.research.md');
    });

    it('should instruct using research findings when the file exists', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('key insights, constraints, open questions, codebase findings');
    });

    it('should instruct proceeding without research when the file does not exist', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('does not exist, proceed');
    });

    it('should instruct adding a Research Summary section when research was found', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('Research Summary');
    });

    it('should prompt the user to run osddt.plan as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.plan $ARGUMENTS');
    });
  });

  describe('osddt.clarify', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.clarify')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the repo preamble with the provided npx command', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(getRepoPreamble('npx osddt'));
      expect(cmd.body('$ARGUMENTS', 'npx @dezkareid/osddt')).toContain(getRepoPreamble('npx @dezkareid/osddt'));
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('$ARGUMENTS');
    });

    it('should instruct locating osddt.spec.md and stopping when absent', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('osddt.spec.md');
      expect(body).toContain('/osddt.spec $ARGUMENTS');
    });

    it('should instruct reading the Open Questions section', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('Open Questions');
    });

    it('should instruct reading the Decisions section to detect already-answered questions', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('Decisions');
    });

    it('should instruct writing decisions back to the Decisions section of osddt.spec.md', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('Decisions');
      expect(body).toContain('osddt.spec.md');
    });

    it('should prompt the user to run osddt.plan as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.plan $ARGUMENTS');
    });
  });

  describe('osddt.plan', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.plan')!;

    it('should instruct reading osddt.spec.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.spec.md');
    });

    it('should instruct writing to osddt.plan.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.plan.md');
    });

    it('should check whether osddt.plan.md already exists', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('already exists');
    });

    it('should offer Regenerate, Update, and Do nothing when the file exists', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('Regenerate');
      expect(body).toContain('Update');
      expect(body).toContain('Do nothing');
    });

    it('should check for unanswered open questions and offer Clarify first or Proceed anyway', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('unanswered open question');
      expect(body).toContain('/osddt.clarify $ARGUMENTS');
      expect(body).toContain('Clarify first');
      expect(body).toContain('Proceed anyway');
    });

    it('should prompt the user to run osddt.tasks as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.tasks $ARGUMENTS');
    });
  });

  describe('osddt.tasks', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.tasks')!;

    it('should instruct reading osddt.plan.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.plan.md');
    });

    it('should instruct writing to osddt.tasks.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.tasks.md');
    });

    it('should check whether osddt.tasks.md already exists', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('already exists');
    });

    it('should offer Regenerate, Update, and Do nothing when the file exists', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('Regenerate');
      expect(body).toContain('Update');
      expect(body).toContain('Do nothing');
    });

    it('should prompt the user to run osddt.implement as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.implement $ARGUMENTS');
    });
  });

  describe('osddt.implement', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.implement')!;

    it('should instruct reading osddt.tasks.md', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.tasks.md');
    });

    it('should instruct stopping when osddt.tasks.md does not exist', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.tasks $ARGUMENTS');
    });


    it('should instruct implementing one task at a time', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('one task at a time');
    });

    it('should prompt the user to run osddt.done as the next step', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('/osddt.done $ARGUMENTS');
    });
  });

  describe('osddt.done', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.done')!;

    it('should instruct reading .osddtrc to resolve the project path', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('.osddtrc');
    });

    it('should instruct resolving the project path for single and monorepo types', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('"single"');
      expect(body).toContain('"monorepo"');
    });

    it('should instruct verifying all tasks are checked off', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('osddt.tasks.md');
    });

    it('should instruct running the npx command with done and --dir', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain(`${'npx osddt'} done <feature-name> --dir <project-path>`);
      expect(cmd.body('$ARGUMENTS', 'npx @dezkareid/osddt')).toContain(`${'npx @dezkareid/osddt'} done <feature-name> --dir <project-path>`);
    });

    it('should instruct deriving the feature name from args to match the working-on folder', () => {
      expect(cmd.body('$ARGUMENTS', 'npx osddt')).toContain('working-on/');
    });

    it('should inform the agent that the destination folder is prefixed with the date', () => {
      const body = cmd.body('$ARGUMENTS', 'npx osddt');
      expect(body).toContain('YYYY-MM-DD');
      expect(body).toContain('YYYY-MM-DD-feature-a');
    });
  });
});
