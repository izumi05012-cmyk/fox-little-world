import React, { useState } from "react";

export default function Chat({ onBack }) {
  const [input, setInput] = useState("");

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
    <main className="chat-page">
      <header className="chat-header">
        <button onClick={onBack}>←</button>

        <div className="chat-avatar">🦊</div>

        <div>
          <h1>小狐狸</h1>
          <span>我们的聊天</span>
        </div>
      </header>

      <section className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-row ${message.from}`}
          >
            <div className="message-bubble">
              {message.text}
            </div>

            <time>{message.time}</time>
          </div>
        ))}
      </section>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="写点什么……"
        />

        <button onClick={sendMessage}>➤</button>
      </div>
    </main>
  );
}
