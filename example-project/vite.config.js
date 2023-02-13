import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string';
import reninPlugin from 'renin/lib/ui/vite.mjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    reninPlugin(),
    nodeResolve(),
    vitePluginString({
      include: ['**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag', '**/*.glsl'],
      compress: false,
    }),
  ],
});
