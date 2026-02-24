import { describe, it, expect } from 'vitest';
import { getGeminiTemplates } from './gemini.js';
import { COMMAND_DEFINITIONS } from './shared.js';

describe('getGeminiTemplates', () => {
  const cwd = '/project';
  const templates = getGeminiTemplates(cwd, 'npx osddt');

  it('should generate one file per command definition', () => {
    expect(templates).toHaveLength(COMMAND_DEFINITIONS.length);
  });

  it('should place files under .gemini/commands/', () => {
    for (const t of templates) {
      expect(t.filePath).toContain('.gemini/commands/');
    }
  });

  it('should use .toml extension for all files', () => {
    for (const t of templates) {
      expect(t.filePath).toMatch(/\.toml$/);
    }
  });

  it('should include a description field', () => {
    for (const t of templates) {
      expect(t.content).toMatch(/^description = ".+"/);
    }
  });

  it('should wrap the prompt in a triple-quoted string', () => {
    for (const t of templates) {
      expect(t.content).toContain('prompt = """');
    }
  });

  it('should use {{args}} as the argument placeholder', () => {
    const noArgs = ['osddt.tasks.toml', 'osddt.implement.toml', 'osddt.done.toml'];
    for (const t of templates) {
      if (noArgs.some((name) => t.filePath.endsWith(name))) continue;
      expect(t.content).toContain('{{args}}');
    }
  });

  it('should name files after the command', () => {
    for (const cmd of COMMAND_DEFINITIONS) {
      const template = templates.find((t) => t.filePath.endsWith(`${cmd.name}.toml`));
      expect(template).toBeDefined();
    }
  });

  it('should produce a file named osddt.clarify.toml', () => {
    expect(templates.some((t) => t.filePath.endsWith('osddt.clarify.toml'))).toBe(true);
  });
});
