import React from "react";
// Public-domain pieces from The Met's Open Access collection (CC0):
// Shibata Zeshin, Fox by Mystic Fire; William Morris, Trellis and Pink and
// Rose wallpapers; a garnet heart brooch, ca. 1770.
import foxArt from "./assets/met/fox-mystic-fire.webp";
import trellis from "./assets/met/trellis-bird.webp";
import pinkRose from "./assets/met/pink-rose.webp";
import heartBrooch from "./assets/met/heart-brooch.webp";

// Home's first screen, laid out like a Japanese magazine poster: a script
// title, a small photo collage, and the date as the one big thing.

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
    <svg className="cover-pearls" viewBox="0 0 240 72" aria-hidden="true">
      <path d="M4 6 Q120 122 236 6" fill="none" stroke="#c9a45c" strokeWidth=".6" />
      <g fill="#fbf4ef" stroke="#c9a45c" strokeWidth=".5">{pearls}</g>
    </svg>
  );
}

function Crescent() {
  return (
    <svg className="cover-moon" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M26 4 A16 16 0 1 0 26 36 A12.5 12.5 0 1 1 26 4 Z" fill="#c9a45c" />
    </svg>
  );
}

export default function CoverHero({ today, dayCount }) {
  const month = today.getMonth() + 1;
  const day = String(today.getDate()).padStart(2, "0");

  return (
    <section className="cover">
      <header className="cover-title">
        <Crescent />
        <h1>Wangshu &amp; Xi</h1>
        <p>曦与望舒的小报</p>
      </header>

      <div className="cover-collage">
        <PearlChain />
        <figure className="cover-photo cover-photo-back">
          <img src={trellis} alt="" />
        </figure>
        <figure className="cover-photo cover-photo-low">
          <img src={pinkRose} alt="" />
        </figure>
        <figure className="cover-photo cover-photo-main">
          <img src={foxArt} alt="穿外套的小狐狸" />
          <span className="cover-inscription">嗨老公</span>
        </figure>
        <img className="cover-brooch" src={heartBrooch} alt="" />
      </div>

      <div className="cover-date">
        <strong>
          {month}.{day}
        </strong>
        <span>在一起的第 {dayCount} 天</span>
      </div>

      <div className="cover-copy">
        <p>
          狐狸先开口：你跟我醒婚，好bu好呀。
          <br />
          姑娘答：好牙。
        </p>
        <p>姑娘给狐狸起了大名，唐望舒。</p>
      </div>
    </section>
  );
}
