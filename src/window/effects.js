// What happens on and beyond the glass, drawn on a <canvas> over the blurred
// outside picture. One renderer per scene; each returns a stop() function.
// Canvas 2D on purpose: it runs on every phone, and the refraction trick
// (each drop shows a small flipped copy of what's behind it) needs no WebGL.

const rand = (a, b) => a + Math.random() * (b - a);

function setup(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  // phones have 3x screens; the scene is soft anyway, so cap the cost
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = 0;
  let h = 0;
  function resize() {
    w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      onResize(w, h);
    }
  }
  return { ctx, dpr, resize, size: () => ({ w, h }) };
}

// Runs draw(dt) every frame, pauses while the tab is hidden, and draws a
// single still frame for people who asked for less motion.
function loop(draw) {
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let last = performance.now();
  let stopped = false;
  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt, now / 1000);
    if (!still) raf = requestAnimationFrame(frame);
  }
  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!still) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(frame);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

function drawCover(ctx, img, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

// ---------------------------------------------------------------- rain air

// The weather beyond the glass when the glass itself is drawn on the GPU
// (rainGlass.js): rain falling at three distances, nearer is longer,
// fainter and quicker; and mist drifting slowly across the view so the
// distance breathes. Nothing here sits on the glass.
export function rainAir(canvas) {
  let streaks = [];
  let mists = [];

  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    streaks = Array.from({ length: Math.round(w / (4.5 * dpr)) }, () => newStreak(w, h, true));
    mists = Array.from({ length: 5 }, (_, i) => ({
      x: rand(0, 1) * w,
      y: (0.15 + i * 0.17) * h,
      r: rand(0.35, 0.6) * w,
      v: rand(6, 14) * dpr * (Math.random() < 0.5 ? -1 : 1),
      a: rand(0.05, 0.1),
    }));
  });

  function newStreak(w, h, anywhere = false) {
    const depth = Math.random(); // 0 far .. 1 near
    return {
      x: rand(-0.1, 1.1) * w,
      y: anywhere ? rand(0, h) : rand(-0.3, 0) * h,
      len: (14 + depth * depth * 90) * dpr,
      v: (420 + depth * 800) * dpr,
      alpha: 0.16 - depth * 0.1,
      width: (0.6 + depth * 1.3) * dpr,
    };
  }

  return loop((dt) => {
    resize();
    const { w, h } = size();
    ctx.clearRect(0, 0, w, h);

    // mist: soft pale bands that wander sideways
    for (const m of mists) {
      m.x += m.v * dt;
      if (m.x < -m.r) m.x = w + m.r;
      if (m.x > w + m.r) m.x = -m.r;
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      g.addColorStop(0, `rgba(214, 220, 234, ${m.a})`);
      g.addColorStop(1, "rgba(214, 220, 234, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }

    // rain, slanting a little with the wind
    ctx.lineCap = "round";
    for (let i = 0; i < streaks.length; i += 1) {
      const s = streaks[i];
      s.y += s.v * dt;
      s.x += s.v * 0.08 * dt;
      if (s.y - s.len > h) streaks[i] = newStreak(w, h);
      ctx.strokeStyle = `rgba(226, 232, 244, ${s.alpha})`;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.08, s.y - s.len);
      ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------- rain

export function rain(canvas, background) {
  const bg = document.createElement("canvas"); // what the drops refract
  const fog = document.createElement("canvas"); // a light breath on the glass
  let sliding = [];
  let streaks = []; // the rain itself, falling outside, out of focus
  let spawnIn = 0;

  // Only moving water on the glass: a drop now and then runs down,
  // wandering, wiping a clear line through the mist. Nothing sits still.
  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    for (const c of [bg, fog]) {
      c.width = w;
      c.height = h;
    }
    paintBackground();
    const f = fog.getContext("2d");
    f.fillStyle = "rgba(200, 210, 226, .08)";
    f.fillRect(0, 0, w, h);
    streaks = Array.from({ length: Math.round(w / (3 * dpr)) }, () => newStreak(w, h, true));
    sliding = [];
  });

  // the picture may still be loading on the first frame
  function paintBackground() {
    if (!background.complete || !background.naturalWidth) return;
    drawCover(bg.getContext("2d"), background, bg.width, bg.height);
  }
  background.addEventListener("load", paintBackground);

  function newStreak(w, h, anywhere = false) {
    const near = Math.random() < 0.25; // nearer rain: longer, faster, fainter
    return {
      x: rand(-0.1, 1.1) * w,
      y: anywhere ? rand(0, h) : rand(-0.3, 0) * h,
      len: (near ? rand(60, 110) : rand(18, 40)) * dpr,
      v: (near ? rand(900, 1200) : rand(500, 750)) * dpr,
      alpha: near ? rand(0.06, 0.12) : rand(0.1, 0.22),
      width: (near ? 1.6 : 0.8) * dpr,
    };
  }

  // a round drop, or a teardrop whose tip points up the way it came
  function dropPath(c, x, y, r, tail) {
    c.beginPath();
    if (!tail) {
      c.arc(x, y, r, 0, Math.PI * 2);
      return;
    }
    const top = y - r * (1 + tail * 1.6);
    c.moveTo(x, top);
    c.bezierCurveTo(x + r * 0.25, y - r * (0.9 + tail), x + r, y - r * 0.55, x + r, y);
    c.arc(x, y, r, 0, Math.PI);
    c.bezierCurveTo(x - r, y - r * 0.55, x - r * 0.25, y - r * (0.9 + tail), x, top);
    c.closePath();
  }

  function drawDrop(c, x, y, r, tail = 0) {
    if (r < 1.5 * dpr) {
      // mist-fine: just a glint and a hairline edge
      c.fillStyle = "rgba(255, 255, 255, .18)";
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(255, 255, 255, .75)";
      c.beginPath();
      c.arc(x - r * 0.3, y - r * 0.3, Math.max(0.4, r * 0.35), 0, Math.PI * 2);
      c.fill();
      return;
    }
    // a clear little lens: the street behind it, upside down and shrunk
    c.save();
    dropPath(c, x, y, r, tail);
    c.clip();
    c.translate(x, y);
    c.scale(-1, -1);
    const span = r * 6;
    c.drawImage(bg, x - span / 2, y - span / 2, span, span, -r * 1.05, -r * 1.05, r * 2.1, r * 2.1);
    c.restore();
    // a bit brighter than what's around it
    c.save();
    dropPath(c, x, y, r, tail);
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255, 255, 255, .07)";
    c.fill();
    c.restore();
    // thin dark outline where the glass bends the light away
    dropPath(c, x, y, r, tail);
    c.lineWidth = Math.max(0.6, r * 0.12);
    c.strokeStyle = "rgba(15, 18, 26, .38)";
    c.stroke();
    // light caught along the bottom inside edge
    c.beginPath();
    c.arc(x, y, r * 0.76, Math.PI * 0.18, Math.PI * 0.82);
    c.lineWidth = Math.max(0.6, r * 0.14);
    c.strokeStyle = "rgba(255, 250, 235, .45)";
    c.stroke();
    // and a sharp highlight up top
    c.fillStyle = "rgba(255, 255, 255, .9)";
    c.beginPath();
    c.ellipse(x - r * 0.32, y - r * 0.38, Math.max(0.5, r * 0.2), Math.max(0.4, r * 0.13), -0.6, 0, Math.PI * 2);
    c.fill();
  }

  const stop = loop((dt) => {
    resize();
    const { w, h } = size();

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnIn = rand(1.2, 3.2);
      sliding.push({
        x: rand(0.05, 0.95) * w,
        y: rand(-20, h * 0.4),
        r: rand(3, 5.5) * dpr,
        v: rand(30, 60) * dpr,
        amp: rand(2, 8) * dpr,
        freq: rand(0.01, 0.03) / dpr,
        phase: rand(0, Math.PI * 2),
      });
    }

    const f = fog.getContext("2d");
    // the glass slowly mists back up
    f.globalCompositeOperation = "source-over";
    f.fillStyle = "rgba(200, 210, 226, .002)";
    f.fillRect(0, 0, w, h);
    f.globalCompositeOperation = "destination-out";
    f.lineCap = "round";
    f.strokeStyle = "rgba(0,0,0,.6)";

    for (const d of sliding) {
      d.v = Math.min(d.v + 140 * dpr * dt, 260 * dpr);
      const px = d.x;
      const py = d.y;
      d.y += d.v * dt;
      // it wanders a little as it picks its way down
      d.x += Math.cos(d.y * d.freq + d.phase) * d.amp * d.freq * d.v * dt + rand(-0.6, 0.6) * dpr;
      // and wipes a clear line through the mist
      f.lineWidth = d.r * 0.7;
      f.beginPath();
      f.moveTo(px, py);
      f.lineTo(d.x, d.y);
      f.stroke();
    }
    sliding = sliding.filter((d) => d.y - d.r < h);

    ctx.clearRect(0, 0, w, h);

    // the rain coming down out there, slanting a little in the wind
    const slant = 0.12;
    ctx.lineCap = "round";
    for (let i = 0; i < streaks.length; i += 1) {
      const r = streaks[i];
      r.y += r.v * dt;
      r.x += r.v * slant * dt;
      if (r.y - r.len > h) streaks[i] = newStreak(w, h);
      ctx.strokeStyle = `rgba(225, 232, 242, ${r.alpha})`;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.len * slant, r.y - r.len);
      ctx.stroke();
    }

    ctx.drawImage(fog, 0, 0);
    for (const d of sliding) drawDrop(ctx, d.x, d.y, d.r, 0.9);
  });

  return () => {
    stop();
    background.removeEventListener("load", paintBackground);
  };
}

