varying vec2 vUv;
uniform float time;

void main() {
    gl_FragColor = vec4(abs(sin(time * 10.)), sin(12. *vUv.y + 13. * vUv.x + time * 20.)*5., 1., 1.);        
}
