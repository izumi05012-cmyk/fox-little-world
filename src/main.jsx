import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import ChatList from "./ChatList";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

// Each entry now IS a star of the constellation (`star` = id in constellationStars),
// so the map reads as one drawing. `side` is where its tiny label sits.
const starEntries = [
  { id: "chat", label: "聊天", english: "CHAT", star: "heart", side: "b", main: true, type: "chat", active: true },
  { id: "diary", label: "日记", english: "DIARY", star: "head-b", side: "t", type: "placeholder", active: true },
  { id: "calendar", label: "日历", english: "CALENDAR", star: "head-d", side: "r", type: "placeholder", active: true },
  { id: "memories", label: "记录我们", english: "MEMORIES", star: "body-b", side: "r", type: "placeholder", active: true },
  { id: "tarot", label: "Tarot", english: "TONIGHT", star: "tail-a", side: "r", type: "placeholder", active: true },
  { id: "mood", label: "晴天娃娃", english: "MOOD", star: "tail-c", side: "r", type: "placeholder", active: true },
  { id: "letters", label: "Fox Post", english: "LETTERS", star: "tail-e", side: "l", type: "placeholder", active: true },
  { id: "space", label: "我们的空间", english: "OUR SPACE", star: "tail-g", side: "l", type: "placeholder", active: true },
];

const entryStarIds = new Set(starEntries.map((entry) => entry.star));

const constellationStars = [
  { id: "head-a", x: 28, y: 27, r: 1.2 },
  { id: "head-b", x: 38, y: 25, r: 1.5 },
  { id: "head-c", x: 48, y: 28, r: 1.1 },
  { id: "head-d", x: 58, y: 31, r: 1.3 },
  { id: "heart", x: 48, y: 46, r: 2.5 },
  { id: "body-a", x: 58, y: 52, r: 1.6 },
  { id: "body-b", x: 67, y: 59, r: 1.4 },
  { id: "tail-a", x: 73, y: 69, r: 1.3 },
  { id: "tail-b", x: 70, y: 78, r: 1.6 },
  { id: "tail-c", x: 62, y: 86, r: 1.2 },
  { id: "tail-d", x: 53, y: 91, r: 1.7 },
  { id: "tail-e", x: 44, y: 91, r: 1.2 },
  { id: "tail-f", x: 35, y: 86, r: 1.1 },
  { id: "tail-g", x: 28, y: 79, r: 1.2 },
  { id: "tail-h", x: 23, y: 70, r: 1.0 },
  { id: "claw-a", x: 25, y: 35, r: 1.0 },
  { id: "claw-b", x: 20, y: 42, r: 1.0 },
  { id: "claw-c", x: 27, y: 48, r: 1.1 },
];

const constellationLines = [
  ["head-a", "head-b"], ["head-b", "head-c"], ["head-c", "head-d"],
  ["head-b", "heart"], ["head-c", "heart"], ["heart", "body-a"],
  ["body-a", "body-b"], ["body-b", "tail-a"], ["tail-a", "tail-b"],
  ["tail-b", "tail-c"], ["tail-c", "tail-d"], ["tail-d", "tail-e"],
  ["tail-e", "tail-f"], ["tail-f", "tail-g"], ["tail-g", "tail-h"],
  ["head-a", "claw-a"], ["claw-a", "claw-b"], ["claw-b", "claw-c"],
  ["claw-c", "heart"],
];

// brighter (larger) stars read darker; dim ones fade into the paper
const starGlow = (r) => Math.min(1, 0.32 + r * 0.24);

const timeline = [
  { date: "2026.04.18", title: "第一封信", text: "我们的小世界，从一封信开始。" },
  { date: "2026.07.02", title: "那天的雨", text: "一起记住的一场雨。" },
  { date: "2026.09.22", title: "200 DAYS ♡", text: "已经一起走过两百天。" },
];

