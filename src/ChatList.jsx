import React from "react";
import paw from "./assets/paw.svg";
import foxHead from "./assets/fox-head.svg";

const chats = [
  {
    id: "bunny-elliott",
    name: "Bunny & Elliott",
    message: "我也吃啦 🦊",
    time: "20:20",
    unread: true,
    image: foxHead,
  },
  {
    id: "fox-post",
    name: "Fox Post",
    message: "今天也好好生活。",
    time: "昨天",
    image: foxHead,
  },
  {
    id: "our-space",
    name: "我们的空间",
    message: "有新的小事被记录下来。",
    time: "周二",
    image: foxHead,
  },
];

export default function ChatList({ onBack, onOpenChat }) {
  return (
    <main className="chat-list-page">
      <header className="chat-list-header">
        <button className="list-back" onClick={onBack} aria-label="返回首页">
          ←
        </button>

        <div>
          <span className="list-eyebrow">YOU AND ME · ALWAYS</span>
          <h1>聊天</h1>
        </div>

        <button className="list-add" aria-label="新建聊天">
          ＋
        </button>
      </header>

      <div className="chat-list-rule">
        <span>OUR LITTLE CONVERSATIONS</span>
        <i />
      </div>

      <section className="chat-list-items">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className="chat-list-item"
            onClick={chat.id === "bunny-elliott" ? onOpenChat : undefined}
          >
            <span className="chat-list-avatar">
              <img src={chat.image} alt="" />
            </span>

            <span className="chat-list-copy">
              <strong>{chat.name}</strong>
              <small>{chat.message}</small>
            </span>

            <span className="chat-list-meta">
              <time>{chat.time}</time>
              {chat.unread && <i aria-label="未读" />}
            </span>
          </button>
        ))}
      </section>

      <section className="chat-list-footer">
        <div className="chat-list-fox">
          <img src={foxHead} alt="" />
        </div>
        <p>somewhere between today and tomorrow,<br />we are still here.</p>
      </section>

      <nav className="home-nav">
        <button onClick={onBack} aria-label="首页">
          <img src={paw} alt="" />
        </button>
        <button className="active" aria-label="聊天">
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
