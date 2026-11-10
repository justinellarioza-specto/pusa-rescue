// Retro look: raindrops on the lens, chromatic fringe, soft glow around bright lights,
// color grade, lightning, fear tint, film grain, vignette and a 4x4 ordered dither down to 22 levels.
uniform sampler2D tDiffuse; // the rendered scene
uniform float time;         // seconds, animates the grain and the drops
uniform vec2 res;           // internal resolution in pixels
uniform float bolt;         // 1 during a lightning flash
uniform float fear;         // 0..1, how close the stalker is (horror mode)
uniform float glow;         // bloom strength from the Graphics setting (0 = off)
uniform float lens;         // 0..1, how many raindrops sit on the lens
varying vec2 vUv;

float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// One layer of drops: each grid cell may hold a drop that slowly slides down, then fades.
// Returns the refraction offset in xy and how much of a drop covers this pixel in z.
vec3 drops(vec2 uv, float cells, float speed, float seed) {
  vec2 aspect = vec2(res.x / res.y, 1.0);
  vec2 p = uv * aspect * cells;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float n = hash(id + seed);
  if (n > lens * 0.85) return vec3(0.0);
  float life = fract(time * speed * (0.5 + n) + n * 7.0);
  vec2 c = vec2(hash(id + seed + 3.1) - 0.5, hash(id + seed + 7.7) - 0.5) * 0.5;
  c.y += 0.25 - life * 0.45;                   // slides down the glass
  vec2 d = (f - c) * vec2(1.0, 1.25);
  float r = 0.1 + 0.12 * hash(id + seed + 1.3);
  float m = smoothstep(r, r * 0.55, length(d)) * smoothstep(1.0, 0.75, life) * smoothstep(0.0, 0.08, life);
  return vec3(d / r * 0.075 * m / cells * 4.0, m);
}

void main(){
  vec2 uv = vUv;
  float wetEdge = 0.0;
  if (lens > 0.0) {
    vec3 a = drops(vUv, 4.0, 0.05, 0.0);
    vec3 b = drops(vUv, 8.0, 0.08, 19.0);
    uv -= a.xy + b.xy * 0.7;                     // each drop flips the picture like a tiny lens
    wetEdge = max(a.z, b.z * 0.8);
  }

  vec2 c = vUv - 0.5;
  float ca = (0.004 + fear * 0.03) * dot(c, c) * 4.0;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + c * ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - c * ca).b;

  // Glow: gather the bright parts of the image from two rings of samples around this pixel.
  // Drops on the lens spread the light a little more.
  if (glow > 0.0) {
    vec3 g = vec3(0.0);
    vec2 px = 1.0 / res;
    float spread = 1.0 + wetEdge * 1.5;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.7854 + 0.39;
      vec2 o = vec2(cos(ang), sin(ang)) * px * spread;
      g += max(texture2D(tDiffuse, uv + o * 2.5).rgb - 0.56, 0.0);
      g += max(texture2D(tDiffuse, uv + o * 6.0).rgb - 0.56, 0.0) * 0.55;
    }
    col += g * (glow * 0.14) * (1.0 + wetEdge);
  }
  col += wetEdge * 0.04;

  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col * vec3(0.82, 0.98, 1.18), col, smoothstep(0.0, 0.3, l));
  col = mix(col, col * vec3(1.1, 1.0, 0.86), smoothstep(0.35, 0.9, l));
  col = pow(max(col, 0.0), vec3(0.82)) * 1.08;
  col += vec3(0.55, 0.62, 0.8) * bolt * 0.35;
  col = mix(col, col * vec3(1.18, 0.78, 0.78), fear * 0.55);
  col += (hash(floor(vUv * res) + fract(time) * 91.7) - 0.5) * (0.07 + fear * 0.09);
  col *= 1.0 - (0.9 + fear * 1.3) * dot(c, c);
  float d = bayer4(floor(vUv * res)) - 0.5;
  col = floor(col * 22.0 + d + 0.5) / 22.0;
  gl_FragColor = vec4(col, 1.0);
}
