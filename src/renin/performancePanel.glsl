#define RT_LENGTH 128

varying vec2 vUv;
uniform float[RT_LENGTH] renderTimesGPU;
uniform int renderTimesGPUIndex;
uniform float[RT_LENGTH] renderTimesCPU;
uniform int renderTimesCPUIndex;
uniform float[RT_LENGTH] updateTimes;
uniform int updateTimesIndex;
uniform float[RT_LENGTH] uiUpdateTimes;
uniform int uiUpdateTimesIndex;

float modI(float a,float b) {
    float m=a-floor((a+0.5)/b)*b;
    return floor(m+0.5);
}


void main() {
    float time = 1.;
    int indexGPU = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(renderTimesGPUIndex), float(RT_LENGTH)));
    int indexCPU = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(renderTimesCPUIndex), float(RT_LENGTH)));
    int indexUpdate = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(updateTimesIndex), float(RT_LENGTH)));
    int indexUIUpdate = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(uiUpdateTimesIndex), float(RT_LENGTH)));
    float valueGPU = renderTimesGPU[indexGPU];
    float valueCPU = renderTimesCPU[indexCPU];
    float valueUpdate = updateTimes[indexUpdate];
    float valueUIUpdate = uiUpdateTimes[indexUIUpdate];
    float yScale = 60.;
    vec3 slate_400 = vec3(float(0x94) / 255., float(0xa3) / 255., float(0xb8) / 255.);
    vec3 slate_500 = vec3(float(0x64) / 255., float(0x74) / 255., float(0x8b) / 255.);
    vec3 slate_600 = vec3(float(0x47) / 255., float(0x55) / 255., float(0x69) / 255.);
    vec3 slate_700 = vec3(float(0x33) / 255., float(0x41) / 255., float(0x55) / 255.);
    vec3 slate_800 = vec3(float(0x1e) / 255., float(0x29) / 255., float(0x3b) / 255.);
    vec3 red = vec3(1., 0., 0.);
    vec3 green = vec3(0., 1., 0.);
    vec3 blue = vec3(0., 0., 1.);
    vec3 color = slate_800;
    float isBarGPU = 1. - step(valueGPU, (1. - vUv.y) * 60.);
    float isBarCPU = 1. - step(valueCPU + valueUpdate + valueUIUpdate, vUv.y * 60.);
    float isBarUpdate = 1. - step(valueUpdate + valueUIUpdate, vUv.y * 60.);
    float isBarUIUpdate = 1. - step(valueUIUpdate, vUv.y * 60.);
    float isAboveLimitBottom = step(16.6666667, vUv.y * 60.);
    float isAboveLimitTop = step(16.66666667, (1.-vUv.y) * 60.);
    color = mix(color, slate_700, 1. - (0.75 + 0.25 * isAboveLimitTop));
    color = mix(color, slate_700, 1. - (0.75 + 0.25 * isAboveLimitBottom));
    color = mix(color, slate_600, isBarGPU);
    color = mix(color, red, isBarGPU * isAboveLimitTop);

    color = mix(color, slate_400, isBarCPU);
    color = mix(color, blue, isBarUpdate);
    color = mix(color, green, isBarUIUpdate);
    color = mix(color, red, isBarCPU * isAboveLimitBottom);


    gl_FragColor = vec4(color, 1.);
}
