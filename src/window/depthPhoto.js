// A photo with a depth map, drawn in WebGL so it reads as a real 3D view:
// as the viewer moves (tilt, finger, scroll), near things shift more than
// far ones. motion() returns the current {x, y} in -0.5..0.5.
// It makes its own <canvas> inside `host` (a lost WebGL context can't be
// revived, so a canvas is never reused) and removes it on stop().
// Returns stop(), or null when WebGL isn't available (caller keeps the <img>).

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// A few steps of parallax mapping: look up depth where the shifted ray
// lands, not just where it starts, so outlines don't smear as much.
const FRAGMENT = `
precision mediump float;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uCover;
uniform vec2 uOffset;
varying vec2 vUv;
void main() {
  // cover-fit, then zoom in a little so shifted edges never show
  vec2 uv = (vUv - 0.5) * uCover * 0.9 + 0.5;
  vec2 shift = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    float d = texture2D(uDepth, uv - shift).r;
    shift = uOffset * d;
  }
  gl_FragColor = texture2D(uImage, uv - shift);
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

function texture(gl, img) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return tex;
}

export function depthPhoto(host, pictureSrc, depthSrc, motion, onReady) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  host.appendChild(canvas);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.remove();
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uCover = gl.getUniformLocation(program, "uCover");
  const uOffset = gl.getUniformLocation(program, "uOffset");
  gl.uniform1i(gl.getUniformLocation(program, "uImage"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uDepth"), 1);

  let stopped = false;
  let raf = 0;
  let size = { w: 1, h: 1 };
  let ratio = 1;
  const eased = { x: 0, y: 0 };
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function frame() {
    if (stopped) return;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w !== size.w || h !== size.h) {
      size = { w, h };
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      // fit the photo like object-fit: cover
      const view = w / h;
      gl.uniform2f(uCover, view > ratio ? 1 : view / ratio, view > ratio ? ratio / view : 1);
    }
    // glide toward where the viewer is, so movement feels like a body, not a cursor
    const target = motion();
    eased.x += (target.x - eased.x) * 0.08;
    eased.y += (target.y - eased.y) * 0.08;
    gl.uniform2f(uOffset, eased.x * 0.04, eased.y * 0.04);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (!document.hidden && !stopped) raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", onVisibility);

  Promise.all([loadImage(pictureSrc), loadImage(depthSrc)])
    .then(([picture, depth]) => {
      if (stopped) return;
      ratio = picture.naturalWidth / picture.naturalHeight;
      gl.activeTexture(gl.TEXTURE0);
      texture(gl, picture);
      gl.activeTexture(gl.TEXTURE1);
      texture(gl, depth);
      size = { w: 0, h: 0 }; // force the cover fit with the real ratio
      onReady?.();
      raf = requestAnimationFrame(frame);
    })
    .catch(() => {
      // leave the plain <img> showing
    });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
}
