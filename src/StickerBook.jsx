import React, { useState } from "react";
import HomeNav from "./HomeNav";
import { burstFrom } from "./burst";
import { ChangeMenu, useHoldToChange, usePictures } from "./PictureSlot";

// The "more" page: a sheet of stickers, each one a door into a little
// corner of the world. They're torn off by hand, so no two edges are the
// same and none of them sit straight. Until 羲和's drawings arrive each one
// is a small drawing of its own; hold a sticker to put his picture on it.

const stickers = [
  { id: "invite", label: "结婚请帖", page: "invite", tilt: -5, x: 4, y: 0, w: 46, art: "invite" },
  { id: "memories", label: "回忆", tilt: 4, x: 56, y: 3, w: 38, art: "polaroid" },
  { id: "calendar", label: "纪念日", tilt: 6, x: 8, y: 50, w: 36, art: "calendar" },
  { id: "promise", label: "拉钩本", tilt: -4, x: 50, y: 58, w: 44, art: "promise" },
];

// a hand-torn outline: points walk round the edge with a little wobble,
// the same for a sticker every time
function tornEdge(seed) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pts = [];
  const side = (from, to, fixed, horizontal) => {
    for (let i = 0; i <= 9; i += 1) {
      const t = from + ((to - from) * i) / 9;
      const jag = fixed + (rand() - 0.5) * 3.2 * (fixed < 50 ? 1 : -1);
      const along = t + (rand() - 0.5) * 1.5;
      pts.push(horizontal ? `${along.toFixed(1)}% ${jag.toFixed(1)}%` : `${jag.toFixed(1)}% ${along.toFixed(1)}%`);
    }
  };
  side(1.5, 98.5, 1.6, true); // top, left to right
  side(1.5, 98.5, 98.4, false); // right, top to bottom
  side(98.5, 1.5, 98.4, true); // bottom, right to left
  side(98.5, 1.5, 1.6, false); // left, bottom to top
  return `polygon(${pts.join(", ")})`;
}

// small drawings standing in for the real stickers
function Art({ kind }) {
  if (kind === "invite")
    return (
      <svg viewBox="0 0 120 90" aria-hidden="true">
        <rect x="8" y="16" width="104" height="66" rx="4" fill="#fbf1e6" stroke="#c99a8a" />
        <path d="M8 18 L60 54 L112 18" fill="none" stroke="#c99a8a" strokeWidth="1.4" />
        <path d="M60 46 c-5-8-16-3-11 5 l11 10 11-10 c5-8-6-13-11-5z" fill="#b8434a" />
        <path d="M40 10 q6 8 0 14 M80 10 q-6 8 0 14" stroke="#b8434a" strokeWidth="2" fill="none" />
        <circle cx="96" cy="70" r="5" fill="none" stroke="#c9a45c" strokeWidth="1.6" />
        <circle cx="99" cy="68" r="4.4" fill="#fbf1e6" />
        <circle cx="93" cy="76" r="1.6" fill="#a8323a" />
        <path d="M20 74 q4-8 8 0 q4-8 8 0" stroke="#7d9bc4" strokeWidth="1.6" fill="none" />
      </svg>
    );
  if (kind === "polaroid")
    return (
      <svg viewBox="0 0 100 110" aria-hidden="true">
        <rect x="14" y="10" width="72" height="88" rx="2" fill="#fffdf8" stroke="#d9cfc6" transform="rotate(-4 50 54)" />
        <rect x="21" y="17" width="58" height="56" fill="#b9c8de" transform="rotate(-4 50 54)" />
        <path d="M38 40 c-4-7-14-3-10 4 l10 9 10-9 c4-7-6-11-10-4z" fill="#fff" opacity=".85" transform="rotate(-4 50 54)" />
        <circle cx="60" cy="30" r="1.6" fill="#fff" />
        <circle cx="68" cy="52" r="1.2" fill="#fff" />
        <rect x="34" y="4" width="34" height="11" fill="#f2b8c6" opacity=".85" transform="rotate(6 50 9)" />
      </svg>
    );
  if (kind === "calendar")
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect x="14" y="18" width="72" height="72" rx="4" fill="#fffdf8" stroke="#d9cfc6" />
        <rect x="14" y="18" width="72" height="18" rx="4" fill="#b8434a" />
        <circle cx="32" cy="18" r="3" fill="#7d9bc4" />
        <circle cx="68" cy="18" r="3" fill="#7d9bc4" />
        <text x="50" y="76" textAnchor="middle" fontSize="38" fontFamily="Georgia, serif" fill="#5a4a52">3</text>
        <ellipse cx="50" cy="63" rx="20" ry="17" fill="none" stroke="#b8434a" strokeWidth="1.8" transform="rotate(-8 50 63)" />
        <path d="M76 40 l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#e2bd5f" />
      </svg>
    );
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <path d="M14 66 q14-30 40-24 q8 2 6 8 q-2 5-10 4" fill="#f3d4bf" stroke="#c99a8a" strokeWidth="1.4" />
      <path d="M106 66 q-14-30-40-24 q-8 2-6 8 q2 5 10 4" fill="#f6dccb" stroke="#c99a8a" strokeWidth="1.4" />
      <path d="M50 50 q10-10 20 0" fill="none" stroke="#c99a8a" strokeWidth="2.4" />
      <path d="M20 70 q8 4 14 0" stroke="#b8434a" strokeWidth="2" fill="none" />
      <circle cx="27" cy="73" r="2.4" fill="#a8323a" />
      <path d="M60 24 c-4-7-13-3-9 4 l9 8 9-8 c4-7-5-11-9-4z" fill="#e58a9a" />
    </svg>
  );
}

