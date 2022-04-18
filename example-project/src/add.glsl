varying vec2 vUv;
uniform sampler2D tA;
uniform sampler2D tB;

void main() {
    vec3 colorA = texture2D(tA, vUv).rgb;
    vec3 colorB = texture2D(tB, vUv).rgb;
    gl_FragColor = vec4(colorA + colorB + 0., 1.);
}