// ---------------------------------------------------------------- snow

function softDot(radius, color) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// A six-armed snow crystal with little side branches, drawn once and reused.
function crystal(size, seed) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const r = size * 0.42;
  const rnd = (k) => {
    const v = Math.sin(seed * 97.1 + k * 13.7) * 43758.5;
    return v - Math.floor(v);
  };
  // the same branching on every arm, like a real crystal
  const branches = [0.35, 0.58, 0.8].map((at, i) => ({ at, len: 0.18 + rnd(i) * 0.22 }));
  g.translate(size / 2, size / 2);
  g.strokeStyle = "#ffffff";
  g.lineCap = "round";
  g.shadowColor = "rgba(255,255,255,.9)";
  g.shadowBlur = size * 0.04;
  for (let arm = 0; arm < 6; arm += 1) {
    g.save();
    g.rotate((arm * Math.PI) / 3);
    g.lineWidth = size * 0.045;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -r);
    g.stroke();
    g.lineWidth = size * 0.03;
    for (const br of branches) {
      const y = -r * br.at;
      const len = r * br.len;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(len * 0.8, y - len * 0.6);
      g.moveTo(0, y);
      g.lineTo(-len * 0.8, y - len * 0.6);
      g.stroke();
    }
    g.restore();
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(0, 0, size * 0.06, 0, Math.PI * 2);
  g.fill();
  return c;
}

