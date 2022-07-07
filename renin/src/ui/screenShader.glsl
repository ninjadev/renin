varying vec2 vUv;
uniform sampler2D screen;
uniform sampler2D thirdsOverlay;
uniform float thirdsOverlayOpacity;

void main() {
    vec3 color = LinearTosRGB(texture2D(screen, vUv.xy)).rgb;
    float a = texture2D(thirdsOverlay, vUv.xy).a;
    vec3 inverted = 1. - color;
    color = mix(color, inverted, a * thirdsOverlayOpacity);
    gl_FragColor = vec4(color, 1.);
}
