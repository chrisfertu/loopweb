// Hand-rolled WebGL renderer for the geometry field.
//
// Draws N luminous points. Each point has a position in shape A and shape B;
// the vertex shader applies each scene's transform and vibration layers,
// then blends A→B with a per-point staggered ease. Additive blending turns
// dense dotted strokes into glowing lines.
//
// Each scene is packed as 12 vec4s (SCENE_VEC4, filled in field.js):
//   0 T0  scale, rotation, offset x (NDC), offset y (NDC)
//   1 T1  tilt x, tilt y, thickness, point size
//   2 E0  breathe amp, breathe phase, ripple amp, ripple k
//   3 E1  ripple phase, wave amp, wave k left, wave k right
//   4 E2  wave phase, shimmer amp, shimmer phase, wobble amp
//   5 E3  wobble n, wobble k, wobble phase, colour mode
//   6 C1  rgb, opacity
//   7 C2  rgb, glow
//   8 E4  selected group (-1 none), reveal (index fraction), spectral amp, heart amp
//   9 E5  heart phase, spectral phase, group colour scale, selection amount
//  10 E6  dashes along the group 2 stroke (0 none), dash phase,
//         reveal sets (0: drawn on by index; n: groups 0..n-1 fade in one
//         after another), brightness at the figure's edge (ether)
//  11 E7  ether: radius where it starts, looseness, drift, drift phase
//
// Two groups are special in every figure: 900 is ambient dust, and a grain of
// group 901 takes its brightness from its second meta value (a figure that is
// redrawn every frame, like the clock, fades grains one by one with it).
// Phases are accumulated on the CPU so a change of speed never jumps.

export const SCENE_VEC4 = 12;

