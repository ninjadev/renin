var defaultVert = "uniform sampler2D tDiffuse;\n\nvarying vec2 vUv;\n\nvoid main() {\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";

export { defaultVert as default };
