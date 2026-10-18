import React, { useEffect, useRef, useState } from "react";
// 曦曦's drawing of the two of us, cheek to cheek
import foxes from "./assets/splash/foxes.webp";
import heart from "./assets/splash/heart.webp";
import "@fontsource/la-belle-aurore/400.css";
import dayPic from "./assets/window/day.webp";
import rainPic from "./assets/window/rain.webp";
import snowPic from "./assets/window/snow.webp";
import nightPic from "./assets/window/night.webp";

// Opening screen: a cold window fogged with condensation — uneven mist
// over the whole glass, tiny beads, a few old runs — and a fingertip draws
// the two little foxes, a heart and our names into it. The finger lines
// are wiped clear, so the view outside shows through them sharp. Then the
// mist slowly thins and the page comes through. Shown once per browser
// session; a tap skips it.
const SEEN_KEY = "fox-splash-seen";
const pictures = { day: dayPic, rain: rainPic, snow: snowPic, night: nightPic };

const FOXES_AT = 0.6;
const FOXES_TIME = 1.4;
const HEART_AT = 2.1;
const SIGN_AT = 2.5;
const SIGN_TIME = 1.6;
const LIFT_AT = SIGN_AT + SIGN_TIME + 1.0; // the mist starts to thin
const LIFT_TIME = 1.8;
// hand over to the page while the mist is still thinning, so it comes
// through gradually (the CSS fade overlaps the lift)
const HOLD = LIFT_AT + 0.5;
const SIGNATURE = "Wangshu & Xi";

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cover(ctx, img, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// A cheap, everywhere-supported blur: shrink, then scale back up smoothly.
// Pass the two canvases to reuse them frame after frame.
function softened(source, w, h, factor, small, out = canvas(w, h)) {
  small = small || canvas(Math.max(1, Math.round(w / factor)), Math.max(1, Math.round(h / factor)));
  const s = small.getContext("2d");
  s.imageSmoothingQuality = "high";
  s.clearRect(0, 0, small.width, small.height);
  s.drawImage(source, 0, 0, small.width, small.height);
  const o = out.getContext("2d");
  o.imageSmoothingQuality = "high";
  o.clearRect(0, 0, w, h);
  o.drawImage(small, 0, 0, w, h);
  return out;
}

// Only the drawn lines (the dark ink), not the blush: a finger in the fog
// leaves lines, not colour.
function inkOnly(img, w, h) {
  const c = canvas(w, h);
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    if (lum > 150) px[i + 3] = 0;
  }
  g.putImageData(data, 0, 0);
  return c;
}

// The drawing as a fingertip-wide stroke: its lines, thickened.
function fingerStroke(img, w, h, thickness) {
  img = inkOnly(img, w, h);
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const steps = 10;
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    g.drawImage(img, Math.cos(a) * thickness, Math.sin(a) * thickness, w, h);
  }
  return c;
}


const rand = (a, b) => a + Math.random() * (b - a);

// Soft, blotchy noise as an alpha mask: random cells, scaled up smoothly.
function blotches(w, h, cell, lo, hi) {
  const sw = Math.max(2, Math.round(w / cell));
  const sh = Math.max(2, Math.round(h / cell));
  const small = canvas(sw, sh);
  const g = small.getContext("2d");
  const data = g.createImageData(sw, sh);
  for (let i = 0; i < sw * sh; i += 1) {
    data.data[i * 4] = data.data[i * 4 + 1] = data.data[i * 4 + 2] = 255;
    data.data[i * 4 + 3] = Math.round(255 * rand(lo, hi));
  }
  g.putImageData(data, 0, 0);
  const out = canvas(w, h);
  const o = out.getContext("2d");
  o.imageSmoothingQuality = "high";
  o.drawImage(small, 0, 0, w, h);
  return out;
}

