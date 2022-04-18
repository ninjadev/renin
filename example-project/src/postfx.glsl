varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float time;

void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;

    /* contrast adjustment */
    color = pow(0.25 + color, vec3(1.5));

    color = mix(vec3(0.), color, smoothstep(125., 252., time));

    gl_FragColor = vec4(color, 1.);
}
