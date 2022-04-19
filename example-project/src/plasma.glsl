varying vec2 vUv;
uniform float time;
uniform vec3 color;



vec2 rotate(vec2 v, float a) {
    return vec2(v.x * cos(a) + v.y * sin(a), -v.x * sin(a) + v.y * cos(a));
}

void main() {
    vec2 uv = vUv;
    uv = rotate(uv, time * 0.1);
    float a = smoothstep(.45, .55, sin(time * 4. + (cos(uv.x * 10.) * cos(uv.y * 10.)) * 10.));
    gl_FragColor = vec4(mix(color, color * 0.5, vec3(a)), 1.);
}
