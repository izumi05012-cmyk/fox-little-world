import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import ChatList from "./ChatList";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

const starEntries = [
  { id: "chat", label: "聊天", english: "CHAT", x: 38, y: 46, type: "chat", active: true },
  { id: "diary", label: "日记", english: "DIARY", x: 48, y: 40, type: "placeholder", active: true },
  { id: "calendar", label: "日历", english: "CALENDAR", x: 58, y: 45, type: "placeholder", active: true },
  { id: "memories", label: "记录我们", english: "MEMORIES", x: 67, y: 53, type: "placeholder", active: true },
  { id: "tarot", label: "Tarot", english: "TONIGHT", x: 72, y: 65, type: "placeholder", active: true },
  { id: "mood", label: "晴天娃娃", english: "MOOD", x: 67, y: 76, type: "placeholder", active: true },
  { id: "letters", label: "Fox Post", english: "LETTERS", x: 54, y: 83, type: "placeholder", active: true },
  { id: "space", label: "我们的空间", english: "OUR SPACE", x: 40, y: 79, type: "placeholder", active: true },
];

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

function StarMap({ onOpen }) {
  const [selected, setSelected] = useState(null);

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
        <div className="star-map">
          <svg
            className="star-map-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {constellationLines.map(([from, to]) => {
              const a = pointMap[from];
              const b = pointMap[to];
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  opacity={((starGlow(a.r) + starGlow(b.r)) / 2) * 0.55}
                />
              );
            })}
          </svg>

          {constellationStars.map((star) => (
            <span
              key={star.id}
              className={`constellation-star ${
                star.id === "heart" ? "heart-star" : ""
              }`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                "--star-size": `${star.r * 2.4}px`,
                "--star-opacity": starGlow(star.r),
              }}
            />
          ))}

          {starEntries.map((entry) => (
            <button
              key={entry.id}
              className={`entry-star ${
                selected === entry.id ? "selected" : ""
              }`}
              style={{ left: `${entry.x}%`, top: `${entry.y}%` }}
              onClick={() => selectEntry(entry)}
              aria-label={entry.label}
            >
              <span />
            </button>
          ))}

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