const VERT = `
precision highp float;

attribute vec3 aPosA;
attribute vec3 aPosB;
attribute vec2 aMetaA;
attribute vec2 aMetaB;
attribute vec4 aSeed; // index fraction, r1, r2, r3

uniform vec4 uA[${SCENE_VEC4}];
uniform vec4 uB[${SCENE_VEC4}];
uniform float uMix;
uniform float uTime;
uniform float uStagger;
uniform float uSwirl;
uniform float uDip;
uniform float uUnit;
uniform float uDpr;
uniform float uReduced;
uniform float uBaseSize;
uniform float uFade;
uniform float uDust;
uniform vec2 uRes;
uniform vec4 uPointer;
uniform vec4 uStrike;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.14159265;
const float TAU = 6.28318531;
const float SET_OVERLAP = 3.0;

vec2 rot2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Noise clouds: each cloud (group 0..3) moves with its own spectrum. Octave o
// is a wave 2^o times finer and quicker, weighted 2^(-beta·o/2); the two
// finest are per grain rather than a field. White trembles grain by grain,
// brown sways as a whole, slowly, and dark has no fine octaves at all.
vec2 spectral(float g, vec2 q, float phase) {
  float beta = g < 0.5 ? 0.0 : (g < 1.5 ? 1.0 : (g < 2.5 ? 2.0 : 2.5));
  float amp = g < 0.5 ? 1.0 : (g < 1.5 ? 1.3 : (g < 2.5 ? 2.2 : 1.8));
  float speed = g < 0.5 ? 1.0 : (g < 1.5 ? 0.75 : (g < 2.5 ? 0.4 : 0.3));
  vec2 n = vec2(0.0);
  float total = 0.0;
  for (int o = 0; o < 5; o++) {
    float f = pow(2.0, float(o));
    float w = pow(2.0, -beta * float(o) * 0.5) * (g > 2.5 && o > 1 ? 0.0 : 1.0);
    float t = phase * speed * f;
    float grain = step(2.5, float(o));
    vec2 k = rot2(vec2(2.4 * f, 0.0), float(o) * 2.39996);
    float s1 = mix(dot(k, q), aSeed.y * TAU * 9.0, grain);
    float s2 = mix(dot(rot2(k, 1.3), q), aSeed.z * TAU * 9.0, grain);
    n += w * vec2(sin(s1 + t + float(o) * 1.7), cos(s2 + t * 0.9 + float(o) * 2.3));
    total += w;
  }
  return n * amp / total;
}

float heartbeat(float phase) {
  float p = fract(phase);
  float a = exp(-pow(p / 0.035, 2.0));
  float b = exp(-pow((p - 0.16) / 0.035, 2.0));
  return a + 0.55 * b;
}

// A figure revealed set by set (groups 0..n-1, from the centre out): how far
// along set g is, 0 to 1. Each set takes as long as three sets take to
// start, so the next two are already on their way before it has settled:
// the sets follow one another like one movement, not one after the other.
float setProgress(vec4 E6, float reveal, float g) {
  float p = min(1.0, reveal / 0.93);
  return clamp((p * (E6.z + SET_OVERLAP - 1.0) - min(g, E6.z - 1.0)) / SET_OVERLAP, 0.0, 1.0);
}

// Returns the point in device pixels (origin at canvas centre, y up).
vec2 place(vec3 p, vec2 meta, vec4 T0, vec4 T1, vec4 E0, vec4 E1, vec4 E2, vec4 E3, vec4 E4, vec4 E5, vec4 E6, vec4 E7, out float persp, out float light) {
  float g = meta.x;
  p.xy += (aSeed.yz - 0.5) * T1.z;

  float r = length(p.xy);
  vec2 dir = r > 0.0001 ? p.xy / r : vec2(0.0);
  float th = atan(p.x, p.y);

  // Ether: past E7.x of the radius the figure loosens. Grains sit further
  // from their line and dim, and more and more of them leave it: each one
  // drifts outward, dissolves, and starts again from its place on the line.
  light = 1.0;
  if (E7.y + E7.z > 0.0) {
    float far = smoothstep(E7.x, 1.0, r);
    p.xy += (aSeed.yz - 0.5) * E7.y * far * far;
    light = mix(1.0, E6.w, far);
    if (aSeed.w < far * 0.75) {
      float trip = fract(E7.w * (0.5 + aSeed.y) + aSeed.z * 7.0);
      p.xy += (dir + (aSeed.zy - 0.5) * 0.9) * E7.z * (0.3 + far) * trip;
      light *= smoothstep(0.0, 0.1, trip) * (1.0 - smoothstep(0.3, 1.0, trip));
    }
  }

  // A figure that appears set by set: each set also opens out into place
  // as it comes, quickly at first and then ever more slowly.
  if (E6.z > 0.5) {
    float left = 1.0 - setProgress(E6, E4.y, g);
    p.xy *= 1.0 - 0.16 * left * left * left;
  }

  // Breathing and heartbeat (scale only, never brightness)
  p *= 1.0 + E0.x * sin(E0.y) + E4.w * heartbeat(E5.x);

  // Radial ripple (sound spreading out)
  p.xy += dir * E0.z * sin(E0.w * r - E1.x);

  // Binaural lanes: group 0 = left tone, 1 = right tone, 2 = their sum
  if (E1.y > 0.0 && g < 2.5) {
    float w0 = sin(E1.z * p.x - E2.x);
    float w1 = sin(E1.w * p.x - E2.x);
    float wave = g < 0.5 ? w0 : (g < 1.5 ? w1 : 0.5 * (w0 + w1));
    float lane = 1.0 - smoothstep(0.9, 1.2, abs(p.x));
    p.y += E1.y * wave * lane;
  }

  // Noise spectra per cloud. A selected cloud (the one playing) moves more,
  // the others less.
  if (E4.z > 0.0 && g < 3.5) {
    float on = E4.x > -0.5 && abs(g - E4.x) < 0.5 ? 1.0 : 0.0;
    float focus = 1.0 + E5.w * (on * 0.7 - (1.0 - on) * 0.5);
    p.xy += E4.z * focus * spectral(g, p.xy, E5.y);
  }

  // Shimmer
  p.xy += E2.y * vec2(
    sin(E2.z * (0.6 + aSeed.w) + aSeed.y * TAU),
    cos(E2.z * (0.6 + aSeed.z) + aSeed.w * TAU)
  );

  // Cymatic wobble: n-fold standing wave around the circle
  p.xy *= 1.0 + E2.w * sin(E3.x * th + E3.z) * sin(E3.y * r * PI);

  // 3D tilt, then rotation and scale
  p.yz = rot2(p.yz, T1.x);
  p.xz = rot2(p.xz, T1.y);
  p.xy = rot2(p.xy, -T0.y) * T0.x;

  persp = 1.0 / (1.0 - clamp(p.z, -0.9, 0.9) * 0.4);
  return p.xy * persp * uUnit + T0.zw * uRes * 0.5;
}

float colorFactor(vec3 p, vec2 meta, float mode, float groupScale) {
  float radial = smoothstep(0.1, 1.05, length(p.xy));
  float group = clamp(meta.x * groupScale, 0.0, 1.0);
  float along = meta.y;
  return mode < 1.0 ? mix(radial, group, mode) : mix(group, along, mode - 1.0);
}

// Reveal (draw-on) by index order, with a bright head like an engraver's burin.
float revealGain(float reveal, float idx) {
  if (reveal >= 0.9999) return 1.0;
  float shown = smoothstep(idx - 0.004, idx, reveal);
  float head = 1.0 - smoothstep(0.0, 0.018, reveal - idx);
  return shown * (1.0 + 1.6 * head * step(idx, reveal));
}

// Selection, faded in by amt: keep one group (a device graph node and its
// twelve lines, or a noise cloud) bright, dim the rest. Noise clouds
// (spectral > 0) dim less, so the other three stay in view.
float selectGain(float sel, float amt, float g, float spectral) {
  if (sel < -0.5 || amt <= 0.0) return 1.0;
  float gain;
  if (g < 12.5) {
    gain = abs(g - sel) < 0.5 ? 1.25 : (spectral > 0.0 ? 0.4 : 0.25);
  } else {
    float code = g - 13.0;
    float a = floor(code / 13.0 + 0.001);
    float b = code - a * 13.0;
    gain = (abs(a - sel) < 0.5 || abs(b - sel) < 0.5) ? 1.3 : 0.2;
  }
  return mix(1.0, gain, amt);
}

// Dashes that travel along a stroke (group 2): the line is drawn whole and
// cut into dashes by brightness, so moving the phase moves the dashes.
float dashGain(vec4 E6, vec2 meta) {
  if (E6.x <= 0.0 || abs(meta.x - 2.0) > 0.5) return 1.0;
  float s = fract(meta.y * E6.x - E6.y / TAU);
  return smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.5, 0.6, s)) * 1.25;
}

// A grain of group 901 carries its own brightness.
float liveGain(vec2 meta) {
  return abs(meta.x - 901.0) < 0.5 ? meta.y : 1.0;
}

// A figure revealed set by set: how visible a set is, from its progress.
float setGain(vec4 E6, float reveal, float g) {
  return smoothstep(0.0, 1.0, setProgress(E6, reveal, g));
}

void main() {
  float isDust = step(899.5, aMetaA.x) * step(aMetaA.x, 900.5);
  float tw = 0.72 + 0.28 * sin(uTime * (0.8 + aSeed.y * 2.2) + aSeed.z * TAU);

  if (isDust > 0.5) {
    vec2 drift = vec2(sin(uTime * 0.05 + aSeed.y * TAU), cos(uTime * 0.04 + aSeed.z * TAU)) * 0.02;
    gl_Position = vec4(aPosA.xy * 1.04 + drift, 0.0, 1.0);
    gl_PointSize = uDpr * (0.8 + aSeed.w * 1.4);
    vColor = vec3(0.55, 0.78, 0.66);
    vAlpha = uDust * (0.25 + 0.75 * pow(tw, 3.0)) * uFade;
    return;
  }

  float key = 0.9 * aSeed.x + 0.1 * aSeed.w;
  float d = clamp(uMix * (1.0 + uStagger) - key * uStagger, 0.0, 1.0);
  d = d * d * d * (d * (d * 6.0 - 15.0) + 10.0);
  if (uReduced > 0.5) d = step(0.5, uMix);

  float pa;
  float pb;
  float la;
  float lb;
  vec2 A = place(aPosA, aMetaA, uA[0], uA[1], uA[2], uA[3], uA[4], uA[5], uA[8], uA[9], uA[10], uA[11], pa, la);
  vec2 B = place(aPosB, aMetaB, uB[0], uB[1], uB[2], uB[3], uB[4], uB[5], uB[8], uB[9], uB[10], uB[11], pb, lb);
  vec2 pix = mix(A, B, d);

  // Mid-transition swirl around the moving figure centre
  float mid = sin(PI * d);
  vec2 centre = mix(uA[0].zw, uB[0].zw, d) * uRes * 0.5;
  vec2 rel = rot2(pix - centre, mid * uSwirl * (aSeed.w - 0.35) * 1.6);
  float scaleMid = mix(uA[0].x, uB[0].x, d);
  pix = centre + rel + (aSeed.yz - 0.5) * mid * uSwirl * uUnit * scaleMid * 0.1;

  // Pointer: points part around the cursor like sand
  vec2 dv = pix - uPointer.xy;
  float dist = length(dv);
  float push = uPointer.z * (1.0 - smoothstep(0.0, uPointer.w, dist));
  pix += (dist > 0.001 ? dv / dist : vec2(0.0)) * push * uPointer.w * 0.28;

  // Bell strike: a ring that travels out from the plate centre and fades
  float age = uTime - uStrike.z;
  if (age > 0.0 && age < 8.0) {
    vec2 sv = pix - uStrike.xy;
    float sd = length(sv);
    float unitS = uUnit * scaleMid;
    float ringR = age * 0.5 * unitS;
    float band = exp(-pow((sd - ringR) / (0.08 * unitS), 2.0));
    pix += (sd > 0.001 ? sv / sd : vec2(0.0)) * uStrike.w * exp(-age * 0.7) * band * 0.05 * unitS;
  }

  gl_Position = vec4(pix / (uRes * 0.5), 0.0, 1.0);

  float persp = mix(pa, pb, d);
  float sizeMul = mix(uA[1].w, uB[1].w, d);
  gl_PointSize = uBaseSize * uDpr * sizeMul * (0.55 + aSeed.w * 0.9) * persp;

  vec3 cA = mix(uA[6].rgb, uA[7].rgb, colorFactor(aPosA, aMetaA, uA[5].w, uA[9].z));
  vec3 cB = mix(uB[6].rgb, uB[7].rgb, colorFactor(aPosB, aMetaB, uB[5].w, uB[9].z));
  vColor = mix(cA, cB, d);

  float rA = uA[10].z > 0.5 ? setGain(uA[10], uA[8].y, aMetaA.x) : revealGain(uA[8].y, aSeed.x);
  float rB = uB[10].z > 0.5 ? setGain(uB[10], uB[8].y, aMetaB.x) : revealGain(uB[8].y, aSeed.x);
  float gA = rA * la * selectGain(uA[8].x, uA[9].w, aMetaA.x, uA[8].z) * dashGain(uA[10], aMetaA) * liveGain(aMetaA);
  float gB = rB * lb * selectGain(uB[8].x, uB[9].w, aMetaB.x, uB[8].z) * dashGain(uB[10], aMetaB) * liveGain(aMetaB);
  float op = mix(uA[6].a * gA, uB[6].a * gB, d);
  // Long moves between anchors dissolve and re-form rather than streak
  // across the copy: points dim while they are in flight.
  op *= 1.0 - uDip * smoothstep(0.0, 0.35, mid);
  if (uReduced > 0.5) op *= abs(uMix - 0.5) * 2.0;
  vAlpha = op * tw * uFade * clamp(persp, 0.6, 1.4);
}
`;

