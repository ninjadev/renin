import { defineConfig } from "vite";

function reninPlugin() {
  return {
    name: "renin-plugin",
    transform(src, filepath) {
      if (filepath.endsWith(".ts")) {
        const fastNDirtyNodeClassNameParser = /export class ([^ ]+)/;
        const match = fastNDirtyNodeClassNameParser.exec(src);
        if (match) {
          src += `
if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    renin.register(new module.${match[1]}());
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
  plugins: [reninPlugin()],
});
