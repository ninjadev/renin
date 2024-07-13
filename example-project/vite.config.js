import { defineConfig } from "vite";
import path from "path";
import * as url from "url";
import vitePluginString from "vite-plugin-string";
import reninPlugin from "renin/lib/ui/vite.mjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const dir = url.fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    target: "esnext",
  },
  base: "",
  plugins: [
    reninPlugin(),
    nodeResolve(),
    vitePluginString.default({
      include: [
        "**/*.vs",
        "**/*.fs",
        "**/*.vert",
        "**/*.frag",
        "**/*.glsl",
        // "**/*.wasm"
      ],
      compress: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dir, "src"),
    },
  },
});
