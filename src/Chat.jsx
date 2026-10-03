```jsx
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
        src={avatar?.value || foxHead}
        alt={avatar?.label || ""}
      />
    </div>
  );
}

export default function Chat({ onBack }) {
  const [input, setInput] = useState("");

  const [settings, setSettings] = useState(loadSettings);

  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([
    {
      from: "other",
      text: "今天吃饭了吗？",
      time: "20:18",
    },
    {
      from: "me",
      text: "吃了！你呢？",
      time: "20:19",
    },
    {
      from: "other",
      text: "我也吃啦 🦊",
      time: "20:20",
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

  const chatStyle =
    settings.background.type === "image"
      ? {
          backgroundImage: `
            linear-gradient(
              rgba(245, 239, 228, 0.74),
              rgba(245, 239, 228, 0.74)
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
          ←
        </button>

        <Avatar avatar={settings.otherAvatar} />

        <div className="chat-title">
          <h1>小狐狸</h1>
          <span>我们的聊天</span>
        </div>

        <button
          className="chat-settings-button"
          onClick={() =>
            setShowSettings((current) => !current)
          }
          aria-label="聊天设置"
        >
          ⋯
        </button>
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

          {/* 我的头像 */}

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

          {/* 对方头像 */}

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

          {/* 聊天背景 */}

          <div className="settings-section">
            <p>聊天背景</p>

            <div className="background-setting">
              <div
                className="background-preview-large"
                style={
                  settings.background.type === "image"
                    ? {
                        backgroundImage: `url("${settings.background.value}")`,
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
          TODAY · 20:18
        </div>

        {messages.map((message, index) => {
          const avatar =
            message.from === "me"
              ? settings.myAvatar
              : settings.otherAvatar;

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
```
