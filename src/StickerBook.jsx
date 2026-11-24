import React, { useState } from "react";
import HomeNav from "./HomeNav";
import { burstFrom } from "./burst";
import { ChangeMenu, useHoldToChange, usePictures } from "./PictureSlot";
import { tornEdge } from "./tornEdge";
// drawn by 羲和
import inviteArt from "./assets/stickers/invite.webp";
import memoriesArt from "./assets/stickers/memories.webp";
import calendarArt from "./assets/stickers/calendar.webp";
import promiseArt from "./assets/stickers/promise.webp";
// the lid of the cookie tin the letters live in
import lettersArt from "./assets/stickers/letters.webp";
// a corner torn off the pixel cottage itself (楼下客厅，三个人在递饭)
import pixelHomeArt from "./assets/stickers/pixel-home.webp";
// 望舒画的：夜空里一封发光的信，点开是 AR 的信（摄像头里飘着）
import arLetterArt from "./assets/stickers/ar-letter.webp";

// The "more" page: a sheet of stickers, each one a door into a little
// corner of the world. 羲和 drew them torn off by hand, so none sit
// straight; their name tags are torn the same way. Hold a sticker to put
// another picture on it: the picture is cut to that sticker's outline.

const stickers = [
  { id: "invite", label: "结婚请帖", page: "invite", tilt: -5, x: 4, y: 0.0, w: 46, art: inviteArt },
  { id: "memories", label: "回忆", page: "memories", tilt: 4, x: 56, y: 1.7, w: 38, art: memoriesArt },
  { id: "calendar", label: "纪念日", tilt: 6, x: 8, y: 28.2, w: 36, art: calendarArt },
  { id: "promise", label: "拉钩本", page: "promise", tilt: -4, x: 50, y: 33.2, w: 44, art: promiseArt },
  { id: "letters", label: "饼干盒信箱", page: "letters", tilt: 3, x: 46, y: 58.1, w: 50, art: lettersArt },
  { id: "pixel-home", label: "像素小家", page: "pixel-home", tilt: -5, x: 3, y: 61.4, w: 44, art: pixelHomeArt },
  { id: "ar-letter", label: "空中的信", href: "/ar/", tilt: 4, x: 28, y: 81, w: 44, art: arLetterArt },
];

function Sticker({ item, picture, onPick, onReset, onOpen }) {
  const [wiggle, setWiggle] = useState(false);
  const { editing, setEditing, handlers } = useHoldToChange((event) => {
    const el = event.currentTarget;
    if (item.page) {
      burstFrom(el, "sparkle");
      onOpen(item.page);
      return;
    }
    if (item.href) {
      // 自己是一张单独的页面（要摄像头），整页跳过去，那边有"回小窝"
      burstFrom(el, "sparkle");
      setTimeout(() => { window.location.href = item.href; }, 250);
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
      {picture ? (
        // her own picture, cut to this sticker's torn outline: a paper
        // border in the sticker's shape, the photo just inside it
        <span className="sticker-cutout" style={{ "--shape": `url("${item.art}")` }}>
          <img className="sticker-art sticker-sizer" src={item.art} alt="" draggable="false" />
          <span className="sticker-paper" />
          <img className="sticker-photo" src={picture} alt="" draggable="false" />
        </span>
      ) : (
        <img className="sticker-art" src={item.art} alt="" draggable="false" />
      )}
      <figcaption className="sticker-label" style={{ clipPath: tornEdge(item.id.length + 3) }}>
        {item.label}
        {!item.page && !item.href && <small>画着呢</small>}
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
        <p className="sticker-hint">贴纸是羲和画的 · 长按可以换一张</p>
      </section>

      <HomeNav active="more" onOpen={onOpen} />
    </main>
  );
}