// Everything that makes the glass look fogged rather than just blurred:
// the mist's colour (the view itself, softened and lifted), how thick it
// is from place to place, a fine grain, condensation beads, old runs.
// the colour of the fog for each view: pale by day, but at night it's the
// dark of the room, so opening the page doesn't flash like a camera
export const fogTones = {
  day: [190, 186, 198],
  rain: [96, 98, 112],
  snow: [150, 138, 152],
  night: [36, 40, 60],
};
const fogLight = { day: 0.24, rain: 0.2, snow: 0.22, night: 0.12 };

function condensation(sharp, w, h, dpr, scene) {
  // colour: the outside, defocused, with light bleeding through
  const color = softened(sharp, w, h, 26);
  const cg = color.getContext("2d");
  cg.fillStyle = `rgba(244, 242, 247, ${fogLight[scene] ?? 0.42})`;
  cg.fillRect(0, 0, w, h);
  // a bright sky behind fog still glares; dim it like a room with the
  // lights off, so the opening never feels like a flash
  if (scene === "day") {
    cg.fillStyle = "rgba(70, 58, 80, .16)";
    cg.fillRect(0, 0, w, h);
  }

  // thickness: two scales of blotches multiplied, a little heavier low
  // down where condensation gathers; drawn larger than the screen so it
  // can drift slowly
  const dw = Math.round(w * 1.2);
  const dh = Math.round(h * 1.2);
  const density = blotches(dw, dh, 70 * dpr, 0.55, 1);
  const dg = density.getContext("2d");
  dg.globalCompositeOperation = "destination-in";
  dg.drawImage(blotches(dw, dh, 18 * dpr, 0.78, 1), 0, 0);
  const lean = dg.createLinearGradient(0, 0, 0, dh);
  lean.addColorStop(0, "rgba(255,255,255,.8)");
  lean.addColorStop(1, "rgba(255,255,255,1)");
  dg.fillStyle = lean;
  dg.fillRect(0, 0, dw, dh);

  // grain: the mist is made of specks, not a flat colour
  const grain = canvas(w, h);
  const gg = grain.getContext("2d");
  for (let i = 0; i < (w * h) / (10 * dpr * dpr); i += 1) {
    const light = Math.random() < 0.7;
    gg.fillStyle = light ? `rgba(255,255,255,${rand(0.05, 0.2)})` : `rgba(40,40,52,${rand(0.03, 0.08)})`;
    const r = rand(0.4, 1.1) * dpr;
    gg.fillRect(rand(0, w), rand(0, h), r, r);
  }

  // condensation beads: thousands of tiny lenses, a few bigger ones
  const beads = canvas(w, h);
  const bg = beads.getContext("2d");
  const bead = (x, y, r) => {
    if (r > 1.6 * dpr) {
      bg.save();
      bg.beginPath();
      bg.arc(x, y, r, 0, Math.PI * 2);
      bg.clip();
      bg.translate(x, y);
      bg.scale(-1, -1);
      const span = r * 6;
      bg.drawImage(sharp, x - span / 2, y - span / 2, span, span, -r * 1.05, -r * 1.05, r * 2.1, r * 2.1);
      bg.restore();
      bg.beginPath();
      bg.arc(x, y, r, 0, Math.PI * 2);
      bg.lineWidth = Math.max(0.5, r * 0.14);
      bg.strokeStyle = "rgba(30, 32, 44, .3)";
      bg.stroke();
    } else {
      bg.fillStyle = "rgba(36, 38, 50, .14)";
      bg.beginPath();
      bg.arc(x, y, r, 0, Math.PI * 2);
      bg.fill();
    }
    bg.fillStyle = "rgba(255, 255, 255, .7)";
    bg.beginPath();
    bg.arc(x - r * 0.3, y - r * 0.35, Math.max(0.35, r * 0.28), 0, Math.PI * 2);
    bg.fill();
  };
  for (let i = 0; i < (w * h) / (150 * dpr * dpr); i += 1) {
    bead(rand(0, w), rand(0, h), rand(0.45, 1.5) * dpr);
  }
  for (let i = 0; i < (w * h) / (4200 * dpr * dpr); i += 1) {
    bead(rand(0, w), rand(0, h), rand(1.7, 3.4) * dpr);
  }

  // old runs: thin wavy lines where drops slid down before, mist wiped
  const runs = canvas(w, h);
  const rg = runs.getContext("2d");
  rg.lineCap = "round";
  rg.strokeStyle = rg.fillStyle = "#000";
  // short, wandering, half fogged over again, a bead left at the end
  for (let i = 0; i < 5; i += 1) {
    let x = rand(0.04, 0.96) * w;
    let y = rand(0, 0.75) * h;
    const top = y;
    const end = y + rand(0.06, 0.24) * h;
    const width = rand(1.2, 2.2) * dpr;
    while (y < end) {
      const nx = x + rand(-1.4, 1.4) * dpr;
      const ny = y + rand(5, 12) * dpr;
      rg.lineWidth = width * (0.45 + (0.55 * (y - top)) / (end - top)); // thins toward the top
      rg.beginPath();
      rg.moveTo(x, y);
      rg.lineTo(nx, ny);
      rg.stroke();
      x = nx;
      y = ny;
    }
    rg.beginPath();
    rg.arc(x, y, width * 1.1, 0, Math.PI * 2);
    rg.fill();
  }

  return { color, density, grain, beads, runs };
}

