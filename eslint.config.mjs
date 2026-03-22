import typescriptConfig from '@dezkareid/eslint-plugin-web/typescript';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...typescriptConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['dist/'],
  },
];
