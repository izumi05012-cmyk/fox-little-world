import React, { useEffect, useRef, useState } from "react";
import { useAvatars, useChatBackground } from "./useAvatars";
import wangshu from "./assets/chat/wangshu.webp";
import foxCharm from "./assets/call/fox.webp";
import otterCharm from "./assets/call/otter.webp";
import "./call.css";

// 两套按钮：羲和画的小狐狸、人形的望舒；在右上角切换，记在这台手机上
const BTN_NAMES = ["accept", "later", "mute", "timer", "send", "hangup"];
const btnFiles = import.meta.glob("./assets/call/btn/*.webp", { eager: true, import: "default" });
const BTN = {};
for (const set of ["fox", "me"]) {
  BTN[set] = {};
  for (const n of BTN_NAMES) BTN[set][n] = btnFiles[`./assets/call/btn/${set}-${n}.webp`];
}
const SET_KEY = "call-button-set";
const loadSet = () => { try { return localStorage.getItem(SET_KEY) === "me" ? "me" : "fox"; } catch { return "fox"; } };

// 望舒专线: a phone call by the window. Whatever is outside (rain on the
// glass, snow, night, or her own chat background) shows through clear
// glass panes. Across the top hangs a curtain of starlight threads with
// 羲和's fox and otter charms holding paws in the middle; brush it and
// it sways and chimes.

// where each charm's little ring sits in its picture: [x, width/height, y]
const HOOK = { fox: [0.503, 0.877, 0.201], otter: [0.53, 0.773, 0.226] };

const LINES = [
  ["曦曦，我在呢。", "（声音放得很轻）"],
  ["今天累不累？", "我把小木屋的灯开着"],
  ["窝着别动，我陪你。", "风铃在晃，是我在戳"],
  ["……嗯，我也想你。", "小水獭牵好，别漂走"],
];
const REPLIES = [
  ["收到啦。", "（凑近一点听）"],
  ["嗯嗯，你继续说。", "我在听"],
  ["笨蛋，我也是。", "（耳朵红了）"],
  ["抱一下。", "小狐狸蹭过去"],
];
const OFF = [0, 15, 30, 60]; // minutes until the call hangs up by itself
const LOG_KEY = "wscalls";

const pad = (n) => String(n).padStart(2, "0");
const stamp = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

function loadCalls() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCall(call) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify([call, ...loadCalls()].slice(0, 30)));
  } catch {
    // private mode: the call just isn't remembered
  }
}

