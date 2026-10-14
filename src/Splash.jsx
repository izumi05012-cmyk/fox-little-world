import React, { useEffect, useRef, useState } from "react";
// 曦曦's drawing of the two of us, cheek to cheek
import foxes from "./assets/splash/foxes.webp";
import heart from "./assets/splash/heart.webp";
import "@fontsource/la-belle-aurore/400.css";
import dayPic from "./assets/window/day.webp";
import rainPic from "./assets/window/rain.webp";
import snowPic from "./assets/window/snow.webp";
import nightPic from "./assets/window/night.webp";

// Opening screen: breath on a cold window. The glass is fogged over and a
// fingertip draws the two little foxes, a heart and our names into the
// mist — the lines are wiped clear, so the view outside shows through them
// sharp, and a couple of them run. Then the fog lifts into home.
// Shown once per browser session; a tap skips it.
const SEEN_KEY = "fox-splash-seen";
const pictures = { day: dayPic, rain: rainPic, snow: snowPic, night: nightPic };

const FOXES_AT = 0.3;
const FOXES_TIME = 1.4;
const HEART_AT = 1.8;
const SIGN_AT = 2.2;
const SIGN_TIME = 1.6;
const HOLD = SIGN_AT + SIGN_TIME + 1.6;
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

function runSplash(view, scene) {
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

      // the view, sharp, and the same view through fogged glass
      const sharp = canvas(w, h);
      cover(sharp.getContext("2d"), outside, w, h);
      const fogBase = softened(sharp, w, h, 28);
      const fb = fogBase.getContext("2d");
      fb.fillStyle = "rgba(240, 238, 242, .7)";
      fb.fillRect(0, 0, w, h);
      // through a wiped line the glass is clear, so it reads darker than
      // the bright fog around it
      const sg0 = sharp.getContext("2d");
      sg0.fillStyle = "rgba(20, 22, 34, .22)";
      sg0.fillRect(0, 0, w, h);

      // where things go
      const artW = Math.min(360 * dpr, w * 0.86);
      const artH = (artW * foxImg.naturalHeight) / foxImg.naturalWidth;
      const artX = (w - artW) / 2;
      const artY = h * 0.38 - artH / 2;
      const thick = 1.3 * dpr;
      const foxLines = fingerStroke(foxImg, artW, artH, thick);
      const heartLines = fingerStroke(heartImg, artW, artH, thick);
      const fontSize = Math.min(52 * dpr, w * 0.12);
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
        fr.globalCompositeOperation = "source-over";
        fr.clearRect(0, 0, w, h);
        fr.drawImage(fogBase, 0, 0);
        fr.globalCompositeOperation = "destination-out";
        fr.drawImage(softened(wiped, w, h, 2, maskSmall, maskSoft), 0, 0);

        ctx.drawImage(sharp, 0, 0);
        ctx.drawImage(frame, 0, 0);

        if (!still && t < HOLD + 1.5) raf = requestAnimationFrame(draw);
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

export default function Splash({ scene = "day" }) {
  const [stage, setStage] = useState(() => (alreadySeen() ? "gone" : "drawing"));
  const view = useRef(null);
  // the view is chosen once, when the window first fogs up
  const [firstScene] = useState(scene);
  const showing = stage !== "gone";

  useEffect(() => {
    if (!showing || !view.current) return undefined;
    return runSplash(view.current, firstScene);
  }, [showing, firstScene]);

  useEffect(() => {
    if (stage !== "drawing") return undefined;
    const timer = setTimeout(() => setStage("leaving"), HOLD * 1000);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "leaving") return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // private mode: it just plays again next time
    }
    const timer = setTimeout(() => setStage("gone"), 1200);
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === "gone") return null;

  return (
    <div
      className={`splash ${stage === "leaving" ? "is-leaving" : ""}`}
      onClick={() => setStage("leaving")}
      role="img"
      aria-label="Wangshu & Xi"
    >
      <canvas ref={view} className="splash-glass" />
    </div>
  );
}
