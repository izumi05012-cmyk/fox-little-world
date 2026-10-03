import React, { useEffect, useRef, useState } from "react";
import foxHead from "./assets/fox-head.svg";

const STORAGE_KEY = "fox-little-world-chat-settings";

const defaultSettings = {
  myAvatar: {
    type: "image",
    source: "default",
    value: foxHead,
    label: "小狐狸",
  },

  otherAvatar: {
    type: "image",
    source: "default",
    value: foxHead,
    label: "小狐狸",
  },

  background: {
    type: "color",
    source: "default",
    value: "#f5efe4",
  },
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultSettings;
    }

    const parsed = JSON.parse(saved);

    return {
      ...defaultSettings,
      ...parsed,

      myAvatar: {
        ...defaultSettings.myAvatar,
        ...(parsed.myAvatar || {}),
      },

      otherAvatar: {
        ...defaultSettings.otherAvatar,
        ...(parsed.otherAvatar || {}),
      },

      background: {
        ...defaultSettings.background,
        ...(parsed.background || {}),
      },
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // 本地存储不可用时保持当前页面状态即可。
  }
}

function Avatar({ avatar, className = "" }) {
  return (
    <div className={`avatar ${className}`}>
      <img
        src={avatar.value || foxHead}
        alt={avatar.label || "头像"}
      />
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.type === "voice") {
    return (
      <div className="message-bubble voice-bubble">
        <span className="voice-play">▶</span>

        <span className="voice-wave">
          ·│·│··││·│··│
        </span>

        <span className="voice-length">
          {message.duration}
        </span>
      </div>
    );
  }

  if (message.type === "typing") {
    return (
      <div className="message-bubble typing-bubble">
        <span>•</span>
        <span>•</span>
        <span>•</span>
      </div>
    );
  }

  return (
    <div className="message-bubble">
      {message.text}
    </div>
  );
}

