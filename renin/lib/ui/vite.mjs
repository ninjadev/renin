function reninPlugin() {
    return {
        name: "renin-plugin",
        transform(src, filepath) {
            if (filepath.endsWith(".ts") && filepath.indexOf("/src/renin/") === -1) {
                const fastNDirtyNodeClassNameParser = /export class ([^ ]+)/;
                const match = fastNDirtyNodeClassNameParser.exec(src);
                if (match) {
                    src = 'import {Renin} from "renin/lib/renin"\n' + src;
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

export { reninPlugin as default };
