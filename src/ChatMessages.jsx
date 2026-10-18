import React, { useRef, useState } from "react";
import { STICKER_BASE, clockTime, shortTime } from "./chatLog";
import { burst, burstFrom } from "./burst";

// The conversation itself: bubbles from the same person close together
// form one group (avatar and time only on the last), a narration line
// like *抱住你* or （抱住你） sits in the middle in italics, and each
// bubble can be quoted, copied, hearted or deleted.

const GROUP_MS = 3 * 60 * 1000;
const RECALL_MS = 2 * 60 * 1000;

// two taps close together, on phones and with a mouse alike
function doubleTap(callback) {
  let last = 0;
  return (event) => {
    event.stopPropagation();
    const now = Date.now();
    if (now - last < 400) {
      callback(event);
      last = 0;
    } else last = now;
  };
}

// a voice message: a little glass pill with sound waves and seconds,
// longer for longer messages; tap to play, tap again to stop
function Voice({ message, url, mine }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  function toggle(event) {
    event.stopPropagation();
    if (!url) return;
    if (!audio.current) {
      audio.current = new Audio(url);
      audio.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audio.current.pause();
      audio.current.currentTime = 0;
      setPlaying(false);
    } else {
      audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }
  const width = Math.min(220, 74 + (message.seconds || 1) * 6);
  return (
    <button
      className={`chat-bubble chat-voice ${playing ? "is-playing" : ""} ${mine ? "mine" : ""}`}
      style={{ width }}
      onClick={toggle}
      aria-label={`语音 ${message.seconds} 秒`}
    >
      <span className="chat-voice-waves" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{message.seconds}&apos;&apos;</span>
    </button>
  );
}
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
    if (message.from === "note" || message.from === "pat" || message.from === "recalled") {
      out.push({ kind: message.from, message });
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
  } else if (message.voice) {
    body = <Voice message={message} url={images[message.voice]} mine={message.from === "me"} />;
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
  onPat,
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
        if (item.kind === "pat") {
          const who = message.who === "him" ? `「${name}」的狐狸尾巴` : "自己";
          return (
            <p key={message.id} className="chat-pat">
              我拍了拍{who}
            </p>
          );
        }
        if (item.kind === "recalled") {
          return (
            <p key={message.id} className="chat-pat">
              你撤回了一条消息
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
            <span
              className="chat-pat-target"
              onClick={doubleTap((event) => {
                burst(event.clientX, event.clientY, "paw");
                onPat(mine ? "me" : "him");
              })}
            >
              {mine ? meAvatar : himAvatar}
            </span>
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
                  {mine && Date.now() - message.at < RECALL_MS && (
                    <button onClick={() => onAction("recall", message)}>撤回</button>
                  )}
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