// Pencil-drawn constellations leave a small gap beside each star. The gap is
// measured in real pixels (the map isn't square), so it stays a circle.
function gapPx(star) {
  if (star.id === "heart") return 15;
  if (entryStarIds.has(star.id)) return 11;
  return star.r * 1.2 + 3;
}

function trimLine(a, b, size) {
  const ax = (a.x * size.w) / 100;
  const ay = (a.y * size.h) / 100;
  const bx = (b.x * size.w) / 100;
  const by = (b.y * size.h) / 100;
  const len = Math.hypot(bx - ax, by - ay);
  const ga = gapPx(a);
  const gb = gapPx(b);
  if (len <= ga + gb + 2) return null;
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  return {
    x1: ((ax + ux * ga) / size.w) * 100,
    y1: ((ay + uy * ga) / size.h) * 100,
    x2: ((bx - ux * gb) / size.w) * 100,
    y2: ((by - uy * gb) / size.h) * 100,
  };
}

// Pencil lines are never perfectly straight: bow each one a hair, by a fixed
// amount per line (so it doesn't jitter between renders).
function pencilPath(seg, index) {
  const mx = (seg.x1 + seg.x2) / 2;
  const my = (seg.y1 + seg.y2) / 2;
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len = Math.hypot(dx, dy) || 1;
  const bend = (((index * 53) % 7) - 3) * 0.16;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M${seg.x1} ${seg.y1} Q${cx} ${cy} ${seg.x2} ${seg.y2}`;
}

// Faint specks in the empty paper around the drawing (x, y in %).
const starDust = [
  [9, 10, 2, 0.22], [21, 7, 2, 0.14], [14, 20, 2, 0.18], [60, 9, 2, 0.16],
  [82, 14, 3, 0.2], [91, 29, 2, 0.15], [86, 41, 2, 0.12], [8, 57, 2, 0.17],
  [6, 69, 3, 0.2], [13, 91, 2, 0.14], [38, 65, 2, 0.14], [51, 69, 2, 0.1],
  [50, 97, 2, 0.15], [92, 83, 2, 0.16],
];

function StarMap({ onOpen }) {
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const [size, setSize] = useState({ w: 358, h: 360 });

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth || 358;
      const h = el.clientHeight || 360;
      setSize((current) =>
        current.w === w && current.h === h ? current : { w, h }
      );
    };
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pointMap = Object.fromEntries(
    constellationStars.map((star) => [star.id, star])
  );

  function selectEntry(entry) {
    setSelected(entry.id);
    if (entry.type === "chat") {
      onOpen("chat");
    }
  }

  return (
    <section className="home-section star-section">
      <div className="section-label">
        <span>OUR LITTLE THINGS</span>
        <i />
      </div>

      <div className="star-map-wrap">
        <div className="star-map" ref={mapRef}>
          <svg
            className="star-map-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {constellationLines.map(([from, to], index) => {
              const a = pointMap[from];
              const b = pointMap[to];
              const seg = trimLine(a, b, size);
              if (!seg) return null;
              return (
                <path
                  key={`${from}-${to}`}
                  d={pencilPath(seg, index)}
                  opacity={((starGlow(a.r) + starGlow(b.r)) / 2) * 0.6}
                />
              );
            })}
          </svg>

          {starDust.map(([x, y, s, o]) => (
            <span
              key={`${x}-${y}`}
              className="star-dust"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                "--dust-size": `${s}px`,
                "--dust-opacity": o,
              }}
              aria-hidden="true"
            />
          ))}

          {constellationStars
            .filter((star) => !entryStarIds.has(star.id))
            .map((star) => (
              <span
                key={star.id}
                className="constellation-star"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  // whole pixels only: fractional sizes render as tilted ovals
                  "--star-size": `${Math.max(3, Math.round(star.r * 2.4))}px`,
                  "--star-opacity": starGlow(star.r),
                }}
              />
            ))}

          {starEntries.map((entry) => {
            const star = pointMap[entry.star];
            return (
              <button
                key={entry.id}
                className={`entry-star side-${entry.side} ${
                  entry.main ? "entry-main" : ""
                } ${selected === entry.id ? "selected" : ""}`}
                style={{ left: `${star.x}%`, top: `${star.y}%` }}
                onClick={() => selectEntry(entry)}
                aria-label={entry.label}
              >
                <span />
                <small>{entry.english}</small>
              </button>
            );
          })}

          <div className="star-map-note">
            <span>tap a star</span>
            <small>and enter our little world</small>
          </div>
        </div>

        {selected && (
          <div className="star-entry-caption">
            {starEntries.find((item) => item.id === selected)?.label}
          </div>
        )}
      </div>
    </section>
  );
}

function Home({ onOpen }) {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark">♢</span>
          <span>FOX LITTLE WORLD</span>
        </div>
        <span className="home-header-note">OUR LITTLE PLACE</span>
      </header>

      <section className="home-hero">
        <div className="hero-topline">
          <span>A LITTLE WORLD FOR TWO</span>
          <i />
          <span>ALWAYS</span>
        </div>

        <div className="hero-foxes">
          <div className="hero-fox hero-fox-left">
            <img src={foxHead} alt="" />
          </div>
          <div className="hero-heart">♡</div>
          <div className="hero-fox hero-fox-right">
            <img src={foxHead} alt="" />
          </div>
        </div>

        <p className="hero-eyebrow">YOU AND ME · ALWAYS</p>
        <h1>我们的小世界</h1>
        <p className="hero-intro">
          留下一点今天，
          <br />
          也留下一点关于我们的以后。
        </p>

        <div className="hero-meta">
          <span>02 · 10 · 2026</span>
          <span>LOS ANGELES · ☼ 22°C</span>
        </div>
      </section>

      <section className="fox-post-card">
        <div className="fox-post-header">
          <span>FOX POST</span>
          <span>NO. 006</span>
        </div>

        <div className="fox-post-content">
          <div>
            <p className="fox-post-label">A NOTE FOR TODAY</p>
            <h2>今天也好好生活。</h2>
            <p>
              下一个重要的日子，
              <strong>还有 12 天。</strong>
            </p>
          </div>

          <div className="fox-post-stamp">
            <span>FOR</span>
            <strong>US</strong>
            <small>♡</small>
          </div>
        </div>

        <div className="fox-post-footer">
          another little day together
        </div>
      </section>

      <StarMap onOpen={onOpen} />

      <section className="home-section timeline-section">
        <div className="section-label">
          <span>OUR STORY</span>
          <i />
        </div>

        <div className="timeline">
          {timeline.map((item, index) => (
            <article className="timeline-item" key={item.date}>
              <div className="timeline-marker">
                {index === timeline.length - 1 ? "♡" : "·"}
              </div>
              <div className="timeline-copy">
                <span>{item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="daily-note">
        <span>DAILY NOTE</span>
        <p>“今天也有一点想你。”</p>
        <small>written somewhere inside our little world</small>
      </section>

      <nav className="home-nav">
        <button className="active" aria-label="首页">
          <img src={paw} alt="" />
        </button>
        <button onClick={() => onOpen("chat-list")} aria-label="聊天">
          <img src={paw} alt="" />
        </button>
        <button aria-label="日记">
          <img src={paw} alt="" />
        </button>
        <button aria-label="更多">
          <img src={paw} alt="" />
        </button>
      </nav>
    </main>
  );
}

function App() {
  const [page, setPage] = useState("home");

  if (page === "chat") {
    return <Chat onBack={() => setPage("chat-list")} />;
  }

  if (page === "chat-list") {
    return (
      <ChatList
        onBack={() => setPage("home")}
        onOpenChat={() => setPage("chat")}
      />
    );
  }

  return <Home onOpen={setPage} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
