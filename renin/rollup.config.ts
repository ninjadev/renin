import typescript from '@rollup/plugin-typescript';
import { string as stringPlugin } from 'rollup-plugin-string';
import css from 'rollup-plugin-import-css';

export default {
  treeshake: false,
  input: ['src/renin.ts', 'src/cli.ts'],
  external: ['three'],
  output: {
    dir: 'lib',
    entryFileNames: '[name].mjs',
    format: 'es',
    preserveModules: true,
  },
  plugins: [
    typescript(),
    stringPlugin({
      include: '**/*.glsl',
    }),
    css(),
  ],
};
