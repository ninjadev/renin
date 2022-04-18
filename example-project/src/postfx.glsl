varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float time;

void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;

    /* contrast adjustment */
    color = pow(0.25 + color, vec3(1.5));

    /* vignette */
    color *= 1. - 3. * pow(length(vUv - 0.5), 4.);

    /* scanlines */
    float intensity = (color.r + color.g + color.b) / 3.;
    vec3 scanlineColor = color * (1. - 0.02 * smoothstep(0.2, 1., sin(-time * .5 + vUv.y * 212.)));
    color = mix(color, scanlineColor, 1. - pow(intensity ,4.));

    /* color tint */
    color += vec3(0.05, 0.05, 0.1);

    /* fade in from black */
    color = mix(vec3(0.), color, smoothstep(125., 252., time));

    gl_FragColor = vec4(color, 1.);
}
