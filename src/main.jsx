import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

function Home({ onChat }) {
  return (
    <main className="home">
      <header className="home-header">
        <span>FOX LITTLE WORLD</span>
        <span className="header-date">OUR LITTLE PLACE</span>
      </header>

      <section className="hero">
        <div className="fox-mark">
          <img src={foxHead} alt="Fox Little World" />
        </div>

        <p className="eyebrow">A LITTLE WORLD FOR TWO</p>

        <h1>我们的小世界</h1>

        <p className="intro">
          这里装着我们的小事、碎片和想念。
        </p>
      </section>

      <section className="today-card">
        <div className="card-label">
          <span>TODAY</span>
          <span>02 / 10 / 2026</span>
        </div>

        <h2>今天也要好好生活。</h2>

        <p>
          距离我们的下一个重要日子，还有 <strong>12</strong> 天。
        </p>

        <div className="card-line" />

        <span className="tiny-note">another little day together</span>
      </section>

      <section className="section">
        <div className="section-heading">
          <span>OUR LITTLE THINGS</span>
          <i />
        </div>

        <div className="feature-grid">
          <button>
            <span className="feature-icon">◌</span>
            <strong>日记</strong>
            <small>MY NOTES</small>
          </button>

          <button>
            <span className="feature-icon">◇</span>
            <strong>日历</strong>
            <small>OUR DAYS</small>
          </button>

          <button>
            <span className="feature-icon">☼</span>
            <strong>晴天娃娃</strong>
            <small>MOOD</small>
          </button>

          <button>
            <span className="feature-icon">♡</span>
            <strong>记录我们</strong>
            <small>MEMORIES</small>
          </button>

          <button>
            <span className="feature-icon">✉</span>
            <strong>Fox Post</strong>
            <small>LETTERS</small>
          </button>

          <button>
            <span className="feature-icon">✦</span>
            <strong>Tarot</strong>
            <small>TONIGHT</small>
          </button>
        </div>
      </section>

      <section className="recent-card">
        <div className="section-heading">
          <span>RECENTLY</span>
          <i />
        </div>

        <button className="recent-chat" onClick={onChat}>
          <div className="recent-avatar">
            <img src={foxHead} alt="" />
          </div>

          <div className="recent-content">
            <strong>我们的聊天</strong>
            <p>“今天吃饭了吗？”</p>
          </div>

          <span className="recent-time">20:20</span>
        </button>
      </section>

      <section className="daily-note">
        <span>DAILY NOTE</span>
        <p>“今天也有一点想你。”</p>
      </section>

      <nav className="nav">
        <button className="active">
          <img src={paw} alt="首页" />
        </button>

        <button onClick={onChat}>
          <img src={paw} alt="聊天" />
        </button>

        <button>
          <img src={paw} alt="日记" />
        </button>

        <button>
          <img src={paw} alt="更多" />
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