const FRAG = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = 1.0 - smoothstep(0.0, 0.5, d);
  a *= a;
  gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
}
`;

// Soft aura behind the figure, tinted by the scene.
const AURA_VERT = `
attribute vec2 aQuad;
void main() { gl_Position = vec4(aQuad, 0.0, 1.0); }
`;

const AURA_FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform vec2 uCentre;
uniform float uRadius;
uniform vec3 uColor;
uniform float uIntensity;
void main() {
  vec2 p = gl_FragCoord.xy - uRes * 0.5 - uCentre;
  float d = length(p) / uRadius;
  float g = exp(-d * d * 1.6) * uIntensity;
  // Dither to break up 8-bit banding in the soft falloff
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  g += (n - 0.5) / 255.0;
  gl_FragColor = vec4(uColor * g, g);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return s;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(p)}`);
  }
  return p;
}

export class GeometryEngine {
  constructor(canvas, { count, seeds }) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL unavailable');

    this.gl = gl;
    this.canvas = canvas;
    this.count = count;

    this.prog = program(gl, VERT, FRAG);
    this.aura = program(gl, AURA_VERT, AURA_FRAG);

    const attr = (name) => gl.getAttribLocation(this.prog, name);
    this.loc = {
      posA: attr('aPosA'),
      posB: attr('aPosB'),
      metaA: attr('aMetaA'),
      metaB: attr('aMetaB'),
      seed: attr('aSeed'),
    };
    const uni = (name) => gl.getUniformLocation(this.prog, name);
    this.u = {
      A: uni('uA'),
      B: uni('uB'),
      mix: uni('uMix'),
      time: uni('uTime'),
      stagger: uni('uStagger'),
      swirl: uni('uSwirl'),
      dip: uni('uDip'),
      unit: uni('uUnit'),
      dpr: uni('uDpr'),
      reduced: uni('uReduced'),
      baseSize: uni('uBaseSize'),
      fade: uni('uFade'),
      dust: uni('uDust'),
      res: uni('uRes'),
      pointer: uni('uPointer'),
      strike: uni('uStrike'),
    };
    const auraUni = (name) => gl.getUniformLocation(this.aura, name);
    this.au = {
      res: auraUni('uRes'),
      centre: auraUni('uCentre'),
      radius: auraUni('uRadius'),
      color: auraUni('uColor'),
      intensity: auraUni('uIntensity'),
    };
    this.auraQuad = gl.getAttribLocation(this.aura, 'aQuad');

