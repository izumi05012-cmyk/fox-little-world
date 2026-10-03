import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

const featureItems = [
  {
    title: "聊天",
    english: "CHAT",
    type: "chat",
  },
  {
    title: "日记",
    english: "DIARY",
  },
  {
    title: "日历",
    english: "CALENDAR",
  },
  {
    title: "记录我们",
    english: "MEMORIES",
  },
  {
    title: "Tarot",
    english: "TONIGHT",
  },
  {
    title: "晴天娃娃",
    english: "MOOD",
  },
  {
    title: "Fox Post",
    english: "LETTERS",
  },
  {
    title: "我们的空间",
    english: "OUR SPACE",
  },
];

const timeline = [
  {
    date: "2026.04.18",
    title: "第一封信",
    text: "我们的小世界，从一封信开始。",
  },
  {
    date: "2026.07.02",
    title: "那天的雨",
    text: "一起记住的一场雨。",
  },
  {
    date: "2026.09.22",
    title: "200 DAYS ♡",
    text: "已经一起走过两百天。",
  },
];

function Home({ onChat }) {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-mark">♢</span>
          <span>FOX LITTLE WORLD</span>
        </div>

        <span className="home-header-note">
          OUR LITTLE PLACE
        </span>
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

        <p className="hero-eyebrow">
          YOU AND ME · ALWAYS
        </p>

        <h1>
          我们的小世界
        </h1>

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
            <p className="fox-post-label">
              A NOTE FOR TODAY
            </p>

            <h2>
              今天也好好生活。
            </h2>

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

      <section className="home-section">
        <div className="section-label">
          <span>OUR LITTLE THINGS</span>
          <i />
        </div>

        <div className="feature-grid">
          {featureItems.map((item) => (
            <button
              key={item.title}
              className="feature-card"
              onClick={
                item.type === "chat"
                  ? onChat
                  : undefined
              }
            >
              <span className="feature-paw">
                <img src={paw} alt="" />
              </span>

              <strong>{item.title}</strong>

              <small>{item.english}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section timeline-section">
        <div className="section-label">
          <span>OUR STORY</span>
          <i />
        </div>

        <div className="timeline">
          {timeline.map((item, index) => (
            <article
              className="timeline-item"
              key={item.date}
            >
              <div className="timeline-marker">
                {index === timeline.length - 1
                  ? "♡"
                  : "·"}
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

        <p>
          “今天也有一点想你。”
        </p>

        <small>
          written somewhere inside our little world
        </small>
      </section>

      <nav className="home-nav">
        <button className="active" aria-label="首页">
          <img src={paw} alt="" />
        </button>

        <button
          onClick={onChat}
          aria-label="聊天"
        >
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
    return (
      <Chat
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <Home
      onChat={() => setPage("chat")}
    />
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
