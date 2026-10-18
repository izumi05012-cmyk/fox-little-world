import React from "react";
import HomeNav from "./HomeNav";
import { useAvatars } from "./useAvatars";
import { loadLog, loadSettings, preview, shortTime } from "./chatLog";
import wangshu from "./assets/chat/wangshu.webp";

// The chat list sits by the same window as the home page: one glass card
// for each conversation. For now there is one, and it's ours.
export default function ChatList({ onBack, onOpenChat, onNavigate, dayCount, scene }) {
  const avatars = useAvatars();
  const settings = loadSettings();
  const log = loadLog();
  const last = [...log].reverse().find((m) => m.from !== "note");

  return (
    <main className="chat-list-page" data-dark={scene !== "day" || undefined}>

      <header className="chat-list-header">
        <button className="glass round-button" onClick={onBack} aria-label="返回首页">
          ←
        </button>
        <div>
          <p className="journal-label">YOU AND ME · ALWAYS</p>
          <h1>聊天</h1>
        </div>
      </header>

      <button className="glass chat-list-item" onClick={onOpenChat}>
        <span className="chat-avatar">
          <img src={avatars.him || wangshu} alt="" />
        </span>
        <span className="chat-list-copy">
          <strong>{settings.name}</strong>
          <small>{preview(last)}</small>
        </span>
        <span className="chat-list-meta">
          {last && <time>{shortTime(last.at)}</time>}
          {last?.from === "him" && <i aria-label="新消息" />}
        </span>
      </button>

      <p className="vellum chat-list-note">
        在一起的第 {dayCount} 天，
        <br />
        今天也想和你说说话。
      </p>

      <HomeNav active="chat-list" onOpen={onNavigate} />
    </main>
  );
}
