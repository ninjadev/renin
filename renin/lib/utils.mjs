const getWindowWidth = () => window.innerWidth;
const getWindowHeight = () => window.innerHeight;
function children(spec) {
    const store = {};
    return new Proxy(spec, {
        set: (_target, prop, value) => {
            store[prop] = value;
            return true;
        },
        get: (_target, prop) => {
            if (store[prop]) {
                return store[prop];
            }
            else {
                store[prop] = new spec[prop]();
                return store[prop];
            }
        },
    });
}
const gradientCanvas = document.createElement('canvas');
gradientCanvas.width = 256;
gradientCanvas.height = 1;
const ctx = gradientCanvas.getContext('2d');
if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
}

export { children, getWindowHeight, getWindowWidth, gradientCanvas };