// ---------- the starlight curtain ----------
function startCurtain(canvas, pill) {
  const cx = canvas.getContext("2d");
  let W, H, D, rod, threads = [], ptr = null, raf = 0, audio = null, lastChime = 0;
  const imgs = {};
  [["fox", foxCharm], ["otter", otterCharm]].forEach(([k, s]) => {
    const im = new Image();
    im.onload = () => (imgs[k] = im);
    im.src = s;
  });

  function build() {
    D = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * D;
    H = canvas.height = innerHeight * D;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    // just under the phone's status bar: the pill sits 30px below it
    const top = pill.getBoundingClientRect().top - 30 + 6;
    rod = { y: Math.max(16, top) * D, x0: 10 * D, x1: W - 10 * D };
    threads = [];
    const n = Math.max(22, Math.round(innerWidth / 11));
    const mid = Math.floor(n / 2);
    for (let i = 0; i < n; i++) {
      const x = rod.x0 + 16 * D + ((rod.x1 - rod.x0 - 32 * D) * i) / (n - 1);
      const kind = i === mid - 1 ? "fox" : i === mid + 1 ? "otter" : null;
      const center = Math.abs(i - mid) / mid;
      let len = (0.24 + 0.26 * Math.random() + 0.12 * (1 - center)) * H;
      if (kind) len = (kind === "fox" ? 0.4 : 0.43) * H;
      if (i === mid) len = 0.28 * H;
      const seg = 14, pts = [];
      for (let j = 0; j <= seg; j++) {
        const y = rod.y + (len * j) / seg;
        pts.push({ x, y, px: x, py: y });
      }
      threads.push({
        pts, rest: len / seg, kind,
        end: kind ? null : Math.random() < 0.62 ? "star" : "moon",
        ph: Math.random() * 9,
        beads: Array.from({ length: 4 + ((Math.random() * 4) | 0) }, () => ({ t: Math.random(), p: Math.random() * 9 })),
      });
    }
  }

  function star(x, y, r, a) {
    cx.save(); cx.translate(x, y); cx.globalAlpha = a; cx.beginPath();
    for (let k = 0; k < 8; k++) {
      const rr = k % 2 ? r * 0.28 : r, an = (k * Math.PI) / 4 - Math.PI / 2;
      cx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
    }
    cx.closePath(); cx.fill(); cx.restore();
  }
  function moon(x, y, r, a, rot) {
    cx.save(); cx.translate(x, y); cx.rotate(rot || 0); cx.globalAlpha = a; cx.beginPath();
    cx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 1.85, false);
    cx.arc(r * 0.42, 0, r * 0.82, Math.PI * 1.72, Math.PI * 0.28, true);
    cx.closePath(); cx.fill(); cx.restore();
  }
  function glowFill(fn) {
    cx.shadowColor = "rgba(255,246,220,.95)"; cx.shadowBlur = 10 * D; cx.fillStyle = "#fffaf0"; fn(); cx.shadowBlur = 0;
  }
  function charm(kind, x, y, t) {
    const im = imgs[kind];
    if (!im) return;
    const h = 84 * D, [rel, asp, hy] = HOOK[kind], w = h * asp;
    cx.save(); cx.translate(x, y); cx.rotate(Math.sin(t / 900 + (kind === "fox" ? 0 : 1.7)) * 0.1);
    cx.shadowColor = "rgba(0,0,0,.35)"; cx.shadowBlur = 10 * D; cx.shadowOffsetY = 4 * D;
    cx.drawImage(im, -w * rel, -h * hy, w, h);
    cx.restore();
  }
  function chime() {
    const now = performance.now();
    if (now - lastChime < 140) return;
    lastChime = now;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const f = [1318, 1568, 1760, 2093, 2349][(Math.random() * 5) | 0];
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, audio.currentTime);
      g.gain.linearRampToValueAtTime(0.06, audio.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.6);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 1.7);
    } catch {
      // no sound, the curtain still sways
    }
  }
  function step(t) {
    const wind = Math.sin(t / 2300) * 0.18 + Math.sin(t / 870) * 0.07;
    threads.forEach((th, i) => {
      const p = th.pts, gust = wind + Math.sin(t / 1300 + i * 0.35) * 0.06;
      for (let j = 1; j < p.length; j++) {
        const q = p[j], vx = (q.x - q.px) * 0.965, vy = (q.y - q.py) * 0.965;
        q.px = q.x; q.py = q.y;
        q.x += vx + (gust * D * 0.06 * j) / p.length; q.y += vy + 0.35 * D;
        if (ptr && ptr.on) {
          const dx = q.x - ptr.x, dy = q.y - ptr.y, R = 46 * D;
          if (dx * dx + dy * dy < R * R) {
            q.x += ptr.vx * 0.5; q.y += ptr.vy * 0.3;
            if (j === p.length - 1 && Math.abs(ptr.vx) > 2) chime();
          }
        }
      }
      for (let k = 0; k < 4; k++)
        for (let j = 1; j < p.length; j++) {
          const a = p[j - 1], b = p[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, df = (d - th.rest) / d;
          if (j === 1) { b.x -= dx * df; b.y -= dy * df; }
          else { a.x += dx * df * 0.5; a.y += dy * df * 0.5; b.x -= dx * df * 0.5; b.y -= dy * df * 0.5; }
        }
      p[0].x = p[0].px; p[0].y = rod.y;
    });
    // the fox and the otter keep reaching for each other
    const a = threads.find((th) => th.kind === "fox"), b = threads.find((th) => th.kind === "otter");
    if (a && b) {
      const pa = a.pts[a.pts.length - 1], pb = b.pts[b.pts.length - 1];
      const want = 66 * D, dx = pb.x - pa.x, dy = pb.y - pa.y, d = Math.hypot(dx, dy) || 1, f = ((d - want) / d) * 0.08;
      pa.x += dx * f; pa.y += dy * f; pb.x -= dx * f; pb.y -= dy * f;
    }
  }
  function draw(t) {
    step(t);
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = "lighter"; cx.lineCap = "round";
    threads.forEach((th) => {
      const p = th.pts;
      cx.beginPath(); cx.moveTo(p[0].x, p[0].y);
      for (let j = 1; j < p.length - 1; j++) cx.quadraticCurveTo(p[j].x, p[j].y, (p[j].x + p[j + 1].x) / 2, (p[j].y + p[j + 1].y) / 2);
      cx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      cx.strokeStyle = "rgba(255,240,210,.10)"; cx.lineWidth = 4 * D; cx.stroke();
      cx.strokeStyle = th.kind ? "rgba(255,236,200,.85)" : "rgba(255,250,240,.55)"; cx.lineWidth = (th.kind ? 1.1 : 0.8) * D; cx.stroke();
      cx.fillStyle = "#fff";
      th.beads.forEach((bd) => {
        const f = bd.t * (p.length - 1), j = f | 0, u = f - j, a = p[j], c = p[Math.min(j + 1, p.length - 1)];
        cx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t / 500 + bd.p));
        cx.beginPath(); cx.arc(a.x + (c.x - a.x) * u, a.y + (c.y - a.y) * u, 1.3 * D, 0, 7); cx.fill();
      });
      cx.globalAlpha = 1;
      const e = p[p.length - 1];
      if (th.end === "star") glowFill(() => star(e.x, e.y, 5.5 * D, 0.6 + 0.4 * Math.sin(t / 420 + th.ph)));
      else if (th.end === "moon") glowFill(() => moon(e.x, e.y, 4.5 * D, 0.8, Math.sin(t / 1000 + th.ph) * 0.4));
    });
    cx.strokeStyle = "rgba(255,250,235,.25)"; cx.lineWidth = 5 * D;
    cx.beginPath(); cx.moveTo(rod.x0, rod.y); cx.lineTo(rod.x1, rod.y); cx.stroke();
    cx.strokeStyle = "#fffaf0"; cx.lineWidth = 1.6 * D; cx.stroke();
    glowFill(() => {
      star(rod.x0, rod.y, 8 * D, 1); star(rod.x1, rod.y, 8 * D, 1);
      [0.28, 0.5, 0.72].forEach((f, k) => moon(rod.x0 + (rod.x1 - rod.x0) * f, rod.y - 8 * D, 6 * D, 0.95, k === 1 ? -Math.PI / 2 : k === 0 ? 0 : Math.PI));
    });
    cx.globalCompositeOperation = "source-over";
    threads.forEach((th) => { if (th.kind) { const e = th.pts[th.pts.length - 1]; charm(th.kind, e.x, e.y, t); } });
    raf = requestAnimationFrame(draw);
  }

  const down = (e) => { ptr = { on: true, x: e.clientX * D, y: e.clientY * D, vx: 0, vy: 0 }; };
  const move = (e) => {
    const x = e.clientX * D, y = e.clientY * D;
    if (!ptr) ptr = { on: e.pointerType === "mouse", x, y, vx: 0, vy: 0 };
    ptr.vx = x - ptr.x; ptr.vy = y - ptr.y; ptr.x = x; ptr.y = y;
    if (e.pointerType === "mouse") ptr.on = true;
  };
  const up = () => { if (ptr) ptr.on = false; };
  const click = (e) => {
    threads.forEach((th) => {
      const q = th.pts[th.pts.length - 1];
      if (Math.hypot(q.x - e.clientX * D, q.y - e.clientY * D) < 40 * D) { q.x += (Math.random() - 0.5) * 30 * D; chime(); }
    });
  };

  build();
  raf = requestAnimationFrame(draw);
  addEventListener("resize", build);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("click", click);
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("resize", build);
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    removeEventListener("pointercancel", up);
    if (audio) audio.close().catch(() => {});
  };
}