function runSplash(view, scene, onReady) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.round(view.clientWidth * dpr);
  const h = Math.round(view.clientHeight * dpr);
  view.width = w;
  view.height = h;
  const ctx = view.getContext("2d");
  let raf = 0;
  let stopped = false;

  const ready = Promise.all([
    loadImage(pictures[scene] || dayPic),
    loadImage(foxes),
    loadImage(heart),
    document.fonts?.load(`48px "La Belle Aurore"`).catch(() => null),
  ]);

  ready
    .then(([outside, foxImg, heartImg]) => {
      if (stopped) return;
      onReady();

      // the view, sharp, and the same view through fogged glass
      const sharp = canvas(w, h);
      cover(sharp.getContext("2d"), outside, w, h);
      const fog = condensation(sharp, w, h, dpr, scene);
      // through a wiped line the glass is clear, so it reads a touch
      // darker than the bright mist around it
      const clear = canvas(w, h);
      const cl = clear.getContext("2d");
      cl.drawImage(sharp, 0, 0);
      cl.fillStyle = "rgba(20, 22, 34, .14)";
      cl.fillRect(0, 0, w, h);

      // now and then a bead gets heavy and slides, clearing a line
      const sliders = Array.from({ length: 3 }, (_, i) => ({
        at: 0.8 + i * 1.4 + rand(0, 0.8),
        // off to the sides, so none runs through the drawing
        x: (i % 2 ? rand(0.78, 0.94) : rand(0.06, 0.22)) * w,
        y: rand(0.05, 0.45) * h,
        // a real bead runs a little way, slows, and stops
        reach: rand(0.12, 0.32) * h,
        v: rand(60, 110) * dpr,
        r: rand(2.4, 3.6) * dpr,
      }));

      // where things go
      const artW = Math.min(250 * dpr, w * 0.62);
      const artH = (artW * foxImg.naturalHeight) / foxImg.naturalWidth;
      const artX = (w - artW) / 2;
      const artY = h * 0.38 - artH / 2;
      const thick = 1.1 * dpr;
      const foxLines = fingerStroke(foxImg, artW, artH, thick);
      const heartLines = fingerStroke(heartImg, artW, artH, thick);
      const fontSize = Math.min(36 * dpr, w * 0.09);
      const signY = artY + artH + fontSize * 1.6;

      // signature as a stroke on its own layer
      const sign = canvas(w, h);
      const sg = sign.getContext("2d");
      sg.font = `${fontSize}px "La Belle Aurore", cursive`;
      sg.textAlign = "center";
      sg.textBaseline = "alphabetic";
      sg.lineJoin = "round";
      sg.lineWidth = thick * 1.6;
      sg.strokeStyle = sg.fillStyle = "#000";
      sg.fillText(SIGNATURE, w / 2, signY);
      sg.strokeText(SIGNATURE, w / 2, signY);
      const signWidth = sg.measureText(SIGNATURE).width;

      // a couple of lines run once the fog has been wiped (water collects)
      const drips = [
        { x: artX + artW * 0.17, y: artY + artH * 0.95, at: FOXES_AT + FOXES_TIME + 0.2, len: 26 },
        { x: artX + artW * 0.78, y: artY + artH * 0.97, at: FOXES_AT + FOXES_TIME + 0.7, len: 30 },
        { x: w / 2 - signWidth * 0.32, y: signY + fontSize * 0.25, at: SIGN_AT + SIGN_TIME, len: 38 },
      ].map((d) => ({ ...d, len: d.len * dpr }));

      const wiped = canvas(w, h); // white where the finger has cleared the glass
      const wp = wiped.getContext("2d");
      const frame = canvas(w, h);
      const fr = frame.getContext("2d");
      const maskSmall = canvas(Math.round(w / 2), Math.round(h / 2));
      const maskSoft = canvas(w, h);
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const start = performance.now();
      const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 2);

      function draw(now) {
        if (stopped) return;
        const t = still ? 99 : (now - start) / 1000;

        // build the wiped-clear mask for this moment
        wp.clearRect(0, 0, w, h);
        const foxP = ease((t - FOXES_AT) / FOXES_TIME);
        if (foxP > 0) {
          // the finger moves left to right across the two of them
          wp.save();
          wp.beginPath();
          wp.rect(artX - thick * 2, 0, (artW + thick * 4) * foxP, h);
          wp.clip();
          wp.drawImage(foxLines, artX, artY);
          wp.restore();
        }
        const heartP = ease((t - HEART_AT) / 0.35);
        if (heartP > 0) {
          wp.save();
          wp.globalAlpha = heartP;
          wp.drawImage(heartLines, artX, artY);
          wp.restore();
        }
        const signP = ease((t - SIGN_AT) / SIGN_TIME);
        if (signP > 0) {
          wp.save();
          wp.beginPath();
          wp.rect(w / 2 - signWidth / 2 - fontSize, 0, (signWidth + fontSize * 2) * signP, h);
          wp.clip();
          wp.drawImage(sign, 0, 0);
          wp.restore();
        }
        wp.lineCap = "round";
        wp.strokeStyle = "#000";
        for (const d of drips) {
          const p = ease((t - d.at) / 1.4);
          if (p <= 0) continue;
          wp.lineWidth = thick * 1.4;
          wp.beginPath();
          wp.moveTo(d.x, d.y);
          wp.lineTo(d.x + Math.sin(p * 3) * dpr, d.y + d.len * p);
          wp.stroke();
          wp.beginPath();
          wp.arc(d.x + Math.sin(p * 3) * dpr, d.y + d.len * p, thick * 1.5, 0, Math.PI * 2);
          wp.fill();
        }

        // fog with the wiped lines taken out of it, over the clear view;
        // the edges of a finger line are soft, so soften the mask a little
        // sliding beads wipe their own lines into the cleared mask
        for (const d of sliders) {
          const run = t - d.at;
          if (run <= 0) continue;
          d.cy = d.y + d.reach * (1 - Math.exp((-run * d.v) / d.reach));
          d.cx = d.x + Math.sin(run * 1.7) * 2 * dpr;
          wp.lineWidth = d.r * 1.1;
          wp.beginPath();
          wp.moveTo(d.x, d.y);
          wp.lineTo(d.cx, d.cy);
          wp.stroke();
        }

        // the mist: its colour, thinned to its uneven thickness (drifting
        // very slowly), with old runs and everything wiped taken out
        fr.globalCompositeOperation = "source-over";
        fr.clearRect(0, 0, w, h);
        fr.drawImage(fog.color, 0, 0);
        fr.globalCompositeOperation = "destination-in";
        fr.drawImage(fog.density, -w * 0.1 + Math.sin(t * 0.09) * w * 0.05, -h * 0.1 + t * h * 0.003);
        fr.globalCompositeOperation = "destination-out";
        fr.globalAlpha = 0.45; // fogged over again, partly
        fr.drawImage(fog.runs, 0, 0);
        fr.globalAlpha = 1;
        fr.drawImage(softened(wiped, w, h, 2, maskSmall, maskSoft), 0, 0);

        // and at the end it thins away
        const mist = 1 - ease((t - LIFT_AT) / LIFT_TIME);

        ctx.globalAlpha = 1;
        ctx.drawImage(clear, 0, 0);
        ctx.globalAlpha = mist;
        ctx.drawImage(frame, 0, 0);
        ctx.drawImage(fog.grain, 0, 0);
        ctx.drawImage(fog.beads, 0, 0);
        ctx.globalAlpha = 1;
        for (const d of sliders) {
          if (d.cy === undefined || d.cy > h + d.r) continue;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(d.cx, d.cy, d.r, d.r * 1.2, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.translate(d.cx, d.cy);
          ctx.scale(-1, -1);
          ctx.drawImage(sharp, d.cx - d.r * 3, d.cy - d.r * 3, d.r * 6, d.r * 6, -d.r * 1.1, -d.r * 1.3, d.r * 2.2, d.r * 2.6);
          ctx.restore();
          ctx.fillStyle = "rgba(255,255,255,.8)";
          ctx.beginPath();
          ctx.arc(d.cx - d.r * 0.3, d.cy - d.r * 0.4, d.r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        // fade in from the plain loading fog so there's no jump
        const settle = 1 - ease(t / 0.6);
        if (settle > 0) {
          ctx.fillStyle = `rgba(${(fogTones[scene] || fogTones.day).join(", ")}, ${settle})`;
          ctx.fillRect(0, 0, w, h);
        }

        if (!still && t < LIFT_AT + LIFT_TIME + 0.5) raf = requestAnimationFrame(draw);
      }
      raf = requestAnimationFrame(draw);
    })
    .catch(() => {
      // couldn't load: the plain fog behind still shows, then it lifts
    });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

const GIVE_UP = 6; // seconds to wait for the pictures before just going in

export default function Splash({ scene = "day" }) {
  // loading: plain thick fog hiding the page; drawing: the finger at work
  const [stage, setStage] = useState(() => (alreadySeen() ? "gone" : "loading"));
  const view = useRef(null);
  // the view is chosen once, when the window first fogs up
  const [firstScene] = useState(scene);
  const showing = stage !== "gone";

  useEffect(() => {
    if (!showing || !view.current) return undefined;
    return runSplash(view.current, firstScene, () =>
      setStage((current) => (current === "loading" ? "drawing" : current))
    );
  }, [showing, firstScene]);

  // the drawing gets its full time, counted from when it actually starts
  useEffect(() => {
    if (stage !== "drawing" && stage !== "loading") return undefined;
    const wait = stage === "drawing" ? HOLD : GIVE_UP;
    const timer = setTimeout(() => setStage("leaving"), wait * 1000);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "leaving") return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // private mode: it just plays again next time
    }
    const timer = setTimeout(() => setStage("gone"), 1600);
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === "gone") return null;

  return (
    <div
      className={`splash ${stage === "leaving" ? "is-leaving" : ""}`}
      style={{ background: `rgb(${(fogTones[firstScene] || fogTones.day).join(", ")})` }}
      onClick={() => setStage("leaving")}
      role="img"
      aria-label="Wangshu & Xi"
    >
      <canvas ref={view} className="splash-glass" />
    </div>
  );
}
