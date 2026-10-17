// Retro look: chromatic fringe, soft glow around bright lights, color grade, lightning,
// fear tint, film grain, vignette and a 4x4 ordered dither down to 22 levels.
uniform sampler2D tDiffuse; // the rendered scene
uniform float time;         // seconds, animates the grain
uniform vec2 res;           // internal resolution in pixels
uniform float bolt;         // 1 during a lightning flash
uniform float fear;         // 0..1, how close the stalker is (LAGIM)
uniform float glow;         // bloom strength from the Graphics setting (0 = off)
varying vec2 vUv;

float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5;
  float ca = (0.004 + fear * 0.03) * dot(c, c) * 4.0;
  vec3 col;
  col.r = texture2D(tDiffuse, vUv + c * ca).r;
  col.g = texture2D(tDiffuse, vUv).g;
  col.b = texture2D(tDiffuse, vUv - c * ca).b;

  // Glow: gather the bright parts of the image from two rings of samples around this pixel.
  if (glow > 0.0) {
    vec3 g = vec3(0.0);
    vec2 px = 1.0 / res;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7854 + 0.39;
      vec2 o = vec2(cos(a), sin(a)) * px;
      g += max(texture2D(tDiffuse, vUv + o * 2.5).rgb - 0.56, 0.0);
      g += max(texture2D(tDiffuse, vUv + o * 6.0).rgb - 0.56, 0.0) * 0.55;
    }
    col += g * (glow * 0.14);
  }

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