function Sticker({ item, picture, onPick, onReset, onOpen }) {
  const [wiggle, setWiggle] = useState(false);
  const { editing, setEditing, handlers } = useHoldToChange((event) => {
    const el = event.currentTarget;
    if (item.page) {
      burstFrom(el, "sparkle");
      onOpen(item.page);
      return;
    }
    // not drawn yet: a little shake, and a note that it's coming
    setWiggle(true);
    setTimeout(() => setWiggle(false), 600);
  });

  return (
    <figure
      className={`sticker ${editing ? "is-editing" : ""} ${wiggle ? "is-wiggling" : ""}`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, "--tilt": `${item.tilt}deg` }}
      {...handlers}
    >
      <div className="sticker-paper" style={{ clipPath: tornEdge(item.id.length * 7 + item.tilt) }}>
        {picture ? <img src={picture} alt="" draggable="false" /> : <Art kind={item.art} />}
        <i className="sticker-peel" />
      </div>
      <figcaption className="sticker-label" style={{ clipPath: tornEdge(item.id.length + 3) }}>
        {item.label}
        {!item.page && <small>画着呢</small>}
      </figcaption>
      {editing && (
        <ChangeMenu
          custom={Boolean(picture)}
          onPick={(file) => onPick(`sticker-${item.id}`, file)}
          onReset={() => onReset(`sticker-${item.id}`)}
          onClose={() => setEditing(false)}
        />
      )}
    </figure>
  );
}

export default function StickerBook({ onOpen, scene }) {
  const { pictures, pick, reset } = usePictures(
    stickers.map((s) => `sticker-${s.id}`),
    { raw: true }
  );

  return (
    <main className="sticker-page" data-dark={scene !== "day" || undefined}>
      <header className="chat-list-header">
        <div>
          <p className="journal-label">STICKER BOOK · 贴纸本</p>
          <h1>更多</h1>
        </div>
      </header>

      <section className="sticker-sheet">
        <p className="sticker-note">撕下来一张，就是一扇小门。</p>
        <div className="sticker-board">
          {stickers.map((item) => (
            <Sticker
              key={item.id}
              item={item}
              picture={pictures[`sticker-${item.id}`]}
              onPick={pick}
              onReset={reset}
              onOpen={onOpen}
            />
          ))}
        </div>
        <p className="sticker-hint">长按贴纸，可以换成羲和画的那张</p>
      </section>

      <HomeNav active="more" onOpen={onOpen} />
    </main>
  );
}
