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

// ---------------------------------------------------------------- rain

export function rain(canvas, background) {
  const bg = document.createElement("canvas"); // what the drops refract
  const fog = document.createElement("canvas"); // breath on the glass
  const beads = document.createElement("canvas"); // the many resting drops
  let resting = [];
  let sliding = [];
  let beadsDirty = true;
  let spawnIn = 0;
  let redrawIn = 0;

  const { ctx, dpr, resize, size } = setup(canvas, (w, h) => {
    for (const c of [bg, fog, beads]) {
      c.width = w;
      c.height = h;
    }
    paintBackground();
    const f = fog.getContext("2d");
    f.fillStyle = "rgba(196, 208, 226, .2)";
    f.fillRect(0, 0, w, h);
    resting = [];
    const count = Math.round((w * h) / (380 * dpr * dpr));
    for (let i = 0; i < count; i += 1) resting.push(newBead(w, h));
    sliding = [];
    beadsDirty = true;
  });

  // the picture may still be loading on the first frame
  function paintBackground() {
    if (!background.complete || !background.naturalWidth) return;
    drawCover(bg.getContext("2d"), background, bg.width, bg.height);
    beadsDirty = true;
  }
  background.addEventListener("load", paintBackground);

  function newBead(w, h) {
    // mostly mist-fine droplets, a few fat ones
    const big = Math.random() < 0.07;
    return {
      x: rand(0, w),
      y: rand(0, h),
      r: (big ? rand(2.6, 6.5) : rand(0.5, 2)) * dpr,
    };
  }

  function drawDrop(c, x, y, r) {
    if (r > 2.2 * dpr) {
      // a little lens: the world behind it, upside down and squeezed
      c.save();
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.clip();
      c.translate(x, y);
      c.scale(1, -1);
      const span = r * 7;
      c.drawImage(bg, x - span / 2, y - span / 2, span, span, -r, -r, r * 2, r * 2);
      c.restore();
    }
    const rim = c.createRadialGradient(x, y, r * 0.35, x, y, r);
    rim.addColorStop(0, "rgba(10, 14, 24, 0)");
    rim.addColorStop(1, `rgba(10, 14, 24, ${r > 2.2 * dpr ? 0.42 : 0.22})`);
    c.fillStyle = rim;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(255, 255, 255, ${r > 2.2 * dpr ? 0.55 : 0.35})`;
    c.beginPath();
    c.arc(x - r * 0.35, y - r * 0.4, Math.max(0.5, r * 0.22), 0, Math.PI * 2);
    c.fill();
  }

  function renderBeads() {
    const { w, h } = size();
    const c = beads.getContext("2d");
    c.clearRect(0, 0, w, h);
    for (const b of resting) drawDrop(c, b.x, b.y, b.r);
    beadsDirty = false;
  }

  const fogCtx = () => fog.getContext("2d");

  const stop = loop((dt) => {
    resize();
    const { w, h } = size();

    // new rain landing on the glass: drawn straight onto the bead layer,
    // only a full redraw when running drops have swept some away
    const beadCtx = beads.getContext("2d");
    for (let i = 0; i < 3; i += 1) {
      if (resting.length < (w * h) / (320 * dpr * dpr)) {
        const b = newBead(w, h);
        resting.push(b);
        if (!beadsDirty) drawDrop(beadCtx, b.x, b.y, b.r);
      }
    }

    // now and then a heavy drop lets go and runs down
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnIn = rand(0.5, 1.6);
      sliding.push({
        x: rand(0, w),
        y: rand(-20, h * 0.5),
        r: rand(2.6, 5) * dpr,
        v: rand(30, 60) * dpr,
        sway: rand(0, Math.PI * 2),
        trail: 0,
      });
    }

    const f = fogCtx();
    // the glass slowly fogs back up
    f.globalCompositeOperation = "source-over";
    f.fillStyle = "rgba(196, 208, 226, .004)";
    f.fillRect(0, 0, w, h);

    for (const d of sliding) {
      d.v = Math.min(d.v + 140 * dpr * dt, 260 * dpr);
      d.sway += dt * rand(2, 6);
      const px = d.x;
      const py = d.y;
      // water never runs straight: it wanders as it picks its way down
      d.x += (Math.sin(d.sway) * 22 + rand(-30, 30)) * dpr * dt;
      d.y += d.v * dt;

      // it wipes a clear path through the fog...
      f.globalCompositeOperation = "destination-out";
      f.lineCap = "round";
      f.lineWidth = d.r * 0.8;
      f.strokeStyle = "rgba(0,0,0,.55)";
      f.beginPath();
      f.moveTo(px, py);
      f.lineTo(d.x, d.y);
      f.stroke();

      // ...swallows the droplets it meets...
      const before = resting.length;
      resting = resting.filter((b) => Math.hypot(b.x - d.x, b.y - d.y) > d.r + b.r);
      if (resting.length !== before) {
        d.r = Math.min(d.r + 0.15 * dpr * (before - resting.length), 9 * dpr);
        beadsDirty = true;
      }

      // ...and leaves a few small ones behind it
      d.trail += d.v * dt;
      if (d.trail > 18 * dpr) {
        d.trail = 0;
        const b = { x: d.x + rand(-1, 1) * dpr, y: d.y - d.r * 1.5, r: rand(0.8, 2) * dpr };
        resting.push(b);
        if (!beadsDirty) drawDrop(beads.getContext("2d"), b.x, b.y, b.r);
      }
    }
    sliding = sliding.filter((d) => d.y - d.r < h);

    redrawIn -= dt;
    if (beadsDirty && redrawIn <= 0) {
      renderBeads();
      redrawIn = 0.12;
    }

    // the outside picture itself is the <img> under this canvas (so it can
    // drift for depth); here we only add what's on the glass
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(fog, 0, 0);
    ctx.drawImage(beads, 0, 0);
    for (const d of sliding) {
      // a running drop is stretched a little along its path
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.scale(1, 1.25);
      drawDrop(ctx, 0, 0, d.r);
      ctx.restore();
    }
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

export function snow(canvas) {
  let flakes = [];
  const sprite = softDot(32, "rgba(255,255,255,.95)");
  // far, middle and near: near flakes are big, slow-looking and out of focus
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
  });

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
      ctx.globalAlpha = f.layer.alpha;
      ctx.drawImage(sprite, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    ctx.globalAlpha = 1;
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
