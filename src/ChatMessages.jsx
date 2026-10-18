import React, { useRef } from "react";
import { STICKER_BASE, clockTime, shortTime } from "./chatLog";
import { burst, burstFrom } from "./burst";

// The conversation itself: bubbles from the same person close together
// form one group (avatar and time only on the last), a narration line
// like *抱住你* or （抱住你） sits in the middle in italics, and each
// bubble can be quoted, copied, hearted or deleted.

const GROUP_MS = 3 * 60 * 1000;
const isAside = (m) => typeof m.text === "string" && /^(\*[^*]+\*|[（(][^）)]+[）)])$/.test(m.text.trim());

function dayKey(at) {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// date lines, narration, and which bubble ends its group
function layout(log) {
  const out = [];
  let lastDay = "";
  log.forEach((message, i) => {
    const day = dayKey(message.at);
    if (day !== lastDay) {
      const label = shortTime(message.at);
      out.push({ kind: "day", id: `day-${day}`, label: label.includes(":") ? "今天" : label });
      lastDay = day;
    }
    if (message.from === "note") {
      out.push({ kind: "note", message });
      return;
    }
    if (isAside(message)) {
      out.push({ kind: "aside", message });
      return;
    }
    const next = log[i + 1];
    const tail =
      !next ||
      next.from !== message.from ||
      next.at - message.at > GROUP_MS ||
      dayKey(next.at) !== day ||
      isAside(next);
    out.push({ kind: "said", message, tail });
  });
  return out;
}

function Bubble({ message, images, name, open, onMenu, onHeart }) {
  const press = useRef(null);
  const lastTap = useRef(0);

  const cancel = () => clearTimeout(press.current);
  const handlers = {
    onPointerDown: () => {
      press.current = setTimeout(() => onMenu(message.id), 450);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerMove: (event) => {
      if (Math.abs(event.movementX) + Math.abs(event.movementY) > 6) cancel();
    },
    onContextMenu: (event) => {
      event.preventDefault();
      onMenu(message.id);
    },
    onClick: (event) => {
      event.stopPropagation();
      const now = Date.now();
      if (now - lastTap.current < 400) {
        if (!message.heart) burst(event.clientX, event.clientY, "heart");
        onHeart(message.id);
      }
      lastTap.current = now;
    },
  };

  let body;
  if (message.sticker) {
    body = <img className="chat-sticker" src={STICKER_BASE + message.sticker} alt="表情" loading="lazy" draggable="false" />;
  } else if (message.image) {
    body = images[message.image] ? (
      <img className="chat-photo" src={images[message.image]} alt="图片" draggable="false" />
    ) : (
      <span className="chat-bubble chat-photo-missing">[图片]</span>
    );
  } else {
    body = <p className="chat-bubble">{message.text}</p>;
  }

  return (
    <div className={`chat-pressable ${open ? "is-open" : ""}`} {...handlers}>
      {message.quote && (
        <span className="chat-quote">
          {message.quote.from === "me" ? "我" : name}：{message.quote.text}
        </span>
      )}
      {body}
      {message.heart && (
        <i className="chat-heart" aria-label="喜欢">
          ♥
        </i>
      )}
    </div>
  );
}

export default function ChatMessages({
  log,
  images,
  name,
  meAvatar,
  himAvatar,
  menuFor,
  onMenu,
  onAction,
  bottomRef,
}) {
  // the last time he spoke: anything of mine before that has been read
  const lastHim = [...log].reverse().find((m) => m.from === "him")?.at ?? 0;

  return (
    <>
      {layout(log).map((item) => {
        if (item.kind === "day") {
          return (
            <p key={item.id} className="chat-day">
              {item.label}
            </p>
          );
        }
        const { message } = item;
        if (item.kind === "note") {
          return (
            <p key={message.id} className="vellum chat-note">
              {message.text}
            </p>
          );
        }
        if (item.kind === "aside") {
          return (
            <p
              key={message.id}
              className="chat-aside"
              onContextMenu={(event) => {
                event.preventDefault();
                onMenu(message.id);
              }}
            >
              {message.text.trim().slice(1, -1)}
              {menuFor === message.id && (
                <span className="glass chat-menu">
                  <button onClick={() => onAction("delete", message)}>删除</button>
                </span>
              )}
            </p>
          );
        }
        const mine = message.from === "me";
        return (
          <div key={message.id} className={`chat-row ${mine ? "mine" : ""} ${item.tail ? "tail" : ""}`}>
            {mine ? meAvatar : himAvatar}
            <div className="chat-said">
              <Bubble
                message={message}
                images={images}
                name={name}
                open={menuFor === message.id}
                onMenu={onMenu}
                onHeart={(id) => onAction("heart", { id })}
              />
              {menuFor === message.id && (
                <span className="glass chat-menu" onClick={(event) => event.stopPropagation()}>
                  <button onClick={() => onAction("quote", message)}>引用</button>
                  {message.text && <button onClick={() => onAction("copy", message)}>复制</button>}
                  <button
                    onClick={(event) => {
                      if (!message.heart) burstFrom(event.currentTarget, "heart");
                      onAction("heart", message);
                    }}
                  >
                    {message.heart ? "取消 ♥" : "♥"}
                  </button>
                  <button onClick={() => onAction("delete", message)}>删除</button>
                </span>
              )}
              {item.tail && (
                <time>
                  {clockTime(message.at)}
                  {mine && <b>{message.at <= lastHim ? " 已读" : " 送达"}</b>}
                </time>
              )}
            </div>
          </div>
        );
      })}
      <i ref={bottomRef} />
    </>
  );
}

