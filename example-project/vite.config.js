import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string';
import Inspect from 'vite-plugin-inspect';
import reninPlugin from 'renin/lib/ui/vite.mjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    Inspect.default(),
    reninPlugin(),
    nodeResolve(),
    vitePluginString.default({
      include: ['**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag', '**/*.glsl'],
      compress: false,
    }),
  ],
});
