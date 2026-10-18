// Water on the window, worked out per pixel on the GPU.
//
// The idea (a field of drops that refract the view, and drops that run
// down in fits and starts, wiping a clear trail through the mist) is
// after "Heartfelt" by Martijn Steinrucken (BigWings) on Shadertoy; this
// is our own, simpler code, tuned for a quiet blue-grey evening.
//
// No outline is drawn anywhere. A drop is a little lens: near its middle
// it shows the view barely moved, toward its rim the view swings far and
// flips, so the rim picks up darker or brighter bits of the scene on its
// own, the way real drops do.
//
// rainGlass(host, pictureSrc) puts a transparent canvas in `host` and
// returns stop(), or null without WebGL (the caller falls back to the
// canvas rain).

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uSharp;
uniform sampler2D uSoft;
uniform vec2 uRes;
uniform vec2 uCover;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// the view, fitted like the 3D photo underneath (cover, zoomed a little)
vec2 sceneUv(vec2 uv) {
  vec2 s = (uv - 0.5) * uCover * 0.9 + 0.5;
  return vec2(s.x, 1.0 - s.y);
}

// small drops that gather on the glass, swell, then dry away: a lens
// normal (xy) and how much drop is here (z)
vec3 beads(vec2 p, float cells, float t, float sizeMin, float sizeMax, float share) {
  vec2 g = p * cells;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  if (h > share) return vec3(0.0);
  vec2 c = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.5;
  float life = fract(t * (0.03 + 0.05 * hash(id + 1.3)) + h * 7.0);
  float grow = smoothstep(0.0, 0.25, life) * smoothstep(1.0, 0.75, life);
  float r = mix(sizeMin, sizeMax, hash(id + 5.2)) * (0.55 + 0.45 * grow);
  vec2 d = (f - c) * vec2(1.0, 1.08);
  float dist = length(d);
  float m = smoothstep(r, r * 0.72, dist) * grow;
  return vec3(d / r * m, m);
}

// where a running drop is on its way down: it hangs, then slips, a few
// times on the way, never at one speed
float slip(float x, float k) {
  return x - sin(x * 6.2831 * k) / (6.2831 * k) * 0.92;
}

float wander(float y, float h) {
  return sin(y * 9.0 + h * 6.28) * 0.5 + sin(y * 23.0 + h * 2.0) * 0.18;
}

