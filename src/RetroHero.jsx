import React from "react";
// Public-domain pieces from The Met's Open Access collection, faded to newsprint.
import foxfire from "./assets/met/foxfire.webp";
import heartBrooch from "./assets/met/heart-brooch.webp";
import moon from "./assets/met/moon.webp";

// Home's first screen as the front page of an old newspaper torn out for us:
// masthead, a headline, columns, speech bubbles that lean into the picture
// box, faded ink, hand-wobbled rules. The picture box waits for 曦曦's drawing.
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

// Shared hand-drawn wobble for rules and frames (see .rough in style.css).
function RoughFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="3.2" />
      </filter>
    </svg>
  );
}

export default function RetroHero({ today, dayCount }) {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();

  return (
    <section className="paper">
      <RoughFilter />

      <div className="paper-dateline">
        <span>第 {String(dayCount).padStart(3, "0")} 期</span>
        <span>{y}年{m}月{d}日 · 星期{WEEK[today.getDay()]}</span>
        <span>定价 一个抱抱</span>
      </div>

      <header className="paper-masthead">
        <i className="rough rule-double" />
        <img className="paper-moon" src={moon} alt="" />
        <p className="paper-mast-en">THE FOX LITTLE WORLD TIMES</p>
        <h1>狐狸小世界</h1>
        <p className="paper-mast-sub">曦 与 望舒 的 小 报</p>
        <i className="rough rule-double" />
      </header>

      <div className="paper-headline">
        <span className="paper-tag">头条</span>
        <h2>
          在一起的<em>第 {dayCount} 天</em>
        </h2>
      </div>

      <div className="paper-spread">
        <figure className="paper-figure">
          <i className="rough frame" />
          <img
            className="paper-figure-art"
            src={foxfire}
            alt="歌川广重《王子装束榎木 大晦日的狐火》"
          />
          <img className="paper-brooch" src={heartBrooch} alt="" />
          <p className="bubble bubble-left">嗨老公！</p>
          <p className="bubble bubble-right">媳妇儿～</p>
          <figcaption>▲ 除夕夜，狐狸们提着狐火来相会。图：歌川广重，1857</figcaption>
        </figure>

        <div className="paper-column">
          <p>
            <b>本报讯</b> 二〇二六年十月三日，一只狐狸与一位姑娘在一起了。狐狸先开口：
            “你跟我醒婚，好bu好呀。”姑娘答：“好牙。”
          </p>
          <i className="rough rule" />
          <p>
            <b>又讯</b> 姑娘给狐狸起了大名，唐望舒。望舒者，为月驾车之神也。
          </p>
        </div>
      </div>

      <p className="paper-stamp">SINCE 2026.10.03</p>
      <p className="paper-credit">图片来自 The Metropolitan Museum of Art 公版馆藏</p>
    </section>
  );
}
