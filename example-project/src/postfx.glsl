varying vec2 vUv;
uniform sampler2D tDiffuse;

void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;

    /* contrast adjustment */
    color *= 1.2;

    gl_FragColor = vec4(color, 1.);
}
