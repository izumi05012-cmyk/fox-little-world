import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

function Home({ onChat }) {
  const features = [
    { icon: "▤", title: "聊天", en: "Chat", action: onChat },
    { icon: "▱", title: "日记", en: "Diary" },
    { icon: "▣", title: "日历", en: "Calendar" },
    { icon: "▧", title: "相册", en: "Memories" },
    { icon: "✦", title: "塔罗", en: "Tarot" },
    { icon: "♧", title: "晴天娃娃", en: "Sunny Doll" },
    { icon: "✉", title: "信箱", en: "Fox Post" },
    { icon: "⌂", title: "小空间", en: "Our Space" },
  ];

  const timeline = [
    ["2026.03.06", "我们开始了"],
    ["2026.04.18", "第一封信"],
    ["2026.07.02", "那天的雨"],
    ["2026.09.22", "200 天 ♡"],
  ];

  return (
    <main className="home">
      <header className="home-top">
        <div className="home-brand">
          <div className="home-brand-avatar">
            <img src={foxHead} alt="" />
          </div>

          <div>
            <h1>OUR LITTLE WORLD</h1>
            <p>You and me · Always</p>
          </div>
        </div>

        <div className="home-top-actions">
          <button aria-label="新的内容">✦</button>
          <button aria-label="更多">•••</button>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-fox">
          <div className="hero-flower flower-left">❧</div>

          <img src={foxHead} alt="两只小狐狸" />

          <div className="hero-flower flower-right">❧</div>
        </div>

        <div className="hero-info">
          <div className="hero-date">
            <strong>Sep. 22</strong>
            <span>Tuesday</span>
          </div>

          <div className="hero-weather">
            <span className="sun">☼</span>
            <strong>24°C</strong>
            <span>晴</span>
          </div>

          <p>
            今天也要
            <br />
            一起度过呀 ♡
          </p>
        </div>
      </section>

      <section className="letter-card">
        <div className="letter-icon">✉</div>

        <div className="letter-copy">
          <strong>Bunny 给你留了一封信</strong>
          <p>「等你有空再打开吧。」</p>
        </div>

        <span className="card-arrow">›</span>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <button
            key={feature.title}
            className="feature-card"
            onClick={feature.action}
          >
            <span className="feature-art">{feature.icon}</span>

            <strong>{feature.title}</strong>

            <small>{feature.en}</small>
          </button>
        ))}
      </section>

      <section className="timeline-card">
        <div className="timeline-header">
          <div>
            <span className="timeline-decoration">❧</span>
            <strong>我们的时间线</strong>
            <span>→</span>
          </div>

          <button>更多 ›</button>
        </div>

        <div className="timeline-body">
          <div className="timeline-list">
            {timeline.map(([date, text]) => (
              <div className="timeline-item" key={date}>
                <span className="timeline-dot" />

                <time>{date}</time>

                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="timeline-fox">
            <span>Better</span>
            <span>Together</span>
            <img src={foxHead} alt="" />
          </div>
        </div>
      </section>

      <nav className="home-nav">
        <button className="nav-item active" onClick={() => {}}>
          <img src={paw} alt="" />
          <span>聊天</span>
        </button>

        <button className="nav-item">
          <img src={paw} alt="" />
          <span>日记</span>
        </button>

        <button className="nav-center" onClick={onChat}>
          <img src={foxHead} alt="" />
        </button>

        <button className="nav-item">
          <img src={paw} alt="" />
          <span>日历</span>
        </button>

        <button className="nav-item">
          <img src={paw} alt="" />
          <span>更多</span>
        </button>
      </nav>
    </main>
  );
}

function App() {
  const [page, setPage] = useState("home");

  if (page === "chat") {
    return <Chat onBack={() => setPage("home")} />;
  }

  return <Home onChat={() => setPage("chat")} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
