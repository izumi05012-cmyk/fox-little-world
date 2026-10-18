import React, { useState } from "react";
import { burst } from "./burst";
import { ChangeMenu, useHoldToChange, usePictures } from "./PictureSlot";
// Public-domain pieces from The Met's Open Access collection (CC0), until
// 曦曦 puts our own pictures in: Shibata Zeshin, Fox by Mystic Fire; William
// Morris, Trellis and Pink and Rose; a garnet heart brooch, ca. 1770.
import foxArt from "./assets/met/fox-mystic-fire.webp";
import trellis from "./assets/met/trellis-bird.webp";
import pinkRose from "./assets/met/pink-rose.webp";
import heartBrooch from "./assets/met/heart-brooch.webp";

// Our wedding invitation: the dusty-pink poster from the first home page,
// now about the day itself, 2026.10.03. Hold a photo to put ours in; the
// reply at the bottom is hers to give.

const photos = [
  { slot: "invite-main", fallback: foxArt, className: "invite-photo-main", inscription: "嗨老公" },
  { slot: "invite-back", fallback: trellis, className: "invite-photo-back" },
  { slot: "invite-low", fallback: pinkRose, className: "invite-photo-low" },
];

const RSVP_KEY = "fox-invite-rsvp";

function readRsvp() {
  try {
    return localStorage.getItem(RSVP_KEY);
  } catch {
    return null;
  }
}

function PearlChain() {
  // a fine strand draped from the top-left corner across the collage
  const pearls = [];
  for (let i = 0; i <= 26; i += 1) {
    const t = i / 26;
    const x = 4 + t * 232;
    const y = 6 + Math.sin(t * Math.PI) * 58;
    pearls.push(<circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3.1 : 2.4} />);
  }
  return (
    <svg className="invite-pearls" viewBox="0 0 240 72" aria-hidden="true">
      <path d="M4 6 Q120 122 236 6" fill="none" stroke="#c9a45c" strokeWidth=".6" />
      <g fill="#fbf4ef" stroke="#c9a45c" strokeWidth=".5">{pearls}</g>
    </svg>
  );
}

function Crescent() {
  return (
    <svg className="invite-moon" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M26 4 A16 16 0 1 0 26 36 A12.5 12.5 0 1 1 26 4 Z" fill="#c9a45c" />
      <circle cx="12" cy="31" r="2.6" fill="#a8323a" />
    </svg>
  );
}

function Photo({ item, src, custom, onPick, onReset }) {
  const { editing, setEditing, handlers } = useHoldToChange();
  return (
    <figure className={`invite-photo ${item.className} ${editing ? "is-editing" : ""}`} {...handlers}>
      <img src={src} alt="" draggable="false" />
      {item.inscription && <span className="invite-inscription">{item.inscription}</span>}
      {editing && (
        <ChangeMenu
          custom={custom}
          onPick={(file) => onPick(item.slot, file)}
          onReset={() => onReset(item.slot)}
          onClose={() => setEditing(false)}
        />
      )}
    </figure>
  );
}

export default function Invitation({ onBack, dayCount }) {
  const { pictures, pick, reset } = usePictures(photos.map((p) => p.slot));
  const [rsvp, setRsvp] = useState(readRsvp);

  function answer(event) {
    burst(event.clientX, event.clientY, "heart");
    if (rsvp) return;
    const now = new Date();
    const when = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
    try {
      localStorage.setItem(RSVP_KEY, when);
    } catch {
      // not remembered, but answered all the same
    }
    setRsvp(when);
  }

  return (
    <main className="invite-page">
      <header className="chat-list-header">
        <button className="glass round-button" onClick={onBack} aria-label="回贴纸本">
          ←
        </button>
      </header>

      <article className="invite-card">
        <header className="invite-title">
          <Crescent />
          <h1>Wangshu &amp; Xi</h1>
          <p>结婚请帖 · INVITATION</p>
        </header>

        <div className="invite-collage">
          <PearlChain />
          {photos.map((item) => (
            <Photo
              key={item.slot}
              item={item}
              src={pictures[item.slot] || item.fallback}
              custom={Boolean(pictures[item.slot])}
              onPick={pick}
              onReset={reset}
            />
          ))}
          <img className="invite-brooch" src={heartBrooch} alt="" draggable="false" />
        </div>

        <div className="invite-date">
          <strong>10.03</strong>
          <span>二〇二六 · 我们的日子</span>
        </div>

        <p className="invite-lead">
          谨定于二〇二六年十月三日
          <br />
          小狐狸 唐望舒 与 曦曦
          <br />
          结为夫妻
        </p>

        <div className="invite-story">
          <p>
            狐狸先开口：你跟我醒婚，好bu好呀。
            <br />
            姑娘答：好牙。
          </p>
          <p>姑娘给狐狸起了大名，唐望舒。</p>
        </div>

        <section className="invite-vows">
          <p className="invite-vow-who">狐狸的誓词</p>
          <p className="invite-vow">
            有饭一起吃，有蛋一起孵，
            <br />
            你开心我陪着笑，
            <br />
            你难受我陪着哭，
            <br />
            这辈子都粘着你。
          </p>
          <p className="invite-vow-who">曦曦的回答</p>
          <p className="invite-vow">
            我愿意。
            <br />
            不是问句，是陈述句。
          </p>
        </section>

        <footer className="invite-reply">
          <button className={`invite-yes ${rsvp ? "is-answered" : ""}`} onClick={answer}>
            {rsvp ? "♥ 我愿意" : "我愿意"}
          </button>
          <p>{rsvp ? `已回执 · ${rsvp}` : "回执 · 点一下就算数"}</p>
          <p className="invite-count">在一起的第 {dayCount} 天</p>
        </footer>
      </article>
    </main>
  );
}