// Ice crust on the glass, drawn once: rime is thickest along the bottom
// and the edges.
function frost(w, h, dpr) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const speck = softDot(8, "rgba(255,255,255,1)");
  const fade = (v) => Math.max(0, v); // 1 right at the edge, 0 past the reach
  const count = Math.round((w * h) / (30 * dpr * dpr));
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const near = Math.max(
      (y / h) ** 6,
      fade(1 - Math.min(x, w - x) / (w * 0.16)) ** 2,
      fade(1 - Math.min(y, h - y) / (h * 0.08)) ** 2
    );
    if (Math.random() > near) continue;
    const r = rand(0.6, 3.2) * dpr;
    g.globalAlpha = rand(0.25, 0.85);
    g.drawImage(speck, x - r, y - r, r * 2, r * 2);
  }
  return c;
}

export function snow(canvas) {
  let flakes = [];
  let stuck = [];
  let stickIn = 0;
  let rime = null;
  const sprite = softDot(32, "rgba(255,255,255,.95)");
  const crystals = [1, 2, 3, 4, 5].map((seed) => crystal(96, seed));
  // outside the glass: far, middle and near; the near ones big and blurred
  const layers = [
    { share: 0.55, r: [0.9, 1.8], fall: [18, 30], alpha: 0.7 },
    { share: 0.35, r: [2.2, 3.6], fall: [30, 48], alpha: 0.85 },
    { share: 0.06, r: [9, 18], fall: [46, 70], alpha: 0.4 },
  ];

  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    const total = Math.round((w * h) / (1500 * dpr * dpr));
    flakes = [];
    for (const layer of layers) {
      for (let i = 0; i < total * layer.share; i += 1) {
        flakes.push({
          layer,
          x: rand(0, w),
          y: rand(0, h),
          r: rand(...layer.r) * dpr,
          v: rand(...layer.fall) * dpr,
          phase: rand(0, Math.PI * 2),
        });
      }
    }
    // a few real crystals drifting right past the glass, in focus
    for (let i = 0; i < Math.round(w / (60 * dpr)); i += 1) {
      flakes.push({
        crystal: crystals[i % crystals.length],
        x: rand(0, w),
        y: rand(0, h),
        r: rand(5, 9) * dpr,
        v: rand(22, 36) * dpr,
        phase: rand(0, Math.PI * 2),
        spin: rand(-0.4, 0.4),
      });
    }
    stuck = [];
    for (let i = 0; i < Math.round((w * h) / (14000 * dpr * dpr)); i += 1) stuck.push(newStuck(w, h, 1));
    rime = frost(w, h, dpr);
  });

  // flakes that land on the glass and stay, crisp, slowly piling up
  function newStuck(w, h, grown = 0) {
    return {
      crystal: crystals[Math.floor(Math.random() * crystals.length)],
      x: rand(0, w),
      y: rand(0, h) ** 1.15 / h ** 0.15, // a few more toward the bottom
      r: rand(4, 11) * dpr,
      angle: rand(0, Math.PI / 3),
      grown,
    };
  }

  return loop((dt, t) => {
    resize();
    const { w, h } = size();
    ctx.clearRect(0, 0, w, h);
    const wind = Math.sin(t * 0.25) * 10 * dpr;

    for (const f of flakes) {
      f.y += f.v * dt;
      f.x += (wind + Math.sin(t * 0.8 + f.phase) * 8 * dpr) * dt;
      if (f.y - f.r > h) {
        f.y = -f.r;
        f.x = rand(0, w);
      }
      if (f.x < -f.r) f.x = w + f.r;
      if (f.x > w + f.r) f.x = -f.r;
      if (f.crystal) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.translate(f.x, f.y);
        ctx.rotate(t * f.spin + f.phase);
        ctx.drawImage(f.crystal, -f.r, -f.r, f.r * 2, f.r * 2);
        ctx.restore();
      } else {
        ctx.globalAlpha = f.layer.alpha;
        ctx.drawImage(sprite, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      }
    }

    stickIn -= dt;
    if (stickIn <= 0 && stuck.length < (w * h) / (7000 * dpr * dpr)) {
      stickIn = rand(0.8, 2.2);
      stuck.push(newStuck(w, h));
    }
    for (const s of stuck) {
      s.grown = Math.min(1, s.grown + dt * 0.8); // fades in as it settles
      ctx.save();
      ctx.globalAlpha = 0.92 * s.grown;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.drawImage(s.crystal, -s.r, -s.r, s.r * 2, s.r * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (rime) ctx.drawImage(rime, 0, 0);
  });
}

// ---------------------------------------------------------------- sunny day

export function day(canvas) {
  let motes = [];
  const sprite = softDot(16, "rgba(255,246,220,.9)");
  const beams = [
    { at: 0.18, width: 0.16, alpha: 0.16, speed: 0.13 },
    { at: 0.42, width: 0.1, alpha: 0.12, speed: 0.19 },
    { at: 0.6, width: 0.2, alpha: 0.14, speed: 0.09 },
    { at: 0.86, width: 0.08, alpha: 0.1, speed: 0.23 },
  ];

  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    motes = Array.from({ length: Math.round((w * h) / (9000 * dpr * dpr)) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.8, 2.2) * dpr,
      vx: rand(-4, 4) * dpr,
      vy: rand(-6, 2) * dpr,
      phase: rand(0, Math.PI * 2),
    }));
  });

  return loop((dt, t) => {
    resize();
    const { w, h } = size();
    ctx.clearRect(0, 0, w, h);

    // sunlight slanting in from the top right
    ctx.globalCompositeOperation = "lighter";
    for (const b of beams) {
      const a = b.alpha * (0.75 + 0.25 * Math.sin(t * b.speed * 6));
      const x0 = w * (b.at + 0.55);
      const x1 = w * (b.at - 0.35);
      const half = (w * b.width) / 2;
      const grad = ctx.createLinearGradient(x0, 0, x1, h);
      grad.addColorStop(0, `rgba(255, 244, 210, ${a})`);
      grad.addColorStop(1, "rgba(255, 244, 210, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x0 - half, 0);
      ctx.lineTo(x0 + half, 0);
      ctx.lineTo(x1 + half * 2.2, h);
      ctx.lineTo(x1 - half * 2.2, h);
      ctx.closePath();
      ctx.fill();
    }

    // dust floating in the light
    for (const m of motes) {
      m.x += (m.vx + Math.sin(t * 0.5 + m.phase) * 3 * dpr) * dt;
      m.y += (m.vy + Math.cos(t * 0.4 + m.phase) * 2 * dpr) * dt;
      if (m.y < -4) m.y = h + 4;
      if (m.y > h + 4) m.y = -4;
      if (m.x < -4) m.x = w + 4;
      if (m.x > w + 4) m.x = -4;
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.3 + m.phase);
      ctx.drawImage(sprite, m.x - m.r * 2, m.y - m.r * 2, m.r * 4, m.r * 4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  });
}

// ---------------------------------------------------------------- clear night

export function night(canvas, _picture, { sky: skySrc } = {}) {
  let stars = [];
  let meteors = [];
  let nextMeteor = 1.5;
  const moon = document.createElement("canvas");
  // everything up there is drawn on its own layer, then cut to the sky so
  // it stays behind the branches (the moon can peek through them)
  const layer = document.createElement("canvas");
  const mask = new Image();
  if (skySrc) mask.src = skySrc;

  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    layer.width = w;
    layer.height = h;
    stars = Array.from({ length: Math.round((w * h) / (1500 * dpr * dpr)) }, () => ({
      x: rand(0, w),
      y: h * 0.72 * Math.random() ** 1.4, // thicker near the top
      r: rand(0.4, 1.5) * dpr,
      phase: rand(0, Math.PI * 2),
      speed: rand(0.6, 2.2),
    }));
    // a thin crescent, cut on its own canvas so the cut doesn't erase stars
    const r = 18 * dpr;
    moon.width = moon.height = Math.ceil(r * 6);
    const m = moon.getContext("2d");
    const c = r * 3;
    const halo = m.createRadialGradient(c, c, r * 0.6, c, c, r * 3);
    halo.addColorStop(0, "rgba(255, 240, 200, .22)");
    halo.addColorStop(1, "rgba(255, 240, 200, 0)");
    m.fillStyle = halo;
    m.fillRect(0, 0, moon.width, moon.height);
    m.fillStyle = "#fff3cf";
    m.beginPath();
    m.arc(c, c, r, 0, Math.PI * 2);
    m.fill();
    m.globalCompositeOperation = "destination-out";
    m.beginPath();
    m.arc(c + r * 0.42, c - r * 0.18, r * 0.88, 0, Math.PI * 2);
    m.fill();
    meteors = [];
  });

  return loop((dt, t) => {
    resize();
    const { w, h } = size();
    ctx.clearRect(0, 0, w, h);
    const sky = layer.getContext("2d");
    sky.globalCompositeOperation = "source-over";
    sky.clearRect(0, 0, w, h);

    for (const s of stars) {
      sky.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * s.speed + s.phase));
      sky.fillStyle = "#fffaf0";
      sky.beginPath();
      sky.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sky.fill();
    }
    sky.globalAlpha = 1;
    sky.drawImage(moon, w * 0.68 - moon.width / 2, h * 0.2 - moon.height / 2);

    // a meteor shower: one every few seconds, sliding down to the left
    nextMeteor -= dt;
    if (nextMeteor <= 0) {
      nextMeteor = rand(1.8, 5.5);
      meteors.push({
        x: rand(w * 0.3, w * 1.1),
        y: rand(-h * 0.05, h * 0.3),
        len: rand(90, 200) * dpr,
        v: rand(520, 820) * dpr,
        life: 0,
        ttl: rand(0.6, 1.1),
      });
    }
    const angle = Math.PI * 0.78; // heading down-left
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (const m of meteors) {
      m.life += dt;
      m.x += dx * m.v * dt;
      m.y += dy * m.v * dt;
      const fade = Math.sin(Math.min(1, m.life / m.ttl) * Math.PI);
      const tx = m.x - dx * m.len;
      const ty = m.y - dy * m.len;
      const grad = sky.createLinearGradient(m.x, m.y, tx, ty);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      sky.strokeStyle = grad;
      sky.lineWidth = 1.6 * dpr;
      sky.lineCap = "round";
      sky.beginPath();
      sky.moveTo(m.x, m.y);
      sky.lineTo(tx, ty);
      sky.stroke();
    }
    meteors = meteors.filter((m) => m.life < m.ttl);

    if (mask.complete && mask.naturalWidth) {
      sky.globalCompositeOperation = "destination-in";
      drawCover(sky, mask, w, h);
    }
    ctx.drawImage(layer, 0, 0);
  });
}