    this.buf = {
      posA: gl.createBuffer(),
      posB: gl.createBuffer(),
      metaA: gl.createBuffer(),
      metaB: gl.createBuffer(),
      seed: gl.createBuffer(),
      quad: gl.createBuffer(),
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.seed);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    for (const k of ['posA', 'posB']) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf[k]);
      gl.bufferData(gl.ARRAY_BUFFER, count * 3 * 4, gl.DYNAMIC_DRAW);
    }
    for (const k of ['metaA', 'metaB']) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf[k]);
      gl.bufferData(gl.ARRAY_BUFFER, count * 2 * 4, gl.DYNAMIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.uploaded = { A: null, B: null };
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
  }

  get unit() {
    return Math.min(this.width, this.height) * 0.5;
  }

  resize(cssW, cssH, dpr) {
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
  }

  // Upload a shape into slot 'A' or 'B'. `force` re-uploads transient buffers.
  setShape(slot, shape, force = false) {
    if (!force && this.uploaded[slot] === shape) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf[`pos${slot}`]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, shape.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf[`meta${slot}`]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, shape.meta);
    this.uploaded[slot] = shape;
  }

  draw(s) {
    const gl = this.gl;
    const unit = this.unit;

    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    if (s.aura.intensity > 0.002) {
      gl.useProgram(this.aura);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf.quad);
      gl.enableVertexAttribArray(this.auraQuad);
      gl.vertexAttribPointer(this.auraQuad, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(this.au.res, this.width, this.height);
      gl.uniform2f(this.au.centre, s.aura.x * this.width * 0.5, s.aura.y * this.height * 0.5);
      gl.uniform1f(this.au.radius, unit * s.aura.radius);
      gl.uniform3f(this.au.color, s.aura.r, s.aura.g, s.aura.b);
      gl.uniform1f(this.au.intensity, s.aura.intensity * s.fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(this.auraQuad);
    }

    gl.useProgram(this.prog);
    const bind = (loc, buf, size) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    bind(this.loc.posA, this.buf.posA, 3);
    bind(this.loc.posB, this.buf.posB, 3);
    bind(this.loc.metaA, this.buf.metaA, 2);
    bind(this.loc.metaB, this.buf.metaB, 2);
    bind(this.loc.seed, this.buf.seed, 4);

    gl.uniform4fv(this.u.A, s.sceneA);
    gl.uniform4fv(this.u.B, s.sceneB);
    gl.uniform1f(this.u.mix, s.mix);
    gl.uniform1f(this.u.time, s.time);
    gl.uniform1f(this.u.stagger, s.stagger);
    gl.uniform1f(this.u.swirl, s.swirl);
    gl.uniform1f(this.u.dip, s.dip || 0);
    gl.uniform1f(this.u.unit, unit);
    gl.uniform1f(this.u.dpr, this.dpr);
    gl.uniform1f(this.u.reduced, s.reduced ? 1 : 0);
    gl.uniform1f(this.u.baseSize, s.baseSize);
    gl.uniform1f(this.u.fade, s.fade);
    gl.uniform1f(this.u.dust, s.dust);
    gl.uniform2f(this.u.res, this.width, this.height);
    gl.uniform4f(this.u.pointer, s.pointer[0], s.pointer[1], s.pointer[2], s.pointer[3] * this.dpr);
    gl.uniform4f(this.u.strike, s.strike[0], s.strike[1], s.strike[2], s.strike[3]);

    gl.drawArrays(gl.POINTS, 0, this.count);

    for (const k of Object.values(this.loc)) gl.disableVertexAttribArray(k);
  }

  destroy() {
    const gl = this.gl;
    Object.values(this.buf).forEach((b) => gl.deleteBuffer(b));
    gl.deleteProgram(this.prog);
    gl.deleteProgram(this.aura);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }
}
