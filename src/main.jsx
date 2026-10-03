import foxHead from "./assets/fox-head.svg";
import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
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
        <button>⌂</button>
        <button>♡</button>
        <button>✎</button>
        <button>☼</button>
      </nav>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
