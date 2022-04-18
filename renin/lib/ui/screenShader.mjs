var screenShader = "varying vec2 vUv;\nuniform sampler2D screen;\nuniform sampler2D thirdsOverlay;\nuniform float thirdsOverlayOpacity;\n\nvoid main() {\n    vec3 color = texture2D(screen, vUv.xy).rgb;\n    float a = texture2D(thirdsOverlay, vUv.xy).a;\n    vec3 inverted = 1. - color;\n    color = mix(color, inverted, a * thirdsOverlayOpacity);\n    gl_FragColor = vec4(color, 1.);\n}\n";

export { screenShader as default };