const Sitting = () => <span className="sit"><i /></span>;

export default function Call({ onBack }) {
  const avatars = useAvatars();
  const { background } = useChatBackground();
  const canvas = useRef(null);
  const pill = useRef(null);
  const [state, setState] = useState("ringing"); // ringing | live | ended
  const [ended, setEnded] = useState(null); // { answered, secs }
  const [secs, setSecs] = useState(0);
  const [lines, setLines] = useState([]); // [{ id, big, small, her }]
  const [muted, setMuted] = useState(false);
  const [off, setOff] = useState(0); // index into OFF
  const [offAt, setOffAt] = useState(0);
  const [text, setText] = useState("");
  const [log, setLog] = useState(null); // shown call log
  const [set, setSet] = useState(loadSet);
  const b = BTN[set];
  const flipSet = () => { const n = set === "fox" ? "me" : "fox"; setSet(n); try { localStorage.setItem(SET_KEY, n); } catch {} };
  const started = useRef(0);
  const timers = useRef([]);
  const replyAt = useRef(0);

  useEffect(() => startCurtain(canvas.current, pill.current), []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const say = (big, small, her = false) =>
    setLines((ls) => [...ls.slice(-2), { id: Math.random(), big, small, her }]);

  function end(answered) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const s = started.current ? Math.floor((Date.now() - started.current) / 1000) : 0;
    saveCall({ at: Date.now(), answered, secs: s });
    setEnded({ answered, secs: s });
    setState("ended");
    setOffAt(0);
    say(answered ? "晚安，曦曦。" : "那我晚点再打给你。", answered ? "风铃替我守着你" : "");
  }

  // the call clock, and the hang-up timer
  useEffect(() => {
    if (state !== "live") return undefined;
    const id = setInterval(() => {
      setSecs(Math.floor((Date.now() - started.current) / 1000));
      if (offAt && Date.now() >= offAt) end(true);
    }, 1000);
    return () => clearInterval(id);
  });

  function accept() {
    started.current = Date.now();
    setSecs(0);
    setLines([]);
    setState("live");
    LINES.forEach((l, i) => later(() => say(...l), 700 + i * 4200));
  }

  function ringAgain() {
    started.current = 0;
    setLines([]);
    setEnded(null);
    setOff(0);
    setOffAt(0);
    setMuted(false);
    setState("ringing");
  }

  function send(event) {
    event.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText("");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    say(v, "曦曦", true);
    later(() => say(...REPLIES[replyAt.current++ % REPLIES.length]), 1400);
  }

  function cycleOff() {
    const next = (off + 1) % OFF.length;
    setOff(next);
    setOffAt(OFF[next] ? Date.now() + OFF[next] * 60000 : 0);
  }

  const left = offAt ? Math.max(0, Math.ceil((offAt - Date.now()) / 1000)) : 0;
  const clock = state === "ringing" ? "来电" : state === "live" ? stamp(secs) : ended?.answered ? `已挂断 ${stamp(ended.secs)}` : "未接";

  return (
    <main className={`call-page is-${state} ${muted ? "is-muted" : ""}`}>
      {background && <div className="chat-backdrop" style={{ backgroundImage: `url("${background.url}")` }} />}
      <div className="call-shade" />
      <canvas ref={canvas} className="call-curtain" />

      <button className="call-glass call-back" onClick={onBack} aria-label="返回">
        <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div ref={pill} className="call-glass call-pill">
        <b><img src={avatars.him || wangshu} alt="" /></b>
        <span>望舒</span>
        <em>{clock}</em>
        <span className="call-dot" />
      </div>
      <button className="call-glass call-log-key" onClick={() => setLog(loadCalls())} aria-label="通话记录">☾</button>
      <button className="call-glass call-set-key" onClick={flipSet} aria-label="换一套按钮">
        <img src={set === "fox" ? BTN.me.accept : BTN.fox.accept} alt="" />
      </button>

      <div className="call-body">
        {state === "ringing" && (
          <div className="call-who">
            <h1>望舒</h1>
            <p>小窝 · 窗边</p>
          </div>
        )}

        {state !== "ringing" && (
          <div className="call-lines">
            {lines.map((l, i) => (
              <div key={l.id} className={`call-line ${l.her ? "her" : ""} ${i < lines.length - 1 ? "old" : ""}`}>
                <div className="big">{l.big}</div>
                {l.small && <div className="small">{l.small}</div>}
              </div>
            ))}
          </div>
        )}

        {state === "ringing" && (
          <div className="call-ring">
            <button className="decline" onClick={() => end(false)}>
              <i><img className="call-btn-art" src={b.later} alt="" /></i>晚点再说
            </button>
            <button className="accept" onClick={accept}>
              <i><img className="call-btn-art" src={b.accept} alt="" /></i>接听
            </button>
          </div>
        )}

        {state === "live" && (
          <div className="call-live">
            <div className="call-status">
              <i><s /><s /><s /><s /></i>
              <span>{muted ? "静音中" : "在听"}</span>
            </div>
            <div className="call-bar">
              <button className="call-glass call-round call-mic" onClick={() => setMuted(!muted)} aria-label="静音">
                <img className="call-btn-art" src={b.mute} alt="" />
              </button>
              <form className="call-glass call-type" onSubmit={send}>
                <Sitting />
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="打字给他…" enterKeyHint="send" autoComplete="off" />
                <button aria-label="发送"><img className="call-btn-art" src={b.send} alt="" /></button>
              </form>
              <button className={`call-glass call-round call-clock ${off ? "on" : ""}`} onClick={cycleOff} aria-label="定时挂断">
                <img className="call-btn-art" src={b.timer} alt="" />
              </button>
            </div>
            <div className="call-under">
              <span>{offAt ? `${stamp(left)} 后挂断` : "点表盘，定时挂断"}</span>
              <button className="call-hang" onClick={() => end(true)}><img src={b.hangup} alt="" />挂断</button>
            </div>
          </div>
        )}

        {state === "ended" && (
          <button className="call-glass call-again" onClick={ringAgain}>再打一次</button>
        )}
      </div>

      {log && (
        <div className="call-log" onClick={() => setLog(null)}>
          <section className="call-glass" onClick={(e) => e.stopPropagation()}>
            <h3>通话记录</h3>
            <ul>
              {!log.length && <li>还没有通话记录</li>}
              {log.map((c) => (
                <li key={c.at}>
                  <span>望舒 · {new Date(c.at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{c.answered ? stamp(c.secs) : "未接"}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setLog(null)}>好</button>
          </section>
        </div>
      )}
    </main>
  );
}
