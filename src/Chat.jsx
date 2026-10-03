import React, { useState } from "react";
import foxHead from "./assets/fox-head.svg";

const avatarOptions = [
  { id: "fox", label: "小狐狸", type: "image", value: foxHead },
  { id: "bunny", label: "小兔子", type: "emoji", value: "🐰" },
  { id: "bear", label: "小熊", type: "emoji", value: "🐻" },
  { id: "cat", label: "小猫", type: "emoji", value: "🐱" },
];

const backgroundOptions = [
  { id: "paper", label: "米白纸张" },
  { id: "warm", label: "暖棕纸张" },
  { id: "rose", label: "淡粉纸张" },
  { id: "cream", label: "奶油纸张" },
];

function Avatar({ avatar, className = "" }) {
  if (avatar.type === "image") {
    return (
      <div className={`avatar ${className}`}>
        <img src={avatar.value} alt={avatar.label} />
      </div>
    );
  }

  return (
    <div className={`avatar avatar-emoji ${className}`}>
      {avatar.value}
    </div>
  );
}

export default function Chat({ onBack }) {
  const [input, setInput] = useState("");

  const [myAvatar, setMyAvatar] = useState(avatarOptions[1]);
  const [otherAvatar, setOtherAvatar] = useState(avatarOptions[0]);

  const [background, setBackground] = useState("paper");
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([
    { from: "other", text: "今天吃饭了吗？", time: "20:18" },
    { from: "me", text: "吃了！你呢？", time: "20:19" },
    { from: "other", text: "我也吃啦 🦊", time: "20:20" },
  ]);

  function sendMessage() {
    const text = input.trim();

    if (!text) return;

    setMessages([
      ...messages,
      {
        from: "me",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
  }

  return (
    <main className={`chat-page chat-bg-${background}`}>
      <header className="chat-header">
        <button
          className="chat-back"
          onClick={onBack}
          aria-label="返回首页"
        >
          ←
        </button>

        <Avatar avatar={otherAvatar} />

        <div className="chat-title">
          <h1>小狐狸</h1>
          <span>我们的聊天</span>
        </div>

        <button
          className="chat-settings-button"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="聊天设置"
        >
          ⋯
        </button>
      </header>

      {showSettings && (
        <section className="chat-settings">
          <div className="settings-title">
            <span>CHAT SETTINGS</span>
            <button onClick={() => setShowSettings(false)}>×</button>
          </div>

          <div className="settings-section">
            <p>我的头像</p>

            <div className="avatar-options">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  className={
                    myAvatar.id === avatar.id ? "selected" : ""
                  }
                  onClick={() => setMyAvatar(avatar)}
                >
                  <Avatar avatar={avatar} />
                  <small>{avatar.label}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <p>对方头像</p>

            <div className="avatar-options">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  className={
                    otherAvatar.id === avatar.id ? "selected" : ""
                  }
                  onClick={() => setOtherAvatar(avatar)}
                >
                  <Avatar avatar={avatar} />
                  <small>{avatar.label}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <p>聊天背景</p>

            <div className="background-options">
              {backgroundOptions.map((item) => (
                <button
                  key={item.id}
                  className={
                    background === item.id ? "selected" : ""
                  }
                  onClick={() => setBackground(item.id)}
                >
                  <span
                    className={`background-preview preview-${item.id}`}
                  />
                  <small>{item.label}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="messages">
        <div className="chat-date">TODAY · 20:18</div>

        {messages.map((message, index) => {
          const avatar =
            message.from === "me" ? myAvatar : otherAvatar;

          return (
            <div
              key={index}
              className={`message-row ${message.from}`}
            >
              <Avatar avatar={avatar} />

              <div className="message-content">
                <div className="message-bubble">
                  {message.text}
                </div>

                <time>{message.time}</time>
              </div>
            </div>
          );
        })}
      </section>

      <div className="chat-input">
        <button className="input-plus" aria-label="更多">
          ＋
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="写点什么……"
        />

        <button
          className="send-button"
          onClick={sendMessage}
          aria-label="发送"
        >
          ➤
        </button>
      </div>
    </main>
  );
}
