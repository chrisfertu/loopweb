import{at as bo,au as Eo,av as ye,aw as So,ax as ko,ay as Ro,az as Bo,aA as Po,aB as To,aC as pt,aD as Io,aE as He}from"./index-hfdxTy4j.js";import{aF as nn,aL as rn,aJ as an,aG as cn,aK as ln,aI as hn,aH as un}from"./index-hfdxTy4j.js";const ne=12,_o=`
precision highp float;

attribute vec3 aPosA;
attribute vec3 aPosB;
attribute vec2 aMetaA;
attribute vec2 aMetaB;
attribute vec4 aSeed; // index fraction, r1, r2, r3

uniform vec4 uA[${ne}];
uniform vec4 uB[${ne}];
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
`,Lo=`
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
`,Fo=`
attribute vec2 aQuad;
void main() { gl_Position = vec4(aQuad, 0.0, 1.0); }
`,Co=`
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
`;function xe(t,o,e){const s=t.createShader(o);if(t.shaderSource(s,e),t.compileShader(s),!t.getShaderParameter(s,t.COMPILE_STATUS)){const n=t.getShaderInfoLog(s);throw t.deleteShader(s),new Error(`Shader compile failed: ${n}`)}return s}function be(t,o,e){const s=t.createProgram();if(t.attachShader(s,xe(t,t.VERTEX_SHADER,o)),t.attachShader(s,xe(t,t.FRAGMENT_SHADER,e)),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))throw new Error(`Program link failed: ${t.getProgramInfoLog(s)}`);return s}class Do{constructor(o,{count:e,seeds:s}){const n=o.getContext("webgl",{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,powerPreference:"high-performance"});if(!n)throw new Error("WebGL unavailable");this.gl=n,this.canvas=o,this.count=e,this.prog=be(n,_o,Lo),this.aura=be(n,Fo,Co);const a=l=>n.getAttribLocation(this.prog,l);this.loc={posA:a("aPosA"),posB:a("aPosB"),metaA:a("aMetaA"),metaB:a("aMetaB"),seed:a("aSeed")};const r=l=>n.getUniformLocation(this.prog,l);this.u={A:r("uA"),B:r("uB"),mix:r("uMix"),time:r("uTime"),stagger:r("uStagger"),swirl:r("uSwirl"),dip:r("uDip"),unit:r("uUnit"),dpr:r("uDpr"),reduced:r("uReduced"),baseSize:r("uBaseSize"),fade:r("uFade"),dust:r("uDust"),res:r("uRes"),pointer:r("uPointer"),strike:r("uStrike")};const c=l=>n.getUniformLocation(this.aura,l);this.au={res:c("uRes"),centre:c("uCentre"),radius:c("uRadius"),color:c("uColor"),intensity:c("uIntensity")},this.auraQuad=n.getAttribLocation(this.aura,"aQuad"),this.buf={posA:n.createBuffer(),posB:n.createBuffer(),metaA:n.createBuffer(),metaB:n.createBuffer(),seed:n.createBuffer(),quad:n.createBuffer()},n.bindBuffer(n.ARRAY_BUFFER,this.buf.seed),n.bufferData(n.ARRAY_BUFFER,s,n.STATIC_DRAW);for(const l of["posA","posB"])n.bindBuffer(n.ARRAY_BUFFER,this.buf[l]),n.bufferData(n.ARRAY_BUFFER,e*3*4,n.DYNAMIC_DRAW);for(const l of["metaA","metaB"])n.bindBuffer(n.ARRAY_BUFFER,this.buf[l]),n.bufferData(n.ARRAY_BUFFER,e*2*4,n.DYNAMIC_DRAW);n.bindBuffer(n.ARRAY_BUFFER,this.buf.quad),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW),this.uploaded={A:null,B:null},this.width=1,this.height=1,this.dpr=1}get unit(){return Math.min(this.width,this.height)*.5}resize(o,e,s){const n=Math.max(1,Math.round(o*s)),a=Math.max(1,Math.round(e*s));n===this.width&&a===this.height&&s===this.dpr||(this.canvas.width=n,this.canvas.height=a,this.width=n,this.height=a,this.dpr=s)}setShape(o,e,s=!1){if(!s&&this.uploaded[o]===e)return;const n=this.gl;n.bindBuffer(n.ARRAY_BUFFER,this.buf[`pos${o}`]),n.bufferSubData(n.ARRAY_BUFFER,0,e.pos),n.bindBuffer(n.ARRAY_BUFFER,this.buf[`meta${o}`]),n.bufferSubData(n.ARRAY_BUFFER,0,e.meta),this.uploaded[o]=e}draw(o){const e=this.gl,s=this.unit;e.viewport(0,0,this.width,this.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),o.aura.intensity>.002&&(e.useProgram(this.aura),e.bindBuffer(e.ARRAY_BUFFER,this.buf.quad),e.enableVertexAttribArray(this.auraQuad),e.vertexAttribPointer(this.auraQuad,2,e.FLOAT,!1,0,0),e.uniform2f(this.au.res,this.width,this.height),e.uniform2f(this.au.centre,o.aura.x*this.width*.5,o.aura.y*this.height*.5),e.uniform1f(this.au.radius,s*o.aura.radius),e.uniform3f(this.au.color,o.aura.r,o.aura.g,o.aura.b),e.uniform1f(this.au.intensity,o.aura.intensity*o.fade),e.drawArrays(e.TRIANGLES,0,3),e.disableVertexAttribArray(this.auraQuad)),e.useProgram(this.prog);const n=(a,r,c)=>{e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(a),e.vertexAttribPointer(a,c,e.FLOAT,!1,0,0)};n(this.loc.posA,this.buf.posA,3),n(this.loc.posB,this.buf.posB,3),n(this.loc.metaA,this.buf.metaA,2),n(this.loc.metaB,this.buf.metaB,2),n(this.loc.seed,this.buf.seed,4),e.uniform4fv(this.u.A,o.sceneA),e.uniform4fv(this.u.B,o.sceneB),e.uniform1f(this.u.mix,o.mix),e.uniform1f(this.u.time,o.time),e.uniform1f(this.u.stagger,o.stagger),e.uniform1f(this.u.swirl,o.swirl),e.uniform1f(this.u.dip,o.dip||0),e.uniform1f(this.u.unit,s),e.uniform1f(this.u.dpr,this.dpr),e.uniform1f(this.u.reduced,o.reduced?1:0),e.uniform1f(this.u.baseSize,o.baseSize),e.uniform1f(this.u.fade,o.fade),e.uniform1f(this.u.dust,o.dust),e.uniform2f(this.u.res,this.width,this.height),e.uniform4f(this.u.pointer,o.pointer[0],o.pointer[1],o.pointer[2],o.pointer[3]*this.dpr),e.uniform4f(this.u.strike,o.strike[0],o.strike[1],o.strike[2],o.strike[3]),e.drawArrays(e.POINTS,0,this.count);for(const a of Object.values(this.loc))e.disableVertexAttribArray(a)}destroy(){const o=this.gl;Object.values(this.buf).forEach(s=>o.deleteBuffer(s)),o.deleteProgram(this.prog),o.deleteProgram(this.aura);const e=o.getExtension("WEBGL_lose_context");e&&e.loseContext()}}const Ee=Math.PI*2,zo=Math.PI*(3-Math.sqrt(5)),Se=.94,Uo=["file","bird","handpan","music"],Ft=(t,o,e,s,n)=>(a,r)=>a>=o&&a<=s&&r>=e&&r<=n&&t(a,r),Oo=(t,o,e)=>{const s=Math.cos(e),n=Math.sin(e);return[t*s+o*n,-t*n+o*s]},_t=(t,o,e,s,n=0)=>{const a=n*Math.PI/180,r=Math.max(e,s);return Ft((c,l)=>{const[h,u]=Oo(c-t,l-o,a);return h*h/(e*e)+u*u/(s*s)<=1},t-r,o-r,t+r,o+r)},ke=(t,o,e)=>_t(t,o,e,e),No=(t,o,e,s)=>Ft((n,a)=>Math.abs(Math.hypot(n-t,a-o)-e)<=s/2,t-e-s,o-e-s,t+e+s,o+e+s),re=(t,o,e,s,n=0)=>Ft((a,r)=>{const c=Math.abs(a-t)-(e/2-n),l=Math.abs(r-o)-(s/2-n);return Math.hypot(Math.max(c,0),Math.max(l,0))+Math.min(Math.max(c,l),0)<=n},t-e/2,o-s/2,t+e/2,o+s/2),Go=(t,o,e,s,n)=>{const a=re(t,o,e+n,e+n,s+n/2),r=re(t,o,e-n,e-n,Math.max(0,s-n/2));return(c,l)=>a(c,l)&&!r(c,l)},Rt=(t,o,e,s,n)=>{const a=e-t,r=s-o,c=a*a+r*r||1;return Ft((l,h)=>{const u=Math.min(1,Math.max(0,((l-t)*a+(h-o)*r)/c));return Math.hypot(l-t-a*u,h-o-r*u)<=n},Math.min(t,e)-n,Math.min(o,s)-n,Math.max(t,e)+n,Math.max(o,s)+n)},kt=t=>{let o=1/0,e=1/0,s=-1/0,n=-1/0;return t.forEach(([a,r])=>{o=Math.min(o,a),e=Math.min(e,r),s=Math.max(s,a),n=Math.max(n,r)}),Ft((a,r)=>{let c=!1;for(let l=0,h=t.length-1;l<t.length;h=l++){const[u,f]=t[l],[g,w]=t[h];f>r!=w>r&&a<(g-u)*(r-f)/(w-f)+u&&(c=!c)}return c},o,e,s,n)},Ot=(t,o=10)=>{const e=[],s=t.length,n=(a,r,c,l,h)=>{const u=h*h,f=u*h;return .5*(2*r+(-a+c)*h+(2*a-5*r+4*c-l)*u+(-a+3*r-3*c+l)*f)};for(let a=0;a<s;a++){const r=t[(a-1+s)%s],c=t[a],l=t[(a+1)%s],h=t[(a+2)%s];for(let u=0;u<o;u++){const f=u/o;e.push([n(r[0],c[0],l[0],h[0],f),n(r[1],c[1],l[1],h[1],f)])}}return kt(e)},qo=(t,o,e)=>{const s=(n,a)=>[t+n*e,o+a*e];return[_t(...s(-.3,-.4),.2*e,.145*e,20),_t(...s(.3,-.27),.2*e,.145*e,20),Rt(...s(-.16,-.38),...s(-.16,.36),.045*e),Rt(...s(.44,-.25),...s(.44,.49),.045*e),kt([s(-.205,.4),s(.485,.545),s(.485,.33),s(-.205,.185)])]},Yo=(t,o,e)=>{const s=(n,a)=>[t+n*e,o+a*e];return[_t(...s(-.1,-.36),.2*e,.145*e,20),Rt(...s(.06,-.34),...s(.06,.42),.045*e),Ot([s(.03,.47),s(.2,.34),s(.36,.16),s(.34,-.06),s(.27,.06),s(.14,.18),s(.03,.22)],8)]},$o={file:()=>{const c=kt([[-.42,-.55],[.42,-.55],[.42,.27],[.13999999999999996,.55],[-.42,.55]]),l=re(0,0,.84,1.1,.07);return{cut:[(h,u)=>c(h,u)&&l(h,u)],keep:[...Yo(-.02,-.12,.62),kt([[.42-.28-.005,.55-.06],[.42-.28-.005,.55-.28-.005],[.42-.06,.55-.28-.005]])]}},bird:()=>{const o=(a,r)=>[(a+.05)*.9,(r+.1)*.9],e=a=>a.map(([r,c])=>o(r,c)),s=Ot(e([[.1,.12],[-.12,.02],[-.42,-.16],[-.2,-.24],[.06,-.2],[.22,-.04]])),n=Ot(e([[.08,.06],[-.1,-.02],[-.32,-.15],[-.18,-.19],[.04,-.15],[.17,-.03]]));return{cut:[Ot(e([[.56,.3],[.45,.43],[.27,.4],[.08,.24],[-.2,.06],[-.5,-.12],[-.45,-.24],[-.18,-.36],[.12,-.4],[.38,-.28],[.52,-.06],[.58,.14]])),kt(e([[.55,.32],[.84,.2],[.56,.12]])),kt(e([[-.4,-.06],[-.92,-.3],[-.88,-.43],[-.74,-.4],[-.36,-.26]])),Rt(...o(0,-.36),...o(-.04,-.58),.022*.9),Rt(...o(.16,-.37),...o(.14,-.58),.022*.9),Rt(...o(-.62,-.6),...o(.62,-.6),.03*.9)],keep:[ke(...o(.47,.27),.04*.9),(a,r)=>s(a,r)&&!n(a,r)]}},handpan:()=>{const t=[ke(0,0,.2),No(0,0,.85,.045)];for(let o=0;o<8;o++){const e=o/8*Ee+Ee/16,s=1-.035*Math.min(o,8-o);t.push(_t(Math.sin(e)*.55,Math.cos(e)*.55,.16*s,.122*s,-(e*180/Math.PI)))}return{cut:t,keep:[]}},music:()=>({cut:[Go(0,0,1.14,.27,.05),...qo(-.06,-.02,.74)],keep:[]})},Y=256,dt=1.06,bt=2*dt/Y,Ho=.012,Wo=.06,Wt=new Map;function jo(t){if(Wt.has(t))return Wt.get(t);const o=$o[t];if(!o)return null;const{cut:e,keep:s}=o(),n=(h,u)=>e.some(f=>f(h,u))&&!s.some(f=>f(h,u)),a=new Uint8Array(Y*Y);for(let h=0;h<Y;h++)for(let u=0;u<Y;u++)a[h*Y+u]=n(-dt+(u+.5)*bt,-dt+(h+.5)*bt)?1:0;const r=[];for(let h=1;h<Y-1;h++)for(let u=1;u<Y-1;u++)a[h*Y+u]||(a[h*Y+u-1]||a[h*Y+u+1]||a[(h-1)*Y+u]||a[(h+1)*Y+u])&&r.push(-dt+(u+.5)*bt,-dt+(h+.5)*bt);const l={inside:(h,u)=>{const f=Math.floor((h+dt)/bt),g=Math.floor((u+dt)/bt);return f>=0&&g>=0&&f<Y&&g<Y&&a[g*Y+f]===1},edge:Float32Array.from(r)};return Wt.set(t,l),l}function Vo(t,o,e,s=1){const n=jo(Uo[o]),a=[];for(let r=0;r<t;r++){const c=Se*Math.sqrt((r+.5)/t),l=r*zo;let h=Math.sin(l)*c,u=Math.cos(l)*c;const f=e();if(n&&n.inside(h,u)){const{edge:g}=n;let w=-1,p=1/0;for(let d=0;d<g.length;d+=2){const y=g[d]-h,b=g[d+1]-u,v=y*y+b*b;v<p&&(p=v,w=d)}if(w>=0){const d=g[w],y=g[w+1],b=Math.sqrt(p)||1,v=Ho+Wo*f*f,x=d+(d-h)/b*v,A=y+(y-u)/b*v,S=!n.inside(x,A)&&Math.hypot(x,A)<=Se+.04;h=S?x:d,u=S?A:y}}a.push([h,u,0,s])}return a}const Gt=Math.PI*2,Yt=901,We=.7,zt=(...t)=>t,gt=(t,o,e,s,n,a)=>{const r=Math.max(8,Math.ceil(Math.abs(a-n)/6)),c=[];for(let l=0;l<=r;l++){const h=(n+(a-n)*l/r)*Math.PI/180;c.push([t+e*Math.cos(h),o+s*Math.sin(h)])}return c},Ko=(t,o,e,s)=>{const n=[];for(let a=0;a<=72;a++){const r=a/72*Gt+Gt/4,c=Math.cos(r),l=Math.sin(r);n.push([t+e*Math.sign(c)*Math.abs(c)**.8,o+s*Math.sign(l)*Math.abs(l)**.8])}return n},Qo=(t,o,e)=>{const s=[];for(let n=0;n<=14;n++){const a=n/14,r=1-a;s.push([r*r*t[0]+2*r*a*o[0]+a*a*e[0],r*r*t[1]+2*r*a*o[1]+a*a*e[1]])}return s},Re=[[...Qo([.55,1],[.13,.84],[.04,.36]),...gt(.35,.31,.31,.31,172,-188)]],Xo={0:[Ko(.35,.5,.31,.5)],1:[zt([.12,.76],[.38,1],[.38,0]),zt([.12,0],[.64,0])],2:[[...gt(.35,.7,.3,.3,165,-40),[.05,0],[.66,0]]],3:[[...gt(.33,.745,.27,.255,150,-90),...gt(.33,.25,.31,.25,90,-150)]],4:[zt([.53,0],[.53,1],[.03,.3],[.67,.3])],5:[[[.6,1],[.15,1],[.1,.56],...gt(.33,.31,.33,.31,125,-150)]],6:Re,7:[zt([.04,1],[.66,1],[.26,0])],8:[[...gt(.35,.755,.255,.245,-90,270),...gt(.35,.265,.31,.265,90,-270)]],9:Re.map(t=>t.map(([o,e])=>[We-o,1-e]))};function Jo(t,o){const e=[];let s=0;t.forEach(r=>{for(let c=1;c<r.length;c++){const l=Math.hypot(r[c][0]-r[c-1][0],r[c][1]-r[c-1][1]);l>0&&e.push([r[c-1],r[c],s,l]),s+=l}});const n=new Float32Array(o*2);let a=0;for(let r=0;r<o;r++){const c=(r+.5)/o*s;for(;a<e.length-1&&e[a][2]+e[a][3]<c;)a++;const[l,h,u,f]=e[a],g=Math.min(1,Math.max(0,(c-u)/f));n[r*2]=l[0]+(h[0]-l[0])*g,n[r*2+1]=l[1]+(h[1]-l[1])*g}return n}const lt=.26,Zo=.2,ts=.22,es=.045,Mt=60,Be=30,Pe=.9,os=.3,jt=(()=>{const t=We*lt,o=Zo*lt,e=ts*lt,n=-(4*t+e+4*o)/2;return{digits:[n,n+t+o,n+2*t+3*o+e,n+3*t+4*o+e],colon:n+2*t+2*o+e/2,y0:-lt/2}})();function je(t){const o=Math.round(t*.095),e=Math.round(t*.02),s=o*4,n=s+e,a=Math.floor((t-n)/Mt);return{body:t,perDigit:o,colon:e,colonAt:s,perMark:a,marks:n,end:n+a*Mt}}const Vt=new Map;function Te(t,o){const e=`${t}@${o}`;return Vt.has(e)||Vt.set(e,Jo(Xo[t],o)),Vt.get(e)}const Kt=(t,o)=>{const e=Math.sin(t*12.9898+o*78.233)*43758.5453;return e-Math.floor(e)},qt=t=>{const o=Math.min(1,Math.max(0,t));return o*o*(3-2*o)},ss=t=>{const o=Math.floor(t)%6e3,e=Math.floor(o/60),s=o%60;return[Math.floor(e/10),e%10,Math.floor(s/10),s%10]};function ns(t,o){if(o<1)return 1;const e=Math.floor(o)-((Math.floor(o)-t)%Mt+Mt)%Mt;if(e<1)return 1;const s=o-e;return s<Be?1-qt(s/Pe):qt((s-Be)/Pe)}function Ve(t,o,e,s=0,n=null){const{body:a,perDigit:r,colon:c,colonAt:l,perMark:h,marks:u,end:f}=e,g=(p,d,y,b)=>{t[p*3]=d,t[p*3+1]=y,t[p*3+2]=0,o[p*2]=Yt,o[p*2+1]=b},w=ss(s);for(let p=0;p<4;p++){let d=w[p],y=1;n&&(n.shown[p]!==w[p]&&(n.from[p]=n.shown[p],n.shown[p]=w[p],n.since[p]=Math.floor(s)),d=n.from[p],y=qt((s-n.since[p])/os));const b=Te(w[p],r),v=y<1?Te(d,r):b,x=jt.digits[p];for(let A=0;A<r;A++){const S=y>=1?1:qt(y*1.4-Kt(A,p)*.4),P=v[A*2]+(b[A*2]-v[A*2])*S,T=v[A*2+1]+(b[A*2+1]-v[A*2+1])*S;g(p*r+A,x+P*lt,jt.y0+T*lt,1)}}for(let p=0;p<c;p++){const d=p%2===0,y=p/c*Gt,b=es*lt;g(l+p,jt.colon+Math.cos(y)*b,(d?.2:-.2)*lt+Math.sin(y)*b,1)}for(let p=0;p<Mt;p++){const d=p/Mt*Gt,y=Math.sin(d),b=Math.cos(d),v=p%5===0?1.14:1.09,x=ns(p,s),A=1-x;for(let S=0;S<h;S++){const P=u+p*h+S,T=1.05+(v-1.05)*(S+.5)/h+A*(.03+.09*Kt(P,1)),D=A*(Kt(P,2)-.5)*.07;g(P,y*T+b*D,b*T-y*D,x)}}for(let p=f;p<a;p++)g(p,0,0,0)}const rs=()=>({shown:[0,0,0,0],from:[0,0,0,0],since:[-1e9,-1e9,-1e9,-1e9]}),Qt=Math.PI*2,Ie=4,_e=.3,as=1.55,is=-1.75,cs=60,ls=110,hs=.26,us=.5,Xt=(t,o)=>{const e=Math.sin(t*12.9898+o*78.233)*43758.5453;return e-Math.floor(e)},Le=t=>{const o=Math.min(1,Math.max(0,t));return o*o*(3-2*o)};function Ke(t,o,e,s=0){const n=Math.log(as/_e),a=-(s/cs)*Qt,r=s/ls;for(let c=0;c<e;c++){const l=c%Ie;let h=(c+Xt(c,3))/e+r;h-=Math.floor(h);const u=_e*Math.exp(h*n),f=l*Qt/Ie+h*is*Qt-a,g=Le((h-.18)/.42),w=Le((h-.62)/.38),p=w*w*hs;t[c*3]=u*Math.sin(f)+(Xt(c,4)-.5)*2*p,t[c*3+1]=u*Math.cos(f)+(Xt(c,5)-.5)*2*p,t[c*3+2]=0,o[c*2]=Yt,o[c*2+1]=g*(1-w*w)*(l%2?us:1)}}const mt=Math.PI*2,wt=30,Lt=4,Ut=.8,Fe=24,fs=3,ps=.045,ds=.075,gs=2.4,ms=.3,Ms=3,Ce=.18,De=t=>{const o=Math.min(1,Math.max(0,t));return o*o*(3-2*o)};function Qe(t){const o=Math.round(t*.04),e=Math.floor(t*.14/wt),s=Math.floor(t*.26/Lt),n=o,a=n+e*wt,r=a+s*Lt;return{body:t,head:o,perBell:e,perRipple:s,bells:n,ripples:a,ring:r,ringCount:t-r}}const Xe=(t=3)=>({angles:Array.from({length:wt},(o,e)=>e<t?e/t*mt:0),rang:Array(wt).fill(-1e9),ripples:Array.from({length:Lt},()=>({k:0,at:-1e9})),next:0,lap:-1,passed:0});function Je(t,o,e,s,n,a,r=0){const{head:c,perBell:l,perRipple:h,bells:u,ripples:f,ring:g,ringCount:w}=e,p=Math.max(1,Math.min(wt,n|0)),d=(E,z,K,_)=>{t[E*3]=z,t[E*3+1]=K,t[E*3+2]=0,o[E*2]=Yt,o[E*2+1]=_},y=(E,z)=>[z*Math.sin(E),z*Math.cos(E)],b=Fe+fs,v=Math.floor(s/b),x=s-v*b,A=Math.min(1,x/Fe),S=A*mt,P=v>0?De(x/.8):1,T=[];v!==a.lap&&(a.lap=v,a.passed=0);for(let E=0;E<wt;E++){const z=E<p?E/p*mt:a.angles[Math.max(0,p-1)];a.angles[E]+=(z-a.angles[E])*(1-Math.exp(-r*Ms))}const D=A>=1?p+1:Math.floor(A*p)+1;for(;a.passed<D;){const E=a.passed%p;T.push(E),a.rang[E]=s,a.ripples[a.next]={k:E,at:s},a.next=(a.next+1)%Lt,a.passed+=1}const[$,F]=y(S,Ut);for(let E=0;E<c;E++){const z=E/c*mt*7.3,K=.028*Math.sqrt((E+.5)/c);d(E,$+K*Math.sin(z),F+K*Math.cos(z),A>=1?.5:1)}const ct=p>12?.6:1,et=E=>E===0?ds:ps*ct;for(let E=0;E<wt;E++){const z=E<p?1:0,[K,_]=y(a.angles[E],Ut),Q=s-a.rang[E],ot=z*(.55+.45*Math.exp(-Math.max(0,Q)*1.4)),H=et(E);for(let st=0;st<l;st++){const nt=st/l*mt;d(u+E*l+st,K+H*Math.sin(nt),_+H*Math.cos(nt),ot)}}for(let E=0;E<Lt;E++){const{k:z,at:K}=a.ripples[E],[_,Q]=y(a.angles[z],Ut),ot=et(z),H=(s-K)/gs,st=z<p&&H>=0&&H<1,nt=st?ot+ms*(1-(1-H)*(1-H)):ot,Ct=st?(1-H)*(1-H)*1.3:0;for(let ut=0;ut<h;ut++){const Bt=ut/h*mt;d(f+E*h+ut,_+nt*Math.sin(Bt),Q+nt*Math.cos(Bt),Ct)}}for(let E=0;E<w;E++){const K=(E+.5)/w*mt,_=De((S-K)/.05+.5),Q=Ce+(.9-Ce)*_*P,[ot,H]=y(K,Ut);d(g+E,ot,H,Q)}return T}const Nt=Math.PI*2,ws=.58,vs=.16,ze=4.2,Ue=.93,Oe=.9,As=.1,Ze=9,ys=.7,xs=.9,bs=9,It={bpm:[55,60],amp:.55,session:null,seconds:Ze};function to(t,o){if(!Array.isArray(t))return t;const[e,s]=t;return e+(s-e)*(.5-.5*Math.cos(o/bs*Nt))}const Ne=(t,o,e)=>Math.exp(-(((t-o)/e)**2));function Ge(t){return Ne(t,.08,.045)+.55*Ne(t,.24,.05)}function eo(t){const o=Math.round(t*.56),e=Math.round(t*.1);return{body:t,trace:o,heart:e,heartAt:o,minutes:o+e,minutesCount:t-o-e}}const oo=()=>({bpm:to(It.bpm,0),amp:It.amp,t:0,beats:0,sweep:0,session:void 0,fill:0,lit:1});function so(t,o,e,s,n=It,a=0){const{trace:r,heart:c,heartAt:l,minutes:h,minutesCount:u}=e,f=(v,x,A,S)=>{t[v*3]=x,t[v*3+1]=A,t[v*3+2]=0,o[v*2]=Yt,o[v*2+1]=S},g=1-Math.exp(-a*xs);s.t+=a,s.bpm+=(to(n.bpm??It.bpm,s.t)-s.bpm)*g,s.amp+=((n.amp??It.amp)-s.amp)*g,s.beats+=s.bpm/60*a,s.sweep=(s.sweep+a/ze)%1;const w=n.session??null;s.session===void 0&&(s.session=w),w!==s.session?(s.lit-=a/ys,s.lit<=0&&(s.session=w,s.fill=0,s.lit=1)):s.fill=Math.min(1,s.fill+a/(n.seconds||Ze));const p=s.sweep*Nt;for(let v=0;v<r;v++){const x=(v+.5)/r,A=p-x*Ue*Nt,S=x*Ue*ze;let P=(s.beats-s.bpm/60*S)%1;P<0&&(P+=1);const T=ws+vs*s.amp*Ge(P);f(v,T*Math.sin(A),T*Math.cos(A),Math.pow(1-x,1.4))}const d=s.beats%1,y=1+.45*s.amp*Ge(d);for(let v=0;v<c;v++){const x=v*2.39996,A=As*y*Math.sqrt((v+.5)/c);f(l+v,A*Math.sin(x),A*Math.cos(x),.55+.45*(y-1)*2)}const b=Math.max(0,s.lit);for(let v=0;v<u;v++){const x=(v+.5)/u,A=x*Nt,S=Math.min(1,Math.max(0,(s.fill-x)/.015+.5));f(h+v,Oe*Math.sin(A),Oe*Math.cos(A),.12+.83*S*b)}}const B=Math.PI*2,Es=(1+Math.sqrt(5))/2,no=Math.PI*(3-Math.sqrt(5)),Ss=Po,ks=900,ro=.07,Rs={point:.22,plate:1.2,brownian:1.4,dust:1.6,phyllotaxis:1.3,cutout:1.3,clock:1.1,flowspiral:4.2,intervals:1.3,pulse:1.4};function ht(t){let o=t>>>0;return()=>{o=o+1831565813>>>0;let e=o;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}const tt=(t,o)=>[t*Math.sin(o),t*Math.cos(o),0],Tt=(t,o,e,s,n,{group:a=0,w:r=1,segs:c}={})=>{const l=c||Math.max(24,Math.ceil(Math.abs(n-s)*e*60)),h=[];for(let u=0;u<=l;u++){const f=s+(n-s)*u/l;h.push([t+e*Math.sin(f),o+e*Math.cos(f),0])}return{pts:h,group:a,w:r}},R=(t,o,e,s={})=>{const n=s.start??0;return Tt(t,o,e,n,n+B,s)},q=(t,o,{group:e=0,w:s=1}={})=>({pts:[[t[0],t[1],t[2]||0],[o[0],o[1],o[2]||0]],group:e,w:s}),V=(t,{group:o=0,w:e=1}={})=>({pts:t,group:o,w:e}),Bs=(t,o,e,{group:s=0,w:n=1,translate:a}={})=>{const r=t/2,c=o/2,l=Math.min(e,r,c),h=[[0,c,0]],u=(f,g,w)=>{for(let p=0;p<=12;p++){const d=w+p/12*(B/4);h.push([f+l*Math.sin(d),g+l*Math.cos(d),0])}};return u(r-l,c-l,0),u(r-l,-c+l,B/4),u(-r+l,-c+l,B/2),u(-r+l,c-l,3*B/4),h.push([0,c,0]),a&&h.forEach(f=>{f[0]+=a[0],f[1]+=a[1]}),{pts:h,group:s,w:n}},Ps={1:[[[.25,.8],[.55,1],[.55,0]]],2:[[[0,1],[1,1],[1,.5],[0,.5],[0,0],[1,0]]],3:[[[0,1],[1,1],[1,0],[0,0]],[[.2,.5],[1,.5]]],4:[[[0,1],[0,.5],[1,.5]],[[1,1],[1,0]]],5:[[[1,1],[0,1],[0,.5],[1,.5],[1,0],[0,0]]],6:[[[1,1],[0,1],[0,0],[1,0],[1,.5],[0,.5]]],7:[[[0,1],[1,1],[.4,0]]],8:[[[0,.5],[0,1],[1,1],[1,0],[0,0],[0,.5],[1,.5]]],9:[[[1,.5],[0,.5],[0,1],[1,1],[1,0],[0,0]]]};function Ts(t,o,e,s,n={}){const a=.6*s,r=.28*s,c=f=>f===":"?.12*s:a,l=[...t].reduce((f,g,w)=>f+c(g)+(w?r:0),0);let h=o-l/2;const u=[];for(const f of t){const g=(w,p)=>[h+w*a,e-s/2+p*s,0];if(f===":")u.push(R(h+.06*s,e+.2*s,.05*s,n),R(h+.06*s,e-.2*s,.05*s,n));else if(f==="0"){const w=[];for(let p=0;p<=40;p++){const d=p/40*B;w.push(g(.5+.5*Math.sin(d),.5+.5*Math.cos(d)))}u.push(V(w,n))}else for(const w of Ps[f]||[])u.push(V(w.map(([p,d])=>g(p,d)),n));h+=c(f)+r}return u}function Is(t){let o=0;for(let e=1;e<t.pts.length;e++){const s=t.pts[e-1],n=t.pts[e];o+=Math.hypot(n[0]-s[0],n[1]-s[1],n[2]-s[2])}return o}function _s(t,o,e,s,n){const a=t.map(Is),r=t.map((g,w)=>a[w]*(g.w??1)),c=r.reduce((g,w)=>g+w,0)||1,l=r.map(g=>g/c*o),h=l.map(Math.floor);let u=o-h.reduce((g,w)=>g+w,0);l.map((g,w)=>[g-Math.floor(g),w]).sort((g,w)=>w[0]-g[0]).forEach(([,g])=>{u>0&&(h[g]++,u--)});let f=0;return t.forEach((g,w)=>{const p=h[w];if(p<=0)return;const d=[0];for(let v=1;v<g.pts.length;v++){const x=g.pts[v-1],A=g.pts[v];d.push(d[v-1]+Math.hypot(A[0]-x[0],A[1]-x[1],A[2]-x[2]))}const y=d[d.length-1]||1;let b=1;for(let v=0;v<p;v++){const x=p===1?.5:v/(p-1),A=x*y;for(;b<d.length-1&&d[b]<A;)b++;const S=g.pts[Math.max(0,b-1)],P=g.pts[Math.min(b,g.pts.length-1)],T=d[b]-d[b-1]||1,D=Math.min(1,Math.max(0,(A-d[b-1])/T)),$=n+f+v;e[$*3]=S[0]+(P[0]-S[0])*D,e[$*3+1]=S[1]+(P[1]-S[1])*D,e[$*3+2]=S[2]+(P[2]-S[2])*D,s[$*2]=g.group||0,s[$*2+1]=x}f+=p}),a.reduce((g,w)=>g+w,0)}function Jt(t,o,e,s){t.forEach((n,a)=>{const r=s+a;o[r*3]=n[0],o[r*3+1]=n[1],o[r*3+2]=n[2]||0,e[r*2]=n[3]??0,e[r*2+1]=t.length>1?a/(t.length-1):0})}function ao(t,o=.02,e=.22,s=0,n=5){const a=ht(n),r=[];for(let c=0;c<t;c++){const l=Math.sqrt(-2*Math.log(Math.max(1e-6,a()))),u=a()<e?o*1.5+o*12*Math.pow(a(),2.2):o*l,f=c*no;r.push([Math.sin(f)*u,Math.cos(f)*u,0,s])}return r}function Zt(t,o,{cx:e=0,cy:s=0,group:n=0,rot:a=0}={}){const r=[];for(let c=0;c<t;c++){const l=o*Math.sqrt((c+.5)/t),h=a+c*no;r.push([e+Math.sin(h)*l,s+Math.cos(h)*l,0,n])}return r}const qe={0:[2.4048,5.5201,8.6537,11.7915],1:[3.8317,7.0156,10.1735,13.3237],2:[5.1356,8.4172,11.6198,14.796],3:[6.3802,9.761,13.0152,16.2235],6:[9.9361,13.5893,17.0038,20.3208],8:[12.2251,16.0378,19.5545,22.9452]},Ye={circle:(t=1)=>[R(0,0,t)],phyllotaxis:()=>({clouds:[{share:1,make:t=>Zt(t,.94,{group:1})}]}),cutout:(t=0)=>({clouds:[{share:1,make:o=>Vo(o,t,ht(11),1)}]}),vesica:()=>{const o=.55*Math.sqrt(3)/2,e=[-.55/2,0],s=[.55/2,0];return{sets:[{share:.94,strokes:[R(-.55/2,0,.55,{start:B*.25}),R(.55/2,0,.55,{start:B*.75,group:1})]},{share:.06,strokes:[q(e,s,{group:2}),q(s,[0,o],{group:2}),q([0,o],e,{group:2}),q(s,[0,-o],{group:2}),q([0,-o],e,{group:2})]}]}},mandala:(t=6)=>{const o=(c,l,h,u,f)=>{const g=[];for(let p=0;p<=128;p++){const d=p<=64,y=d?p/64:2-p/64,b=l+(h-l)*y,v=u*Math.pow(Math.sin(Math.PI*y),.9)*(d?1:-1);g.push([Math.sin(c)*b+Math.cos(c)*v,Math.cos(c)*b-Math.sin(c)*v,0])}return V(g,{group:f})},e=Math.PI/t,s=Math.min(.3,.66*Math.sin(e)),n=Math.min(.2,.5*Math.sin(e)),a=[];for(let c=0;c<t;c++){const l=c*B/t;a.push(o(l,.2,.86,s,0),o(l+e,.2,.58,n,0))}const r=Array.from({length:t},(c,l)=>R(...tt(.93,l*B/t).slice(0,2),.022,{group:1}));return{sets:[{share:.7,strokes:a},{share:.12,strokes:[R(0,0,.2,{group:1}),R(0,0,.07,{group:1})]},{share:.18,strokes:[R(0,0,1.02,{group:1,w:.6}),...r]}]}},lotus:(t=6)=>{const o=[],e=(r,c,l,h,u,f)=>{for(let g=0;g<r;g++){const w=u+g*B/r,p=[],d=72;for(let y=0;y<=d*2;y++){const b=y<=d,v=b?y/d:2-y/d,x=c+(l-c)*v,A=h*Math.pow(Math.sin(Math.PI*v),.8)*(b?1:-1),[S,P]=[Math.sin(w)*x,Math.cos(w)*x];p.push([S+Math.cos(w)*A,P-Math.sin(w)*A,0])}o.push(V(p,{group:f}))}},s=[];if(t===2){e(2,.14,.86,.22,0,0);const r=[];for(let c=0;c<=240;c++){const l=-1+2*c/240,h=Math.exp(-Math.pow(l/.55,2));r.push([l,.1*h*Math.sin(l*38),0])}s.push(V(r,{group:2}))}else if(t===16){e(8,.14,.92,.2,0,0),e(8,.14,.7,.17,B/16,2);const r=o.splice(0,8),c=o.splice(0,8);r.forEach((l,h)=>o.push(l,c[h]))}else e(t,.14,.9,Math.min(.26,.9*Math.sin(Math.PI/t)*.95),0,0);const n=[],a=Math.max(24,t*6);for(let r=0;r<a;r++){const c=r*B/a;n.push(q(tt(1.05,c),tt(r%3===0?1.12:1.08,c),{group:1}))}return{sets:[{share:.66,strokes:[...o,...s]},{share:.2,strokes:[R(0,0,.14,{group:1}),R(0,0,1,{group:1})]},{share:.14,strokes:n}]}},noiseclouds:(t=0)=>{const o=t?[[-.5,.5],[.5,.5],[-.5,-.5],[.5,-.5]]:[[-3,0],[-1,0],[1,0],[3,0]],e=t?.4:.78;return{clouds:o.map(([s,n],a)=>({share:.25,make:r=>Zt(r,e*(a===3?.82:.95),{cx:s,cy:a===3?n-e*.15:n,group:a,rot:a})}))}},horizon:(t=7.2)=>{const o=[];for(let s=0;s<=400;s++){const n=s/400-.5,a=Math.sign(n)*Math.pow(Math.abs(n)*2,1.8)*(t/2);o.push([a,-.1,0])}return{sets:[{share:.9,strokes:[V(o,{group:0})]},{share:.1,strokes:[Tt(0,-.1,.6,-B/4,B/4,{group:1})]}]}},plate:()=>({sets:[{share:.06,strokes:[R(0,0,.92,{group:1})]}],clouds:[{share:.94,make:t=>Zt(t,.9,{group:0})}]}),bell:(t=8,o=2,e=0)=>{const s=e*Math.PI/180,n=[];for(let r=0;r<t;r++){const c=s+r*Math.PI/t;n.push(q(tt(-1,c),tt(1,c),{group:0}))}const a=qe[t]||qe[0];for(let r=0;r<o-1;r++)n.push(R(0,0,a[r]/a[o-1],{group:0}));return n.push(R(0,0,1,{group:1})),{sets:[{share:.88,strokes:n}],clouds:[{share:.12,make:r=>{const c=ht(t*17+o),l=[];for(let h=0;h<r;h++){const u=c()*B,f=Math.sqrt(c())*.95;l.push([Math.sin(u)*f,Math.cos(u)*f,0,2])}return l}}]}},wavering:()=>{const t=[];for(let o=0;o<=720;o++){const e=o/720*B,s=.6*(1+.025*Math.sin(24*e));t.push(tt(s,e))}return[V(t)]},lattice:(t=19,o=.3,e=5,s=0)=>{const n=Ls(e,o),a=n.map((l,h)=>{const[u,f]=h<t?l.pos:n[l.parent].parkedPos(t,n),g=Math.exp(-Math.pow(l.dist/(2.6*o),2))+.15;return R(u,f,o,{group:h===0?1:0,w:g,segs:90,start:l.angle})}),r=t<=7?2*o:t<=19?3*o:.001;if(a.push(R(0,0,r,{group:2,w:t>19?.001:.35})),!s)return a;const c=[];for(let l=0;l<7;l++){const[h,u]=l<s?n[l].pos:[0,0];c.push(R(h,u,l<s?Ss:.001,{group:3,segs:48,w:1}))}return{sets:[{share:.8,strokes:a},{share:.2,strokes:c}]}},sunrise:()=>{const t=[];for(let o=0;o<5;o++){const e=(-60+30*o)*Math.PI/180;t.push(q([.05+Math.sin(e)*.46,.05+Math.cos(e)*.46],[Math.sin(e)*.66,.05+Math.cos(e)*.66],{group:1}))}return{sets:[{share:.42,strokes:[q([-1.2,0],[1.2,0],{group:2})]},{share:.43,strokes:[Tt(0,.05,.32,-B/4-.05,B/4+.05,{group:1}),Tt(0,.05,.32,B/4+.2,B*.75-.2,{group:1,w:.25})]},{share:.15,strokes:t}]}},star:(t=9,o=4)=>{const e=[];for(let a=0;a<t;a++)e.push(tt(1,a*B/t));const s=[];let n=0;for(let a=0;a<t;a++){const r=(n+o)%t;s.push(q(e[n],e[r])),n=r}return{sets:[{share:.62,strokes:s},{share:.26,strokes:[R(0,0,1,{group:1})]}],clouds:[{share:.12,make:a=>{const r=Math.floor(a/t),c=[];for(let l=0;l<t;l++)ao(l===0?a-r*(t-1):r,l===0?.03:.018,.1,2,40+l).forEach(u=>c.push([u[0]+e[l][0],u[1]+e[l][1],0,2]));return c}}]}},hypotrochoid:()=>{const t=[];for(let e=0;e<=1400;e++){const s=e/1400*6*Math.PI;t.push([(2*Math.cos(s)+5*Math.cos(2*s/3))/7,(2*Math.sin(s)-5*Math.sin(2*s/3))/7,0])}return[V(t)]},spiral:(t=6)=>{const o=Math.log(Es)/(Math.PI/2),e=[];for(let s=0;s<t;s++){const n=[],a=s*B/t;for(let r=0;r<=1;r+=1/260){const c=r*3.4*Math.PI,l=.024*Math.exp(o*c);if(l>1.02)break;n.push(tt(l,-(c+a)))}e.push(V(n,{group:s%2}))}return e},circletorus:(t=24)=>{const e=[];for(let s=0;s<t;s++){const n=s/t*B;e.push(R(.5*Math.sin(n),.5*Math.cos(n),.5,{start:n+Math.PI,group:s%2}))}return e},metatron:()=>{const t=bo,o=t.map(([s,n],a)=>R(s,n,.2,{group:a,segs:96})),e=[];for(let s=0;s<t.length;s++)for(let n=s+1;n<t.length;n++)e.push({l:Math.hypot(t[s][0]-t[n][0],t[s][1]-t[n][1]),s:q(t[s],t[n],{group:13+s*13+n})});return e.sort((s,n)=>s.l-n.l),{sets:[{share:.45,strokes:o},{share:.55,strokes:e.map(s=>s.s)}]}},surface:(t=0)=>{const o=(h,u,f,g)=>Bs(h,u,f,g),e=(h,u,f,g,w)=>Tt(h,u,f,0,B*g,w),s=(h,u,f,g)=>{const w=h-f*.22,p=[0,120,240,0].map(d=>[w+f*Math.cos(d*Math.PI/180),u+f*Math.sin(d*Math.PI/180),0]);return V(p,g)};if(t===1)return{sets:[{share:.66,strokes:[o(1.84,.92,.24,{group:0}),R(-.6,.1,.13,{group:0})]},{share:.14,strokes:[q([-.38,.18],[.2,.18],{group:0}),q([-.38,.02],[.02,.02],{group:0})]},{share:.2,strokes:[s(.56,.1,.1,{group:1})]}]};if(t===2)return{sets:[{share:.7,strokes:[o(1.1,1.1,.3,{group:0})]},{share:.3,strokes:[s(0,0,.22,{group:1})]}]};if(t===4){const h=(u,f,g)=>{const w=[];for(let p=0;p<=160;p++){const d=-.42+.84*p/160,y=Math.pow(Math.cos(d/.42*(Math.PI/2)),2);w.push([d,u*y*Math.sin(d*f*Math.PI+g),0])}return V(w,{group:1})};return{sets:[{share:.4,strokes:[R(0,0,.56,{group:0})]},{share:.6,strokes:[h(.2,3.2,0),h(.13,4.6,1.3),h(.08,6.1,2.4)]}]}}if(t===5){const h=(u,f)=>[o(.5,.14,.07,{group:0,translate:[-.42,u],w:.6}),q([-.06,u],[-.06+f,u],{group:0,w:.6})];return{sets:[{share:.46,strokes:[o(1.6,1.12,.16,{group:0})]},{share:.14,strokes:[o(.2,.2,.06,{group:0,translate:[-.56,.33]}),q([-.36,.33],[.24,.33],{group:0})]},{share:.26,strokes:[...h(.06,.46),...h(-.14,.36),...h(-.34,.5)]},{share:.14,strokes:[s(.56,.33,.08,{group:1})]}]}}if(t===3){const h=[];for(let u=0;u<60;u++){const f=u*B/60;h.push(q(tt(.49,f),tt(u%5===0?.56:.52,f),{group:0,w:.5}))}return{sets:[{share:.42,strokes:[o(1.32,1.56,.42,{group:0})]},{share:.14,strokes:[R(0,0,.42,{group:0,w:.4})]},{share:.16,strokes:h},{share:.28,strokes:[e(0,0,.42,.7,{group:1}),s(0,0,.11,{group:1})]}]}}const n=[],a=.3,[r,c,l]=[.92,.7,-.6];n.push([-r,l,0]);for(let h=0;h<=16;h++){const u=-B/4+h/16*(B/4);n.push([-r+a+a*Math.sin(u),c-a+a*Math.cos(u),0])}for(let h=0;h<=16;h++){const u=h/16*(B/4);n.push([r-a+a*Math.sin(u),c-a+a*Math.cos(u),0])}return n.push([r,l,0]),{sets:[{share:.34,strokes:[V(n,{group:0,w:.5})]},{share:.4,strokes:[o(1.24,.36,.18,{group:0,translate:[0,.42]})]},{share:.08,strokes:[R(-.43,.42,.08,{group:0})]},{share:.18,strokes:Ts("12:00",.33,.42,.095,{group:1})}]}},enclosure:(t=1.2)=>{const o=Eo(t).map(({from:s,hit:n,to:a})=>V([s,n,a].map(([r,c])=>[r,c,0]),{group:2})),e=[];for(let s=0;s<5;s++)e.push(R(0,0,.03+s*.022,{group:0,w:.5}));return{sets:[{share:.14,strokes:e},{share:.16,strokes:[R(0,0,.42,{group:0,w:.6})]},{share:.44,strokes:[R(0,0,ye,{group:1}),R(0,0,ye-.06,{group:1,w:.6})]},{share:.26,strokes:o}]}}};function Ls(t,o){const e=[];for(let s=-t;s<=t;s++)for(let n=-t;n<=t;n++){const a=-s-n,r=Math.max(Math.abs(s),Math.abs(n),Math.abs(a));if(r>t)continue;const c=o*(s+n/2),l=o*(n*Math.sqrt(3)/2);let h=Math.atan2(c,l);h<0&&(h+=B),e.push({q:s,s:n,ring:r,pos:[c,l],angle:h,dist:Math.hypot(c,l)})}return e.sort((s,n)=>s.ring-n.ring||s.angle-n.angle),e.forEach((s,n)=>{if(s.ring===0)s.parent=0;else{let a=0,r=1/0;e.forEach((c,l)=>{if(c.ring!==s.ring-1)return;const h=Math.hypot(c.pos[0]-s.pos[0],c.pos[1]-s.pos[1]);h<r-1e-9&&(r=h,a=l)}),s.parent=a}s.index=n,s.parkedPos=function(r,c){let l=this;for(;l.index>=r&&l.index!==0;)l=c[l.parent];return l.pos}}),e}function Fs(t=0){if(typeof document>"u")return[R(0,0,1)];const o="http://www.w3.org/2000/svg",e=document.createElementNS(o,"svg");e.setAttribute("width","0"),e.setAttribute("height","0"),e.style.position="absolute",e.style.visibility="hidden",document.body.appendChild(e);const s=[{svg:So,group:0,set:1},{svg:ko,group:1,set:2},{svg:Ro,group:0,set:3},{svg:Bo,group:1,set:4}],n=[];let a=0;const r=new DOMParser;s.forEach(({svg:d,group:y,set:b})=>{r.parseFromString(d,"image/svg+xml").querySelectorAll("path").forEach(x=>{(x.getAttribute("d")||"").split(/(?=M)/).forEach(S=>{const P=document.createElementNS(o,"path");P.setAttribute("d",S),e.appendChild(P);const T=P.getTotalLength(),D=Math.max(8,Math.round(T/4)),$=[];for(let F=0;F<=D;F++){const ct=P.getPointAtLength(F/D*T),et=(ct.x-512)/512,E=-(ct.y-512)/512;a=Math.max(a,Math.hypot(et,E)),$.push([et,E,0])}n.push({pts:$,group:t?b:y,w:1})})})}),document.body.removeChild(e);const c=a>0?1/a:1;if(n.forEach(d=>d.pts.forEach(y=>{y[0]*=c,y[1]*=c})),!t){const d=.0859375*c;return[R(0,0,d,{group:2}),R(0,0,d*.5,{group:2}),...n]}const l=To,h=-l*.12,u=d=>[h+l*Math.cos(d*Math.PI/180),l*Math.sin(d*Math.PI/180)],[f,g,w]=[u(0),u(120),u(240)];return{clouds:[{share:.035,first:!0,make:d=>{const y=ht(31),b=[];for(let v=0;v<d;v++){let x=y(),A=y();x+A>1&&(x=1-x,A=1-A),b.push([f[0]+(g[0]-f[0])*x+(w[0]-f[0])*A,f[1]+(g[1]-f[1])*x+(w[1]-f[1])*A,0,0])}return b}}],sets:[{share:.025,strokes:[V([f,g,w,f].map(([d,y])=>[d,y,0]),{group:0})]},{share:.94,strokes:n}]}}const te=new Map;function Cs(t){const[o,e]=t.split(":"),s=e?e.split(",").map(Number):[];return{name:o,args:s}}function Ds(t){return Array.isArray(t)?{sets:[{share:1,strokes:t}],clouds:[]}:{sets:t.sets||[],clouds:t.clouds||[]}}function ee(t,o){const e=`${t}@${o}`;if(te.has(e))return te.get(e);const s=new Float32Array(o*3),n=new Float32Array(o*2),a=Math.floor(o*ro),r=o-a,{name:c,args:l}=Cs(t);let h=0,u=0;if(c==="point")Jt(ao(r,.02,.22,1),s,n,0),u=1;else if(c==="brownian"||c==="dust")Jt(c==="brownian"?zs(r):Us(r),s,n,0),u=1;else if(c==="clock")Ve(s,n,je(r)),u=1;else if(c==="flowspiral")Ke(s,n,r),u=1;else if(c==="intervals")Je(s,n,Qe(r),5.5,l[0]||3,Xe(l[0]||3)),u=1;else if(c==="pulse"){const d=oo();d.beats=.6,so(s,n,eo(r),d),u=1}else{const d=c==="logo"?Fs:Ye[c]||Ye.circle,{sets:y,clouds:b}=Ds(d(...l)),v=[...y,...b].reduce((S,P)=>S+P.share,0)||1;let x=0;const A=[...b.filter(S=>S.first),...y,...b.filter(S=>!S.first)];A.forEach((S,P)=>{const D=P===A.length-1?r-x:Math.round(S.share/v*r);D<=0||(S.make?(Jt(S.make(D),s,n,x),u+=D/r):h+=_s(S.strokes,D,s,n,x),x+=D)})}const f=ht(1234);for(let d=r;d<o;d++)s[d*3]=f()*2-1,s[d*3+1]=f()*2-1,s[d*3+2]=f(),n[d*2]=ks,n[d*2+1]=f();const g=Math.min(3.4,Math.max(.8,h/6.5)),w=Rs[c]??(u>.6?1.2:g),p={pos:s,meta:n,gain:w,body:r};return te.set(e,p),p}function zs(t){const o=ht(7),e=[];let s=0,n=0,a=0,r=0;for(let c=0;c<t;c++){a=a*.92+(o()-.5)*.016,r=r*.92+(o()-.5)*.016,s+=a,n+=r;const l=Math.hypot(s,n);l>.95&&(s*=.95/l,n*=.95/l,a*=-.5,r*=-.5),e.push([s,n,0])}return e}function Us(t){const o=ht(33),e=[];for(let s=0;s<t;s++){const n=o()*B,a=1.4*Math.sqrt(o());e.push([Math.sin(n)*a,Math.cos(n)*a,0])}return e}function Os(t){const o=ht(99),e=new Float32Array(t*4);for(let s=0;s<t;s++)e[s*4]=s/t,e[s*4+1]=o(),e[s*4+2]=o(),e[s*4+3]=o();return e}const ae=1024,oe=Math.PI*2,{scenes:se,anchors:Ns,listeners:Gs,pendingStrikes:Et}=pt,ie=ne*4,qs=1-ro,ce=t=>{const o=t.replace("#",""),e=parseInt(o.length===3?o.replace(/(.)/g,"$1$1"):o,16);return[(e>>16&255)/255,(e>>8&255)/255,(e&255)/255]};function Ys(t,o){const e={...He},s=n=>{for(const a of Object.keys(n))n[a]!==void 0&&(e[a]=n[a])};return s(t),o&&t.mobile&&s(t.mobile),e}function $s(t){const[o,e,s]=ce(t.colors[0]),[n,a,r]=ce(t.colors[1]||t.colors[0]),c=new Float32Array(ie);return c.set([t.scale,t.rotation,t.offset[0],t.offset[1],t.tilt[0],t.tilt[1],t.thickness,t.size,t.breathe[0],0,t.ripple[0],t.ripple[1],0,t.wave[0],t.wave[1],t.wave[2],0,t.shimmer[0],0,t.wobble[0],t.wobble[1],t.wobble[2],0,t.colorMode,o,e,s,t.opacity,n,a,r,t.glow,t.select,1,t.spectral[0],t.heart[0],0,0,t.groupScale,0,t.dash[0],0,t.revealSets,t.farLight,t.ether[0],t.ether[1],t.ether[2],0]),c}const St=t=>Math.min(1,Math.max(0,t)),Hs=10,Ws=1.7,js=1.1,Vs=.03,Ks=8,Qs=2.6,$e=(t,o)=>{const e=Math.atan2(Math.sin(t),Math.cos(t));return Math.abs(e)<1e-4?0:e*(1-o)};function Xs(){var n;const t=window.innerWidth<ae,o=navigator.hardwareConcurrency||4,e=navigator.deviceMemory||8,s=(n=window.matchMedia)==null?void 0:n.call(window,"(pointer: fine)").matches;return e<=2||o<=2?{count:4500,size:2.6}:s&&!t&&o>=8?{count:14e3,size:2.2}:{count:8e3,size:2.3}}function en(t,{reducedMotion:o=!1,onFail:e}={}){const s=Xs(),{count:n}=s,a=Os(n);let r;try{r=new Do(t,{count:n,seeds:a})}catch(i){return e&&e(i),()=>{}}let c=!0,l=0,h=performance.now(),u=0,f=0,g=o?1:0,w=!1,p=!0,d=-1,y=-1,b=window.innerWidth<ae,v=t.clientWidth||window.innerWidth,x=t.clientHeight||window.innerHeight,A=-1,S=-1,P=0,T=null,D=0,$=-1,F=[],ct=null,et=null,E=null,z=!1;const K=window.scrollY>window.innerHeight*.3,_={x:0,y:0,strength:0,target:0,lastMove:-1e9},Q=[0,0,-1e9,0],ot=()=>Math.min(window.devicePixelRatio||1,b?1.75:2),H=()=>{const i=window.scrollY;F=[],se.forEach(M=>{!M.el||!M.el.isConnected||(M.docTop=M.el.getBoundingClientRect().top+i,F.push(M))}),F.sort((M,m)=>M.docTop-m.docTop),$=f},st=()=>{const i=t.clientWidth||window.innerWidth,M=t.clientHeight||window.innerHeight;if(i===v&&Math.abs(M-x)<120&&r.width>1){p=!0;return}v=i,x=M,b=window.innerWidth<ae,r.resize(v,x,ot()),se.forEach(m=>{m.resolved=null}),H(),p=!0};r.resize(v,x,ot());const nt=new ResizeObserver(st);nt.observe(t),nt.observe(document.body);const Ct=i=>{i.pointerType==="mouse"&&(_.x=i.clientX,_.y=i.clientY,_.target=1,_.lastMove=f)},ut=()=>{_.target=0};window.addEventListener("pointermove",Ct,{passive:!0}),document.addEventListener("pointerleave",ut);const Bt=()=>{h=performance.now()};document.addEventListener("visibilitychange",Bt);const le=i=>{i.preventDefault(),w=!0,e&&e(new Error("WebGL context lost"))};t.addEventListener("webglcontextlost",le);const he=()=>{p=!0};window.addEventListener("scroll",he,{passive:!0});const ue=(window.requestIdleCallback||(i=>setTimeout(i,300)))(()=>{const i=new Set;se.forEach(M=>{i.add(M.shapeKey),(M.config.preload||[]).forEach(m=>i.add(m))}),i.forEach(M=>ee(M,n))}),fe=i=>i.start==null?0:u-i.start,$t={clock:{layout:je,state:rs,write:i=>Ve(i.shape.pos,i.shape.meta,i.layout,fe(i),i.state)},flowspiral:{write:(i,M)=>Ke(i.shape.pos,i.shape.meta,i.shape.body,M.phase.pace)},intervals:{layout:Qe,state:i=>Xe(i.resolved.bells),write:(i,M,m)=>{const{pos:C,meta:I}=i.shape,L=Je(C,I,i.layout,fe(i),M.resolved.bells,i.state,m);i.start!=null&&!rt()&&L.forEach(O=>Io({id:M.config.id,type:"bell",index:O}))}},pulse:{layout:eo,state:oo,write:(i,M,m)=>so(i.shape.pos,i.shape.meta,i.layout,i.state,M.resolved.pulse,rt()?0:m)}},io=(i,M,m)=>{const C=$t[i.shapeKey];(!i.live||i.live.key!==i.shapeKey)&&(i.live={key:i.shapeKey,shape:{pos:Float32Array.from(M.pos),meta:Float32Array.from(M.meta),gain:M.gain,body:M.body},layout:C.layout?C.layout(M.body):null,state:C.state?C.state(i):null,start:null,frame:-1});const I=i.live;return I.frame!==P&&(I.frame=P,C.write(I,i,m)),I.shape.live=!0,I.shape},pe=(i,M)=>{const m=ee(i.shapeKey,n);if(!i.shapeFrom)return $t[i.shapeKey]&&!o?io(i,m,M):m;i.shapeStart<0&&(i.shapeStart=f);const C=o?.001:i.resolved.morph,I=Math.min(1,(f-i.shapeStart)/C),L=1-Math.pow(1-I,3);if(I>=1)return i.shapeFrom=null,i.fromSnap=null,m;const O=i.fromSnap||ee(i.shapeFrom,n);i.transient||(i.transient={pos:new Float32Array(n*3),meta:new Float32Array(n*2)});const{pos:U,meta:vt}=i.transient;for(let G=0;G<n;G++){let W=St(L*1.5-a[G*4+1]*.5);W=W*W*W*(W*(W*6-15)+10);const N=G*3;U[N]=O.pos[N]+(m.pos[N]-O.pos[N])*W,U[N+1]=O.pos[N+1]+(m.pos[N+1]-O.pos[N+1])*W,U[N+2]=O.pos[N+2]+(m.pos[N+2]-O.pos[N+2])*W,vt[G*2]=W<.5?O.meta[G*2]:m.meta[G*2],vt[G*2+1]=O.meta[G*2+1]+(m.meta[G*2+1]-O.meta[G*2+1])*W}return i.transient.live=!0,i.transient.gain=O.gain+(m.gain-O.gain)*L,i.transient},rt=()=>o||pt.paused(),co=(i,M)=>{if(!i.resolved){i.resolved=Ys(i.config,b),i.target=$s(i.resolved);const L=i.resolved.shape||He.shape;if(L!==i.shapeKey){if(i.cur&&!o&&(i===ct||i===et)){const O=i.shapeFrom&&i.shapeStart>=0&&i.transient;i.fromSnap=O?{pos:i.transient.pos.slice(),meta:i.transient.meta.slice(),gain:i.transient.gain}:null,i.shapeFrom=i.shapeKey,i.shapeStart=-1}else i.shapeFrom=null,i.fromSnap=null;i.shapeKey=L}i.cur||(i.cur=Float32Array.from(i.target))}const m=i.resolved,C=o?1:1-Math.exp(-M*3.2);for(let L=0;L<ie;L++)i.cur[L]+=(i.target[L]-i.cur[L])*C;const I=m.select>=0?m.select:-1;if(o?(i.sel=I,i.selAmt=I>=0?1:0):i.sel!==I?(i.selAmt=Math.max(0,i.selAmt-M*5),i.selAmt<=0&&(i.sel=I)):I>=0&&(i.selAmt=Math.min(1,i.selAmt+M*3)),!m.spin&&i.angle&&(i.angle=$e(i.angle,C)),!m.spin3&&i.angle3&&(i.angle3=$e(i.angle3,C)),!rt()){i.angle+=m.spin*M,i.angle3+=m.spin3*M,i.phase.breathe+=m.breathe[1]*M,i.phase.ripple+=m.ripple[2]*M,i.phase.wave+=m.wave[3]*M,i.phase.shimmer+=m.shimmer[1]*M,i.phase.wobble+=m.wobble[3]*M,i.phase.spectral+=m.spectral[1]*M,i.phase.heart+=m.heart[1]/60*M,i.phase.dash+=m.dash[1]*M,i.phase.ether+=m.ether[3]*M,i.phase.pace+=m.pace*M;for(const L of Object.keys(i.phase))i.phase[L]%=oe*1e3;i.angle%=oe,i.angle3%=oe}},lo=(i,M)=>{const m=i.resolved;if(!m.anchor)return;const C=Ns.get(m.anchor);if(!C||!C.isConnected)return;const I=C.getBoundingClientRect();if(I.width===0&&I.height===0)return;const L=Math.min(I.width,I.height)/2*m.scale,O=I.left+I.width/2+m.dx*L,U=I.top+I.height/2-m.dy*L;M[0]=L*r.dpr/r.unit,M[2]=(O-v/2)/(v/2),M[3]=(x/2-U)/(x/2)},ho=i=>{const M=i.resolved.reveal;let m=1;return M==="intro"?o||K||pt.paused()?m=1:m=1-Math.pow(1-St((f-.3)/Ks),2.6):M==="arrive"?o||pt.paused()?m=1:m=i.arrivedAt==null?0:St((f-i.arrivedAt)/Qs):typeof M=="number"&&(m=M),m*qs+(m>=1?.07:0)},de=(i,M)=>{const m=Float32Array.from(i.cur);return lo(i,m),m[1]+=i.angle,m[5]+=i.angle3,m[9]=i.phase.breathe,m[12]=i.phase.ripple,m[16]=i.phase.wave,m[18]=i.phase.shimmer,m[22]=i.phase.wobble,m[27]*=M,m[32]=i.sel,m[33]=ho(i),m[36]=i.phase.heart,m[37]=i.phase.spectral,m[39]=i.selAmt*i.selAmt*(3-2*i.selAmt),m[41]=i.phase.dash,m[47]=i.phase.ether,m},ge=i=>{if(i.shapeFrom)return!0;const M=i.resolved.select>=0?i.resolved.select:-1;if(i.sel!==M||M>=0&&i.selAmt<1||!i.resolved.spin&&i.angle||!i.resolved.spin3&&i.angle3)return!0;for(let m=0;m<ie;m++)if(Math.abs(i.target[m]-i.cur[m])>.001)return!0;return!1},uo=i=>{if(!i||i.id===D)return;D=i.id;const[M,m,C]=ce(i.resolved.colors[0]);document.documentElement.style.setProperty("--field-tint",`${Math.round(M*255)} ${Math.round(m*255)} ${Math.round(C*255)}`),Gs.forEach(I=>I({sceneId:i.id,config:i.config}))};function me(i){if(l=c?requestAnimationFrame(me):0,w)return;const M=Math.min(.05,(i-h)/1e3);h=i;const m=window.scrollY,C=!rt()||T||Et.length,I=p||m!==d||pt.version()!==y;if(o&&!I&&!z&&!Et.length||!C&&!I&&!z&&g>=1||(P+=1,f+=M,rt()||(u+=M),g=o?1:Math.min(1,g+M/1.6),(pt.version()!==y||f-$>1||$<0)&&H(),d=m,y=pt.version(),p=!1,!F.length))return;F.forEach(k=>co(k,M));const L=new Map;for(const k of[E,ct,et,...F]){const j=k&&k.resolved&&k.resolved.sync;if(!j)continue;const it=L.get(j);it?it!==k&&(k.angle=it.angle,k.angle3=it.angle3,Object.assign(k.phase,it.phase)):L.set(j,k)}const O=window.innerHeight;let U=0;for(let k=1;k<F.length;k++){const j=F[k],[it,xo]=j.resolved.window;j.docTop-m<=(it+xo)/2*O&&(U=k)}A<0&&(A=U,S=U);let vt=1;!T&&Math.abs(U-A)>1.5&&!o&&(T={phase:"out",t:0}),T?(T.t+=M,T.phase==="out"?(vt=1-St(T.t/.15),T.t>=.15&&(A=U,T={phase:"in",t:0})):(vt=St(T.t/.25),A=U,T.t>=.25&&(T=null))):o?A=U:(S+=(U-S)*(1-Math.exp(-M*Hs)),A+=(S-A)*(1-Math.exp(-M*Ws)),Math.abs(U-A)<.0015&&(A=U)),(T||o)&&(S=A);const G=Math.min(F.length-1,Math.max(0,Math.floor(A))),W=Math.min(F.length-1,G+1),N=W===G?0:St(A-G),at=F[G],X=F[W];ct=at,et=X,E=N<.5?at:X;for(const k of F)if(!(k===at||k===X)&&(k.shapeFrom&&(k.shapeFrom=null,k.fromSnap=null),k.arrivedAt=null,k.live)){k.live.start=null;const j=$t[k.live.key];k.live.state=j&&j.state?j.state(k):null}const At=Math.abs(U-A)<Vs?F[Math.min(F.length-1,U)]:null;At&&(At.arrivedAt==null&&(At.arrivedAt=f),At.live&&At.live.start==null&&(At.live.start=u));const yt=pe(at,M),xt=pe(X,M);r.setShape("A",yt,!!yt.live),r.setShape("B",xt,!!xt.live),yt.live&&(yt.live=!1),xt.live&&xt!==yt&&(xt.live=!1);const J=de(at,yt.gain??1),Z=de(X,xt.gain??1);z=ge(at)||ge(X)||A!==U;const Dt=N<.5?at:X;uo(Dt);const Pt=r.dpr,Me=r.unit,Ht=k=>[k[2]*r.width*.5,k[3]*r.height*.5],fo=N<.5?J:Z;_.target=f-_.lastMove<2?_.target:0,_.strength+=(_.target-_.strength)*(1-Math.exp(-M*4));const po=(_.x-v/2)*Pt,go=(x/2-_.y)*Pt,we=Dt.resolved;for(rt()||(X.resolved.strikeOnEnter&&N>.5&&U>A-.01&&u-X.lastStrike>6&&(X.lastStrike=u,Et.push({amp:1})),we.strikeEvery>0&&u-Dt.lastStrike>we.strikeEvery&&(Dt.lastStrike=u,Et.push({amp:.8})));Et.length;){const k=Et.shift();if(rt())continue;const[j,it]=k.clientX==null?Ht(fo):[(k.clientX-v/2)*Pt,(x/2-k.clientY)*Pt];Q[0]=j,Q[1]=it,Q[2]=u,Q[3]=k.amp}const ft=(k,j)=>k+(j-k)*N,[mo,Mo]=Ht(J),[wo,vo]=Ht(Z),Ao=Me*Math.max(.2,(J[0]+Z[0])/2),yo=Math.hypot(wo-mo,vo-Mo)/Ao,ve=o?0:Math.min(.85,Math.max(0,(yo-.5)/1.2)),Ae=!!at.resolved.sync&&at.resolved.sync===X.resolved.sync;r.draw({sceneA:J,sceneB:Z,mix:N,time:rt()?12:u,stagger:o?0:js,swirl:o||Ae?0:.4*(1-ve*.7),dip:Ae?0:ve,reduced:o,baseSize:s.size,fade:g*vt,dust:b?.35:.5,pointer:[po,go,rt()?0:_.strength,.11*(Me/Pt)],strike:Q,aura:{x:ft(J[2],Z[2]),y:ft(J[3],Z[3]),radius:ft(J[0],Z[0])*1.15,r:ft(J[24],Z[24]),g:ft(J[25],Z[25]),b:ft(J[26],Z[26]),intensity:ft(J[31],Z[31])}})}return l=requestAnimationFrame(me),()=>{c=!1,cancelAnimationFrame(l),nt.disconnect(),window.removeEventListener("pointermove",Ct),document.removeEventListener("pointerleave",ut),document.removeEventListener("visibilitychange",Bt),window.removeEventListener("scroll",he),t.removeEventListener("webglcontextlost",le),window.cancelIdleCallback&&typeof ue=="number"&&window.cancelIdleCallback(ue),r.destroy()}}export{nn as BREATH,He as SCENE_DEFAULTS,rn as onSceneChange,an as registerAnchor,cn as registerScene,ln as setMotionPaused,en as startField,hn as unregisterScene,un as updateScene};