export default function Chat({ onBack }) {
  const [input, setInput] = useState("");

  const [settings, setSettings] = useState(loadSettings);

  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "other",
      text: "今天吃饭了吗？",
      time: "12:34",
    },

    {
      id: 2,
      from: "me",
      text: "吃了！你呢？",
      time: "12:36",
      read: true,
    },

    {
      id: 3,
      from: "other",
      text: "我还没有… 好饿啊",
      time: "12:37",
    },

    {
      id: 4,
      from: "me",
      text: "那我们一起吃吧～",
      time: "12:38",
      read: true,
    },

    {
      id: 5,
      from: "other",
      text: "好耶！吃什么？",
      time: "12:40",
    },

    {
      id: 6,
      from: "me",
      text: "火锅怎么样？\n我想吃很久了！",
      time: "12:41",
      read: true,
    },

    {
      id: 7,
      from: "other",
      type: "typing",
      time: "12:42",
    },
  ]);

  const myAvatarInput = useRef(null);
  const otherAvatarInput = useRef(null);
  const backgroundInput = useRef(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function readImage(file, callback) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        callback(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  function changeMyAvatar(event) {
    const file = event.target.files?.[0];

    readImage(file, (value) => {
      setSettings((current) => ({
        ...current,

        myAvatar: {
          type: "image",
          source: "upload",
          value,
          label: "我的头像",
        },
      }));
    });

    event.target.value = "";
  }

  function changeOtherAvatar(event) {
    const file = event.target.files?.[0];

    readImage(file, (value) => {
      setSettings((current) => ({
        ...current,

        otherAvatar: {
          type: "image",
          source: "upload",
          value,
          label: "对方头像",
        },
      }));
    });

    event.target.value = "";
  }

  function changeBackground(event) {
    const file = event.target.files?.[0];

    readImage(file, (value) => {
      setSettings((current) => ({
        ...current,

        background: {
          type: "image",
          source: "upload",
          value,
        },
      }));
    });

    event.target.value = "";
  }

  function resetMyAvatar() {
    setSettings((current) => ({
      ...current,
      myAvatar: {
        ...defaultSettings.myAvatar,
      },
    }));
  }

  function resetOtherAvatar() {
    setSettings((current) => ({
      ...current,
      otherAvatar: {
        ...defaultSettings.otherAvatar,
      },
    }));
  }

  function resetBackground() {
    setSettings((current) => ({
      ...current,
      background: {
        ...defaultSettings.background,
      },
    }));
  }

  function sendMessage() {
    const text = input.trim();

    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        from: "me",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: true,
      },
    ]);

    setInput("");
  }

  const chatStyle =
    settings.background.type === "image"
      ? {
          backgroundImage: `
            linear-gradient(
              rgba(245, 239, 228, 0.72),
              rgba(245, 239, 228, 0.72)
            ),
            url("${settings.background.value}")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }
      : {
          background: settings.background.value,
        };

  return (
    <main
      className="chat-page"
      style={chatStyle}
    >
      <header className="chat-header">
        <button
          className="chat-back"
          onClick={onBack}
          aria-label="返回首页"
        >
          ‹
        </button>

        <Avatar avatar={settings.otherAvatar} />

        <div className="chat-title">
          <h1>
            Bunny & Elliott
            <span className="title-heart">♥</span>
          </h1>

          <span>在线 · 一起的第 102 天</span>
        </div>

        <div className="chat-header-actions">
          <button aria-label="通话">
            ♡
          </button>

          <button
            onClick={() =>
              setShowSettings((current) => !current)
            }
            aria-label="聊天设置"
          >
            ⋮
          </button>
        </div>
      </header>

      {showSettings && (
        <section className="chat-settings">
          <div className="settings-title">
            <span>CHAT SETTINGS</span>

            <button
              onClick={() => setShowSettings(false)}
              aria-label="关闭设置"
            >
              ×
            </button>
          </div>

          <div className="settings-section">
            <p>我的头像</p>

            <div className="custom-setting">
              <Avatar
                avatar={settings.myAvatar}
                className="settings-avatar"
              />

              <div className="setting-info">
                <strong>
                  {settings.myAvatar.source === "upload"
                    ? "自定义头像"
                    : "默认狐狸"}
                </strong>

                <small>
                  {settings.myAvatar.source === "upload"
                    ? "来自本机图片"
                    : "Fox Little World"}
                </small>
              </div>

              <div className="setting-actions">
                <button
                  onClick={() =>
                    myAvatarInput.current?.click()
                  }
                >
                  更换
                </button>

                {settings.myAvatar.source === "upload" && (
                  <button onClick={resetMyAvatar}>
                    恢复
                  </button>
                )}
              </div>
            </div>

            <input
              ref={myAvatarInput}
              className="hidden-file-input"
              type="file"
              accept="image/*"
              onChange={changeMyAvatar}
            />
          </div>

          <div className="settings-section">
            <p>对方头像</p>

            <div className="custom-setting">
              <Avatar
                avatar={settings.otherAvatar}
                className="settings-avatar"
              />

              <div className="setting-info">
                <strong>
                  {settings.otherAvatar.source === "upload"
                    ? "自定义头像"
                    : "默认狐狸"}
                </strong>

                <small>
                  {settings.otherAvatar.source === "upload"
                    ? "来自本机图片"
                    : "Fox Little World"}
                </small>
              </div>

              <div className="setting-actions">
                <button
                  onClick={() =>
                    otherAvatarInput.current?.click()
                  }
                >
                  更换
                </button>

                {settings.otherAvatar.source === "upload" && (
                  <button onClick={resetOtherAvatar}>
                    恢复
                  </button>
                )}
              </div>
            </div>

            <input
              ref={otherAvatarInput}
              className="hidden-file-input"
              type="file"
              accept="image/*"
              onChange={changeOtherAvatar}
            />
          </div>

          <div className="settings-section">
            <p>聊天背景</p>

            <div className="background-setting">
              <div
                className="background-preview-large"
                style={
                  settings.background.type === "image"
                    ? {
                        backgroundImage:
                          `url("${settings.background.value}")`,
                      }
                    : {
                        background:
                          settings.background.value,
                      }
                }
              />

              <div className="background-setting-info">
                <strong>
                  {settings.background.source === "upload"
                    ? "自定义背景"
                    : "米白纸张"}
                </strong>

                <small>
                  {settings.background.source === "upload"
                    ? "来自本机图片"
                    : "Fox Little World"}
                </small>
              </div>

              <div className="setting-actions">
                <button
                  onClick={() =>
                    backgroundInput.current?.click()
                  }
                >
                  更换
                </button>

                {settings.background.source === "upload" && (
                  <button onClick={resetBackground}>
                    恢复
                  </button>
                )}
              </div>
            </div>

            <input
              ref={backgroundInput}
              className="hidden-file-input"
              type="file"
              accept="image/*"
              onChange={changeBackground}
            />
          </div>

          <p className="settings-note">
            当前设置保存在这台设备的浏览器中。
            <br />
            以后接入云端后，可以继续扩展为双设备同步。
          </p>
        </section>
      )}

      <section className="messages">
        <div className="chat-date">
          <span>—</span>
          <strong>Sep. 22 · Tue</strong>
          <span>—</span>
        </div>

        {messages.map((message) => {
          const avatar =
            message.from === "me"
              ? settings.myAvatar
              : settings.otherAvatar;

          return (
            <div
              key={message.id}
              className={`message-row ${message.from}`}
            >
              <Avatar avatar={avatar} />

              <div className="message-content">
                <MessageBubble message={message} />

                <div className="message-meta">
                  {message.from === "me" && message.read && (
                    <span className="read-state">
                      已读 <span>♣</span>
                    </span>
                  )}

                  <time>{message.time}</time>
                </div>
              </div>
            </div>
          );
        })}

        <div className="chat-ending">
          <div className="ending-line" />

          <div className="ending-flower">✿</div>

          <div className="ending-line" />

          <div className="ending-fox">
            <img src={foxHead} alt="" />
          </div>
        </div>
      </section>

      <div className="chat-input">
        <button
          className="input-plus"
          aria-label="更多"
        >
          ＋
        </button>

        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="输入一点什么..."
        />

        <button
          className="input-paw"
          aria-label="发送"
          onClick={sendMessage}
        >
          <span>●</span>
          <span>●</span>
          <span>●</span>
        </button>
      </div>

      <div className="chat-tools">
        <button aria-label="图片">▧</button>
        <button aria-label="相机">□</button>
        <button aria-label="表情">☺</button>
        <button aria-label="语音">♩</button>
      </div>
    </main>
  );
}
