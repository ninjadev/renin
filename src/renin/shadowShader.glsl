varying vec2 vUv;
uniform float width;
uniform float height;
uniform float shadowSize;
uniform float shadowOpacity;

// based off of https://madebyevan.com/shaders/fast-rounded-rectangle-shadows/

// This approximates the error function, needed for the gaussian integral
vec4 erf(vec4 x) {
  vec4 s = sign(x), a = abs(x);
  x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
  x *= x;
  return s - s / (x * x);
}

// Return the mask for the shadow of a box from lower to upper
float boxShadow(vec2 lower, vec2 upper, vec2 point, float sigma) {
  vec4 query = vec4(point - lower, point - upper);
  vec4 integral = 0.5 + 0.5 * erf(query * (sqrt(0.5) / sigma));
  return (integral.z - integral.x) * (integral.w - integral.y);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.;
    float aspect = width / height;
    uv.x *= aspect;
    float padding = shadowSize / height;
    float sigma = padding / 3.;
    float t = boxShadow(vec2(-aspect,-1.) + padding, vec2(aspect, 1.) - padding,  uv, sigma);
    gl_FragColor = vec4(0., 0., 0, shadowOpacity * pow(t, .5));
}
