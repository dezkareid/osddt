import { describe, it, expect } from 'vitest';
import { getClaudeTemplates } from './claude.js';
import { COMMAND_DEFINITIONS } from './shared.js';

describe('getClaudeTemplates', () => {
  const cwd = '/project';
  const templates = getClaudeTemplates(cwd);

  it('should generate one file per command definition', () => {
    expect(templates).toHaveLength(COMMAND_DEFINITIONS.length);
  });

  it('should place files under .claude/commands/', () => {
    for (const t of templates) {
      expect(t.filePath).toContain('.claude/commands/');
    }
  });

  it('should use .md extension for all files', () => {
    for (const t of templates) {
      expect(t.filePath).toMatch(/\.md$/);
    }
  });

  it('should include YAML frontmatter with description', () => {
    for (const t of templates) {
      expect(t.content).toMatch(/^---\ndescription: ".+"\n---/);
    }
  });

  it('should use $ARGUMENTS as the argument placeholder', () => {
    for (const t of templates) {
      expect(t.content).toContain('$ARGUMENTS');
    }
  });

  it('should name files after the command', () => {
    for (const cmd of COMMAND_DEFINITIONS) {
      const template = templates.find((t) => t.filePath.endsWith(`${cmd.name}.md`));
      expect(template).toBeDefined();
    }
  });
});
