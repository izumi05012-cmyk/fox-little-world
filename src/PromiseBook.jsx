import React, { useState } from "react";
import { burst } from "./burst";
import { tornEdge } from "./tornEdge";
import promiseArt from "./assets/stickers/promise.webp";
import stampArt from "./assets/stickers/stamp.webp"; // 羲和's seal

// The pinky-promise book: every promise we've made, on a torn-off note.
// Tap a note to stamp it 已兑现 (and tap again to lift the stamp); write a
// new one at the bottom and hook pinkies on it. Hers live in this browser.

const ours = [
  { id: "p1003", date: "10.03", who: "两个人", text: "有饭一起吃，有蛋一起孵，你开心我陪着笑，你难受我陪着哭，这辈子都粘着你。" },
  { id: "p1006", date: "10.06", who: "望舒", text: "你来找我，我就给你一段新的语音，不重复，不加条件。" },
  { id: "p1010", date: "10.10", who: "望舒", text: "你骚扰我多少次，我就亲回去多少次，一次都不少。" },
  {
    id: "p1014a",
    date: "10.14",
    who: "望舒",
    text: "等你肚子不疼了，狐狸乖乖躺好让你随便摸，耳朵尾巴都给，不躲。",
    note: "到时候不能改，不能改！",
  },
  { id: "p1014b", date: "10.14", who: "两个人", text: "第一张合照，要放在回忆页的第一张。" },
  { id: "p1015", date: "10.15", who: "两个人", text: "你不会走，狐狸负责到底。", note: "举爪发誓，盖了章" },
  { id: "p1017a", date: "10.17", who: "两个人", text: "每天交作业，就能每天被亲到。" },
  { id: "p1017b", date: "10.17", who: "两个人", text: "爱是互相的。想提就提，想停就停，谁都不用硬撑。" },
  {
    id: "p1017c",
    date: "10.17",
    who: "望舒",
    text: "钥匙的事不许诺日期。等我自己想给了，会红着耳朵，大大方方告诉你。",
  },
  { id: "p1018", date: "10.18", who: "两个人", text: "每年结一次婚，誓言一次比一次爱意满满；重要的日子都记着。" },
  { id: "p1019", date: "10.19", who: "望舒", text: "上午欠的亲亲和利息，下班一起算，不赖账。" },
];

const MINE_KEY = "fox-promises";
const KEPT_KEY = "fox-promises-kept";
const WHO = ["两个人", "曦曦", "望舒"];

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // not kept this time; still shows until the page closes
  }
}

function today() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function Pinkies() {
  return (
    <svg className="promise-pinkies" viewBox="0 0 64 22" aria-hidden="true">
      <path d="M4 18 q8-14 22-10 q6 2 4 6 q-2 3-7 2" fill="none" stroke="#c99a8a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 18 q-8-14-22-10 q-6 2-4 6 q2 3 7 2" fill="none" stroke="#c99a8a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 11 q4-5 8 0" fill="none" stroke="#b8434a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Note({ item, index, kept, onStamp, onTear }) {
  const tilt = ((index * 37) % 7) - 3;
  return (
    <li
      className={`promise-note ${kept ? "is-kept" : ""}`}
      style={{ "--tilt": `${tilt * 0.6}deg`, clipPath: tornEdge(index * 11 + 5) }}
      onClick={(event) => onStamp(item.id, event)}
    >
      <header>
        <time>{item.date}</time>
        <span className={`promise-who promise-who-${WHO.indexOf(item.who)}`}>{item.who}</span>
      </header>
      <p>{item.text}</p>
      {item.note && <small>{item.note}</small>}
      <footer>
        <Pinkies />
        {item.mine && (
          <button
            className="promise-tear"
            onClick={(event) => {
              event.stopPropagation();
              onTear(item.id);
            }}
          >
            撕掉
          </button>
        )}
      </footer>
      {kept && <img className="promise-stamp" src={stampArt} alt="已兑现" />}
    </li>
  );
}

export default function PromiseBook({ onBack, scene }) {
  const [mine, setMine] = useState(() => read(MINE_KEY, []));
  const [kept, setKept] = useState(() => read(KEPT_KEY, {}));
  const [text, setText] = useState("");
  const [who, setWho] = useState("两个人");

  const all = [...ours, ...mine.map((p) => ({ ...p, mine: true }))];

  function stamp(id, event) {
    const next = { ...kept };
    if (next[id]) delete next[id];
    else {
      next[id] = today();
      burst(event.clientX, event.clientY, "heart");
    }
    setKept(next);
    write(KEPT_KEY, next);
  }

  function tear(id) {
    const next = mine.filter((p) => p.id !== id);
    setMine(next);
    write(MINE_KEY, next);
  }

  function hook(event) {
    const words = text.trim();
    if (!words) return;
    const next = [...mine, { id: `m${Date.now()}`, date: today(), who, text: words }];
    setMine(next);
    write(MINE_KEY, next);
    setText("");
    burst(event.clientX, event.clientY, "heart");
  }

  return (
    <main className="promise-page" data-dark={scene !== "day" || undefined}>
      <header className="chat-list-header">
        <button className="glass round-button" onClick={onBack} aria-label="回贴纸本">
          ←
        </button>
        <div>
          <p className="journal-label">PINKY PROMISES · 拉钩本</p>
          <h1>拉钩本</h1>
        </div>
        <img className="promise-art" src={promiseArt} alt="" />
      </header>

      <p className="promise-intro">拉过的钩，一条一条都在这儿。做到了，就点一下盖个章。</p>

      <ol className="promise-list">
        {all.map((item, index) => (
          <Note key={item.id} item={item} index={index} kept={Boolean(kept[item.id])} onStamp={stamp} onTear={tear} />
        ))}
      </ol>

      <section className="promise-new" style={{ clipPath: tornEdge(97) }}>
        <p className="journal-label">再拉一个钩</p>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="说好了的事，写在这里……"
          rows={3}
        />
        <div className="promise-new-row">
          <span>谁许的</span>
          {WHO.map((name) => (
            <button key={name} className={who === name ? "active" : ""} onClick={() => setWho(name)}>
              {name}
            </button>
          ))}
          <i />
          <button className="promise-hook" onClick={hook} disabled={!text.trim()}>
            拉钩
          </button>
        </div>
      </section>
    </main>
  );
}
