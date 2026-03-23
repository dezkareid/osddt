import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    banner: '#!/usr/bin/env node',
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.build.json',
    }),
  ],
  external: ['commander', 'fs-extra', 'path', 'fs', 'url', 'child_process', 'readline', '@inquirer/select', '@inquirer/checkbox'],
};