// drops that run: lens (xy), drop (z), and the clear trail behind (w)
vec4 runners(vec2 p, float t, float aspect) {
  float cols = 6.0;
  float cw = aspect / cols;
  float col = floor(p.x / cw);
  float h = hash(vec2(col, 4.7));
  float speed = 0.06 + 0.06 * h;
  float run = t * speed + h * 13.0;
  float cycle = floor(run);
  // not every column has a drop every time: the glass stays calm
  float on = step(0.35, hash(vec2(col, cycle)));
  float k = 3.0 + floor(hash(vec2(col, cycle + 0.5)) * 3.0);
  float y = 1.12 - 1.3 * slip(fract(run), k);
  float centre = (col + 0.5) * cw;
  float sway = cw * 0.22;
  float x = centre + wander(y, h) * sway;
  float r = cw * (0.24 + 0.08 * hash(vec2(col, cycle + 1.7)));

  // the drop: rounder on top, heavier below
  vec2 d = p - vec2(x, y);
  d.y *= d.y < 0.0 ? 0.78 : 1.12;
  float dist = length(d);
  float m = smoothstep(r, r * 0.7, dist) * on;
  vec2 n = d / r * m;

  // the trail: wiped clear along the path it took, closing up again
  // further back
  float above = p.y - y;
  float px = centre + wander(p.y, h) * sway;
  float lane = smoothstep(r * 0.66, r * 0.12, abs(p.x - px));
  float trail = lane * smoothstep(-0.01, 0.03, above) * exp(-max(above, 0.0) * 2.2) * on;
  trail *= step(above, 1.4);

  // little drops it leaves behind in the trail
  float step_ = cw * 0.55;
  float cy = floor(p.y / step_);
  float th = hash(vec2(col, cy + cycle * 13.0));
  float ty = (cy + 0.5) * step_ + (th - 0.5) * step_ * 0.3;
  vec2 td = p - vec2(centre + wander(ty, h) * sway, ty);
  float tr = r * (0.25 + 0.2 * th);
  float tm = smoothstep(tr, tr * 0.7, length(td)) * step(0.5, th) * smoothstep(0.0, 0.05, ty - y) * trail * 1.6;
  n += td / tr * min(tm, 1.0);
  m = max(m, min(tm, 1.0));

  return vec4(n, m, trail);
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float t = uTime;

  vec3 small = beads(p, 24.0, t, 0.10, 0.24, 0.28);
  vec3 tiny = beads(p + 0.37, 58.0, t * 1.3, 0.12, 0.3, 0.16);
  vec4 run = runners(p, t, aspect);

  vec2 n = small.xy * 0.9 + tiny.xy * 0.5 + run.xy;
  float drop = clamp(max(max(small.z, tiny.z), run.z), 0.0, 1.0);
  float clear = clamp(run.w, 0.0, 1.0);

  // a lens flips and spreads what's behind it
  vec2 offset = -n * vec2(1.0 / aspect, 1.0) * 0.045;
  vec3 seen = texture2D(uSharp, sceneUv(vUv + offset)).rgb;
  float edge = clamp(length(n), 0.0, 1.0);
  seen *= 1.04 - 0.12 * edge * edge;
  // a soft catch of light up and to the left, never a hard dot
  float glint = smoothstep(0.55, 0.0, length(n - vec2(-0.35, 0.42))) * drop;
  seen += glint * 0.22;

  // the mist: the view softened, a little milkier
  vec3 mist = texture2D(uSoft, sceneUv(vUv)).rgb;
  mist = mix(mist, vec3(0.80, 0.83, 0.88), 0.26);
  float mistA = 0.5 * (1.0 - clear);

  // the wet lane a drop leaves: clear of mist, a thin film of water that
  // sharpens the view and catches a little light
  vec3 lane = texture2D(uSharp, sceneUv(vUv)).rgb * 1.12 + 0.02;
  float film = clear * 0.85;

  vec3 col = mix(mist, lane, film / max(mistA + film, 0.001));
  float a = max(mistA, film);
  col = mix(col, seen, drop);
  a = max(a, drop);
  gl_FragColor = vec4(col * a, a);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function texture(gl, source) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  return tex;
}

// the mist's colour: the view shrunk right down and stretched back up
function softened(img) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(img.naturalWidth / 28));
  c.height = Math.max(2, Math.round(img.naturalHeight / 28));
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function rainGlass(host, pictureSrc) {
  const canvas = document.createElement("canvas");
  canvas.className = "window-rainglass";
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  host.appendChild(canvas);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, "uRes");
  const uCover = gl.getUniformLocation(program, "uCover");
  const uTime = gl.getUniformLocation(program, "uTime");
  gl.uniform1i(gl.getUniformLocation(program, "uSharp"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uSoft"), 1);

  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // drops are soft things; three-quarter resolution is plenty and keeps
  // phones cool
  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
  let ratio = 1;
  let size = { w: 0, h: 0 };
  let ready = false;
  let stopped = false;
  let raf = 0;
  const start = performance.now() - 40000; // begin mid-shower, not on a dry pane

  function frame(now) {
    if (stopped) return;
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (w !== size.w || h !== size.h) {
      size = { w, h };
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      const view = w / h;
      gl.uniform2f(uCover, view > ratio ? 1 : view / ratio, view > ratio ? ratio / view : 1);
    }
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!still && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (!document.hidden && !stopped && ready && !still) raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", onVisibility);

  loadImage(pictureSrc)
    .then((img) => {
      if (stopped) return;
      ratio = img.naturalWidth / img.naturalHeight;
      gl.activeTexture(gl.TEXTURE0);
      texture(gl, img);
      gl.activeTexture(gl.TEXTURE1);
      texture(gl, softened(img));
      ready = true;
      raf = requestAnimationFrame(frame);
    })
    .catch(() => {});

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
}
