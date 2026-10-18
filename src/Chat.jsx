import React, { useEffect, useRef, useState } from "react";
import WindowView from "./window/WindowView";
import { useScene } from "./window/useScene";
import { useAvatars } from "./useAvatars";
import {
  STICKER_BASE,
  clockTime,
  defaultSettings,
  loadLog,
  loadSettings,
  saveLog,
  saveSettings,
  shortTime,
  stickers,
} from "./chatLog";
import wangshu from "./assets/chat/wangshu.webp";

// Our chat, by the same window as home: the weather outside shows through,
// the bubbles are frosted glass, and the paw opens the little fox stickers.

function PawIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="25" rx="8" ry="7" />
      <ellipse cx="10" cy="17" rx="4" ry="5" />
      <ellipse cx="17" cy="12" rx="4" ry="5" />
      <ellipse cx="25" cy="12" rx="4" ry="5" />
      <ellipse cx="32" cy="17" rx="4" ry="5" />
    </svg>
  );
}

function Avatar({ src, fallback }) {
  return (
    <span className="chat-avatar">
      {src ? <img src={src} alt="" /> : <b>{fallback}</b>}
    </span>
  );
}

function AvatarSetting({ label, src, fallback, custom, onPick, onReset }) {
  const input = useRef(null);
  return (
    <div className="chat-setting-row">
      <Avatar src={src} fallback={fallback} />
      <span>{label}</span>
      <button onClick={() => input.current?.click()}>换一张</button>
      {custom && <button onClick={onReset}>换回来</button>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

// a quiet date line wherever a new day starts
function withDays(log) {
  const out = [];
  let lastDay = "";
  for (const message of log) {
    const d = new Date(message.at);
    const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (day !== lastDay) {
      const label = shortTime(message.at);
      out.push({ divider: true, id: `day-${day}`, label: label.includes(":") ? "今天" : label });
      lastDay = day;
    }
    out.push(message);
  }
  return out;
}

export default function Chat({ onBack, dayCount }) {
  const { scene } = useScene();
  const avatars = useAvatars();
  const [log, setLog] = useState(loadLog);
  const [settings, setSettings] = useState(loadSettings);
  const [input, setInput] = useState("");
  const [panel, setPanel] = useState(null); // null | "stickers" | "settings"
  const bottom = useRef(null);

  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [log.length]);

  function send(message) {
    setLog((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, from: "me", at: Date.now(), ...message },
    ]);
  }

  function sendText() {
    const text = input.trim();
    if (!text) return;
    send({ text });
    setInput("");
  }

  function sendSticker(file) {
    send({ sticker: file });
    setPanel(null);
  }

  const toggle = (name) => setPanel((current) => (current === name ? null : name));

  return (
    <main className="chat-page" data-dark={scene !== "day" || undefined}>
      <WindowView scene={scene} />

      <header className="glass chat-header">
        <button className="round-button plain" onClick={onBack} aria-label="返回">
          ←
        </button>
        <Avatar src={avatars.him || wangshu} />
        <div className="chat-title">
          <h1>{settings.name}</h1>
          <span>在一起的第 {dayCount} 天</span>
        </div>
        <button
          className="round-button plain"
          onClick={() => toggle("settings")}
          aria-label="聊天设置"
          aria-expanded={panel === "settings"}
        >
          ⋯
        </button>
      </header>

      {panel === "settings" && (
        <section className="glass chat-settings">
          <label className="chat-setting-row">
            <span>名字</span>
            <input
              value={settings.name}
              onChange={(event) => setSettings({ ...settings, name: event.target.value })}
              onBlur={() => !settings.name.trim() && setSettings(defaultSettings)}
            />
          </label>
          <AvatarSetting
            label="他的头像"
            src={avatars.him || wangshu}
            custom={Boolean(avatars.him)}
            onPick={(file) => avatars.pick("him", file)}
            onReset={() => avatars.reset("him")}
          />
          <AvatarSetting
            label="我的头像"
            src={avatars.me}
            fallback="曦"
            custom={Boolean(avatars.me)}
            onPick={(file) => avatars.pick("me", file)}
            onReset={() => avatars.reset("me")}
          />
        </section>
      )}

      <section className="chat-messages" onClick={() => panel && setPanel(null)}>
        {withDays(log).map((item) => {
          if (item.divider) {
            return (
              <p key={item.id} className="chat-day">
                {item.label}
              </p>
            );
          }
          if (item.from === "note") {
            return (
              <p key={item.id} className="vellum chat-note">
                {item.text}
              </p>
            );
          }
          const mine = item.from === "me";
          return (
            <div key={item.id} className={`chat-row ${mine ? "mine" : ""}`}>
              {mine ? (
                <Avatar src={avatars.me} fallback="曦" />
              ) : (
                <Avatar src={avatars.him || wangshu} />
              )}
              <div className="chat-said">
                {item.sticker ? (
                  <img className="chat-sticker" src={STICKER_BASE + item.sticker} alt="表情" loading="lazy" />
                ) : (
                  <p className="chat-bubble">{item.text}</p>
                )}
                <time>{clockTime(item.at)}</time>
              </div>
            </div>
          );
        })}
        <i ref={bottom} />
      </section>

      <footer className="chat-compose">
        {panel === "stickers" && (
          <div className="glass chat-stickers" role="listbox" aria-label="表情">
            {stickers.map((file) => (
              <button key={file} onClick={() => sendSticker(file)} aria-label={file}>
                <img src={STICKER_BASE + file} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <div className="glass chat-compose-bar">
          <button
            className={`chat-paw ${panel === "stickers" ? "active" : ""}`}
            onClick={() => toggle("stickers")}
            aria-label="表情"
            aria-expanded={panel === "stickers"}
          >
            <PawIcon />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) sendText();
            }}
            onFocus={() => setPanel(null)}
            placeholder="写点什么……"
            enterKeyHint="send"
          />
          <button className="chat-send" onClick={sendText} disabled={!input.trim()} aria-label="发送">
            ↑
          </button>
        </div>
      </footer>
    </main>
  );
}
