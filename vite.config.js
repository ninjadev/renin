import { defineConfig } from 'vite';
import { reninPlugin } from './src/renin/ui/vite';
import vitePluginString from 'vite-plugin-string';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  plugins: [
    Inspect(),
    reninPlugin(),
    vitePluginString({
      include: ['**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag', '**/*.glsl'],
      compress: false,
    }),
  ],
});
