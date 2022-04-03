import { defineConfig } from "vite";
import vitePluginString from "vite-plugin-string";
import Inspect from "vite-plugin-inspect";

function reninPlugin() {
  return {
    name: "renin-plugin",
    transform(src, filepath) {
      if (filepath.endsWith(".ts") && filepath.indexOf("/src/renin/") === -1) {
        const fastNDirtyNodeClassNameParser = /export class ([^ ]+)/;
        const match = fastNDirtyNodeClassNameParser.exec(src);
        if (match) {
          src = 'import {Renin} from "/src/renin/renin"\n' + src;
          src += `
if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    Renin.instance.register(new module.${match[1]}());
  });
}
        `;
        }
      }
      return {
        code: src,
      };
    },
  };
}

export default defineConfig({
  plugins: [
    Inspect(),
    reninPlugin(),
    vitePluginString({
      include: ["**/*.vs", "**/*.fs", "**/*.vert", "**/*.frag", "**/*.glsl"],
      compress: false,
    }),
  ],
});
