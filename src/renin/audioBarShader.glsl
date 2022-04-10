varying vec2 vUv;
uniform float width;
uniform float height;
uniform float shadowSize;
uniform float shadowOpacity;
uniform float[600] beatBins;
uniform float beatOffset;
uniform float bpm;
uniform float beats;


void main() {
    int beat = int(vUv.x * beats);

    float pixel = 1. / width;

    vec3 slate_400 = vec3(float(0x94) / 255., float(0xa3) / 255., float(0xb8) / 255.);
    vec3 slate_500 = vec3(float(0x64) / 255., float(0x74) / 255., float(0x8b) / 255.);
    vec3 slate_600 = vec3(float(0x47) / 255., float(0x55) / 255., float(0x69) / 255.);
    vec3 slate_700 = vec3(float(0x33) / 255., float(0x41) / 255., float(0x55) / 255.);
    vec3 slate_800 = vec3(float(0x1e) / 255., float(0x29) / 255., float(0x3b) / 255.);
    vec3 color = slate_800;
    float barGroups = beats / 16.;
    float isStrongBeat = step(1., mod(vUv.x * width, width / beats * 4.));
    vec3 beatColor = mix(slate_400, slate_500, isStrongBeat);
    color = mix(color, slate_700, float(0xcc) / 255. * step(1., mod(vUv.x * barGroups + (beatOffset / 16.) / barGroups, 2.)));
    color = mix(color, slate_600, float(0xcc) / 255. * (1. - step(beatBins[beat], abs(vUv.y - 0.5))));
    color = mix(color, beatColor, float(0x88) / 255. * (1. - step(.5 + (1. - isStrongBeat), mod(vUv.x * width, width / beats))));
    gl_FragColor = vec4(color, 1.);
}
