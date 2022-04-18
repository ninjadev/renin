var performancePanelShader = "#define RT_LENGTH 128\n\nvarying vec2 vUv;\nuniform float[RT_LENGTH] renderTimesGPU;\nuniform int renderTimesGPUIndex;\nuniform float[RT_LENGTH] renderTimesCPU;\nuniform int renderTimesCPUIndex;\nuniform float[RT_LENGTH] updateTimes;\nuniform int updateTimesIndex;\nuniform float[RT_LENGTH] uiUpdateTimes;\nuniform int uiUpdateTimesIndex;\nuniform float[RT_LENGTH] memoryPercentages;\nuniform int memoryPercentagesIndex;\nuniform float totalJSHeapSize;\nuniform float jsHeapSizeLimit;\nuniform sampler2D overlay;\n\nfloat modI(float a,float b) {\n    float m=a-floor((a+0.5)/b)*b;\n    return floor(m+0.5);\n}\n\n\nvoid main() {\n\n    float height = 4000. / 60.;\n\n    float time = 1.;\n    int indexGPU = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(renderTimesGPUIndex), float(RT_LENGTH)));\n    int indexCPU = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(renderTimesCPUIndex), float(RT_LENGTH)));\n    int indexUpdate = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(updateTimesIndex), float(RT_LENGTH)));\n    int indexUIUpdate = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(uiUpdateTimesIndex), float(RT_LENGTH)));\n    int indexMemoryPercentages = int(modI((vUv.x) * float(RT_LENGTH) + float(RT_LENGTH) + float(memoryPercentagesIndex), float(RT_LENGTH)));\n    float valueGPU = renderTimesGPU[indexGPU];\n    float valueCPU = renderTimesCPU[indexCPU];\n    float valueUpdate = updateTimes[indexUpdate];\n    float valueUIUpdate = uiUpdateTimes[indexUIUpdate];\n    float valueMemory = memoryPercentages[indexMemoryPercentages] / totalJSHeapSize;\n    float valueMemoryFull = memoryPercentages[indexMemoryPercentages] / jsHeapSizeLimit;\n    vec3 slate_400 = vec3(float(0x94) / 255., float(0xa3) / 255., float(0xb8) / 255.);\n    vec3 slate_500 = vec3(float(0x64) / 255., float(0x74) / 255., float(0x8b) / 255.);\n    vec3 slate_600 = vec3(float(0x47) / 255., float(0x55) / 255., float(0x69) / 255.);\n    vec3 slate_700 = vec3(float(0x33) / 255., float(0x41) / 255., float(0x55) / 255.);\n    vec3 slate_800 = vec3(float(0x1e) / 255., float(0x29) / 255., float(0x3b) / 255.);\n    vec3 fuschia_50 = vec3(float(0xfd) / 255., float(0xf4) / 255., float(0xff) / 255.);\n    vec3 fuschia_100 = vec3(float(0xfa) / 255., float(0xe8) / 255., float(0xff) / 255.);\n    vec3 fuschia_200 = vec3(float(0xf5) / 255., float(0xd0) / 255., float(0xfe) / 255.);\n    vec3 fuschia_300 = vec3(float(0xf0) / 255., float(0xab) / 255., float(0xfc) / 255.);\n    vec3 fuschia_400 = vec3(float(0xe8) / 255., float(0x79) / 255., float(0xf9) / 255.);\n    vec3 fuschia_500 = vec3(float(0xd9) / 255., float(0x46) / 255., float(0xef) / 255.);\n    vec3 fuschia_600 = vec3(float(0xc0) / 255., float(0x26) / 255., float(0xd3) / 255.);\n    vec3 fuschia_700 = vec3(float(0xa2) / 255., float(0x1c) / 255., float(0xaf) / 255.);\n    vec3 fuschia_800 = vec3(float(0x86) / 255., float(0x19) / 255., float(0x8f) / 255.);\n    vec3 fuschia_900 = vec3(float(0x70) / 255., float(0x1a) / 255., float(0x75) / 255.);\n    vec3 rose_50 = vec3(float(0xfd) / 255., float(0xf2) / 255., float(0xf8) / 255.);\n    vec3 rose_100 = vec3(float(0xfc) / 255., float(0xe7) / 255., float(0xf3) / 255.);\n    vec3 rose_200 = vec3(float(0xfb) / 255., float(0xcf) / 255., float(0xe8) / 255.);\n    vec3 rose_300 = vec3(float(0xf9) / 255., float(0xa8) / 255., float(0xd4) / 255.);\n    vec3 rose_400 = vec3(float(0xf4) / 255., float(0x72) / 255., float(0xb6) / 255.);\n    vec3 rose_500 = vec3(float(0xec) / 255., float(0x48) / 255., float(0x99) / 255.);\n    vec3 rose_600 = vec3(float(0xdb) / 255., float(0x27) / 255., float(0x77) / 255.);\n    vec3 rose_700 = vec3(float(0xbe) / 255., float(0x18) / 255., float(0x5d) / 255.);\n    vec3 rose_800 = vec3(float(0x9d) / 255., float(0x17) / 255., float(0x4d) / 255.);\n    vec3 rose_900 = vec3(float(0x83) / 255., float(0x18) / 255., float(0x43) / 255.);\n    vec3 sky_50 = vec3(float(0xf0) / 255., float(0xf9) / 255., float(0xff) / 255.);\n    vec3 sky_100 = vec3(float(0xe0) / 255., float(0xf2) / 255., float(0xfe) / 255.);\n    vec3 sky_200 = vec3(float(0xba) / 255., float(0xe6) / 255., float(0xfd) / 255.);\n    vec3 sky_300 = vec3(float(0x7d) / 255., float(0xd3) / 255., float(0xfc) / 255.);\n    vec3 sky_400 = vec3(float(0x38) / 255., float(0xbd) / 255., float(0xf8) / 255.);\n    vec3 sky_500 = vec3(float(0x0e) / 255., float(0xa5) / 255., float(0xe9) / 255.);\n    vec3 sky_600 = vec3(float(0x02) / 255., float(0x84) / 255., float(0xc7) / 255.);\n    vec3 sky_700 = vec3(float(0x03) / 255., float(0x69) / 255., float(0xa1) / 255.);\n    vec3 sky_800 = vec3(float(0x07) / 255., float(0x59) / 255., float(0x85) / 255.);\n    vec3 sky_900 = vec3(float(0x0c) / 255., float(0x4a) / 255., float(0x6e) / 255.);\n    vec3 emerald_50 = vec3(float(0xec) / 255., float(0xfd) / 255., float(0xf5) / 255.);\n    vec3 emerald_100 = vec3(float(0xd1) / 255., float(0xfa) / 255., float(0xe5) / 255.);\n    vec3 emerald_200 = vec3(float(0xa7) / 255., float(0xf3) / 255., float(0xd0) / 255.);\n    vec3 emerald_300 = vec3(float(0x6e) / 255., float(0xe7) / 255., float(0xb7) / 255.);\n    vec3 emerald_400 = vec3(float(0x34) / 255., float(0xd3) / 255., float(0x99) / 255.);\n    vec3 emerald_500 = vec3(float(0x10) / 255., float(0xb9) / 255., float(0x81) / 255.);\n    vec3 emerald_600 = vec3(float(0x05) / 255., float(0x96) / 255., float(0x69) / 255.);\n    vec3 emerald_700 = vec3(float(0x04) / 255., float(0x78) / 255., float(0x57) / 255.);\n    vec3 emerald_800 = vec3(float(0x06) / 255., float(0x5f) / 255., float(0x46) / 255.);\n    vec3 emerald_900 = vec3(float(0x06) / 255., float(0x4e) / 255., float(0x3b) / 255.);\n    vec3 color = slate_800;\n    float isBarGPU = 1. - step(valueGPU, (1. - vUv.y) * height);\n    float isBarCPU = 1. - step(valueCPU + valueUpdate + valueUIUpdate, vUv.y * height);\n    float isBarUpdate = 1. - step(valueUpdate + valueUIUpdate, vUv.y * height);\n    float isBarUIUpdate = 1. - step(valueUIUpdate, vUv.y * height);\n    float isBarMemory = (1. - step(valueMemory, vUv.y * 4. - 1.5)) * step(1.5, vUv.y * 4.);\n    float isBarMemoryFull = (1. - step(valueMemoryFull, vUv.y * 4. - 1.5)) * step(1.5, vUv.y * 4.);\n    float isAboveLimitBottom = step(height / 4., vUv.y * height);\n    float isAboveLimitTop = step(height / 4., (1. - vUv.y) * height);\n    float isInCenterLimit = (1. - step(height / 4. * 2.5, (vUv.y) * height)) * (1. - step(height / 4. * 2.5, (1.  -vUv.y) * height));\n    color = mix(color, slate_700, 1. - (0.75 + 0.25 * isAboveLimitTop));\n    color = mix(color, slate_700, 1. - (0.75 + 0.25 * isAboveLimitBottom));\n    color = mix(color, slate_700, 1. - (0.75 + 0.25 * (1. - isInCenterLimit)));\n    color = mix(color, slate_600, isBarGPU);\n    color = mix(color, rose_700, isBarGPU * isAboveLimitTop);\n\n    color = mix(color, slate_400, isBarCPU);\n    color = mix(color, sky_500, isBarUpdate);\n    color = mix(color, emerald_500, isBarUIUpdate);\n    color = mix(color, rose_500, isBarCPU * isAboveLimitBottom);\n    color = mix(color, mix(fuschia_500, color, 0.4), isBarMemory);\n    color = mix(color, fuschia_900, isBarMemoryFull);\n\n    vec4 overlayColor = texture2D(overlay, vUv);\n    color = mix(color, overlayColor.rgb, overlayColor.a);\n\n    gl_FragColor = vec4(color, 1.);\n}\n";

export { performancePanelShader as default };
