import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

import Chat from "./Chat";
import foxHead from "./assets/fox-head.svg";
import paw from "./assets/paw.svg";

function Home({ onChat }) {
  return (
    <main className="home">
      <div className="fox-mark">
        <img src={foxHead} alt="Fox Little World" />
      </div>

      <p className="eyebrow">FOX LITTLE WORLD</p>

      <h1>我们的小世界</h1>

      <p className="intro">
        这里装着我们的小事、碎片和想念。
      </p>

      <section className="card">
        <span>TODAY</span>
        <h2>今天也要好好生活。</h2>
        <p>距离我们的下一个重要日子，还有 12 天。</p>
      </section>

      <nav className="nav">
        <button>
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
