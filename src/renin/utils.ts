export const getWindowWidth = () => window.innerWidth;
export const getWindowHeight = () => window.innerHeight;

export function children<T>(spec: any): T {
  const store: any = {};
  return new Proxy(spec, {
    set: (target, prop, value) => {
      store[prop] = value;
      return true;
    },
    get: (_target, prop) => {
      if (store[prop]) {
        return store[prop];
      } else {
        store[prop] = new spec[prop]();
        return store[prop];
      }
    },
  });
}
