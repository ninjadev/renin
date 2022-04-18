import css from '../style.mjs';

let hasBootstapped = false;
function bootstrapCss() {
    if (hasBootstapped) {
        return;
    }
    hasBootstapped = true;
    const styleElement = document.createElement("style");
    styleElement.innerHTML = css;
    document.body.appendChild(styleElement);
}

export { bootstrapCss };
