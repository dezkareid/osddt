import { describe, it, expect } from 'vitest';
import { REPO_PREAMBLE, COMMAND_DEFINITIONS } from './shared.js';

describe('REPO_PREAMBLE', () => {
  it('should instruct the agent to run npx osddt meta-info', () => {
    expect(REPO_PREAMBLE).toContain('npx osddt meta-info');
  });

  it('should describe the working-on folder structure', () => {
    expect(REPO_PREAMBLE).toContain('working-on/<feature-name>');
  });

  it('should explain single repo project path resolution', () => {
    expect(REPO_PREAMBLE).toContain('"single"');
    expect(REPO_PREAMBLE).toContain('repository root');
  });

  it('should explain monorepo project path resolution', () => {
    expect(REPO_PREAMBLE).toContain('"monorepo"');
    expect(REPO_PREAMBLE).toContain('packages/my-package');
  });
});

describe('COMMAND_DEFINITIONS', () => {
  it('should define exactly 6 commands', () => {
    expect(COMMAND_DEFINITIONS).toHaveLength(6);
  });

  it('should define commands in spec-driven workflow order', () => {
    const names = COMMAND_DEFINITIONS.map((c) => c.name);
    expect(names).toEqual([
      'osddt.start',
      'osddt.spec',
      'osddt.plan',
      'osddt.tasks',
      'osddt.implement',
      'osddt.done',
    ]);
  });

  describe('osddt.start', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.start')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('$ARGUMENTS');
    });

    it('should instruct deriving branch name from description when no branch is given', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('feat/<derived-name>');
    });

    it('should instruct using input as-is when it looks like a branch name', () => {
      const body = cmd.body('$ARGUMENTS');
      expect(body).toContain('use it as-is');
    });

    it('should instruct creating the git branch', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('git checkout -b');
    });

    it('should instruct creating the working-on directory', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('working-on/<feature-name>');
    });

    it('should explain feature-name derivation from branch name', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('last segment of the branch name');
    });

    it('should prompt the user to run osddt.spec as the next step', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('/osddt.spec $ARGUMENTS');
    });
  });

  describe('osddt.spec', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.spec')!;

    it('should have a description', () => {
      expect(cmd.description).toBeTruthy();
    });

    it('should include the $ARGUMENTS placeholder in its body', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('$ARGUMENTS');
    });

    it('should instruct writing to osddt.spec.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.spec.md');
    });

    it('should prompt the user to run osddt.plan as the next step', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('/osddt.plan $ARGUMENTS');
    });
  });

  describe('osddt.plan', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.plan')!;

    it('should instruct reading osddt.spec.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.spec.md');
    });

    it('should instruct writing to osddt.plan.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.plan.md');
    });

    it('should prompt the user to run osddt.tasks as the next step', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('/osddt.tasks $ARGUMENTS');
    });
  });

  describe('osddt.tasks', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.tasks')!;

    it('should instruct reading osddt.plan.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.plan.md');
    });

    it('should instruct writing to osddt.tasks.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.tasks.md');
    });

    it('should prompt the user to run osddt.implement as the next step', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('/osddt.implement $ARGUMENTS');
    });
  });

  describe('osddt.implement', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.implement')!;

    it('should instruct reading osddt.tasks.md', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.tasks.md');
    });

    it('should instruct implementing one task at a time', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('one task at a time');
    });

    it('should prompt the user to run osddt.done as the next step', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('/osddt.done $ARGUMENTS');
    });
  });

  describe('osddt.done', () => {
    const cmd = COMMAND_DEFINITIONS.find((c) => c.name === 'osddt.done')!;

    it('should instruct running npx osddt done with the feature name', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('npx osddt done $ARGUMENTS');
    });

    it('should instruct verifying all tasks are checked off', () => {
      expect(cmd.body('$ARGUMENTS')).toContain('osddt.tasks.md');
    });
  });
});
