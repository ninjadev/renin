import css from "../style.css";

let hasBootstapped = false;

export function bootstrapCss() {
  if (hasBootstapped) {
    return;
  }
  hasBootstapped = true;
  const styleElement = document.createElement("style");
  styleElement.innerHTML = css;
  document.body.appendChild(styleElement);
}
