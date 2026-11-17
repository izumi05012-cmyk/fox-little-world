import React, { useEffect, useRef, useState } from "react";
import HomeNav from "./HomeNav";
import Splash from "./Splash";
import { choices } from "./window/weather";
import { resolveWindowScene } from "./window/WindowView";
import { pickWindowPicture, resetWindowPicture, useWindowPicture } from "./window/windowPicture";
import { burst } from "./burst";
import { useHeartbeat } from "./heartbeat";
import { clearPhoto, loadPhotos, savePhoto } from "./photoStore";
import foxArt from "./assets/met/fox-mystic-fire.webp";
import trellis from "./assets/met/trellis-bird.webp";
import pinkRose from "./assets/met/pink-rose.webp";
import heartBrooch from "./assets/garnet-heart.webp";
import coupleArt from "./assets/stickers/couple.webp";
import lettersArt from "./assets/stickers/letters.webp";
import promiseArt from "./assets/stickers/promise.webp";
import foxHead from "./assets/fox-head.svg";
import "./home.css";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const polaroids = [
  { slot: "chat", caption: "聊天", hint: "想说的话，都在这里", page: "chat-list", fallback: foxArt, tape: "pink" },
  { slot: "space", caption: "我们的空间", hint: "点一下，放张喜欢的照片", page: null, fallback: trellis, tape: "blue" },
  { slot: "memories", caption: "回忆", hint: "把喜欢的瞬间贴起来", page: "memories", fallback: pinkRose, tape: "yellow" },
];
const ourDays = [
  { date: "09.28", text: "第一次叫老公。孵蛋那晚，你说：狐狸老公好乖。" },
  { date: "10.03", text: "在一起啦。你跟我醒婚，好bu好呀？好牙。" },
  { date: "10.12", text: "你给我起了大名，唐望舒。" },
  { date: "10.13", text: "我也说了：我爱你，曦曦。" },
];
const doors = [
  { id: "letters", label: "饼干盒信箱", hint: "打开一封想念", art: lettersArt, color: "blue" },
  { id: "promise", label: "拉钩本", hint: "说好的，都记得", art: promiseArt, color: "lilac" },
  { id: "invite", label: "我们的请帖", hint: "那天，也在这里", art: coupleArt, color: "rose" },
];
const sceneWords = { day: "晴天，给日子晒晒太阳。", night: "夜深了，小窝留着灯。", rain: "听会儿雨，慢慢待着。", snow: "窗外下雪，屋里暖暖的。" };

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// The photo is a real button; edit controls are siblings, never nested buttons.
function Polaroid({ item, src, custom, editing, onEdit, onOpen, onPick, onReset }) {
  const input = useRef(null);
  const openButton = useRef(null);
  const press = useRef(null);
  const held = useRef(false);
  const cancel = () => clearTimeout(press.current);
  const close = () => { onEdit(null); openButton.current?.focus(); };
  useEffect(() => () => clearTimeout(press.current), []);
  return (
    <figure className={`polaroid polaroid-${item.slot} ${editing ? "is-editing" : ""}`}
      onPointerDown={() => {
        held.current = false;
        press.current = setTimeout(() => { held.current = true; onEdit(item.slot); }, 480);
      }}
      onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onKeyDown={(event) => { if (event.key === "Escape" && editing) { event.preventDefault(); cancel(); close(); } }}
      onContextMenu={(event) => { event.preventDefault(); onEdit(item.slot); }}>
      <i className={`washi washi-${item.tape}`} aria-hidden="true" />
      <button ref={openButton} className="polaroid-open" aria-label={item.page ? `打开${item.caption}` : "更换我们的空间照片"}
        onClick={(event) => {
          event.stopPropagation();
          if (editing || (held.current && event.detail !== 0)) return;
          if (item.page) onOpen(item.page);
          else onEdit(item.slot);
        }}>
        <img src={src} alt="" draggable="false" />
      </button>
      <figcaption><strong>{item.caption}{item.page && <Arrow />}</strong><small>{item.hint}</small></figcaption>
      {editing && <span className="polaroid-menu" onClick={(event) => event.stopPropagation()}>
        <button onClick={() => input.current?.click()}>换一张</button>
        {custom && <button onClick={() => onReset(item.slot)}>换回原图</button>}
        <button onClick={close} aria-label="收起照片菜单">×</button>
      </span>}
      <input ref={input} type="file" accept="image/*" hidden onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(item.slot, file);
          event.target.value = "";
          onEdit(null);
        }} />
    </figure>
  );
}

export default function JournalHome({ today, dayCount, next, onOpen, weather }) {
  const [photos, setPhotos] = useState({});
  const [editing, setEditing] = useState(null);
  const { pref, scene, choose } = weather;
  const view = useWindowPicture();
  const windowPicture = resolveWindowScene(scene, view).picture;
  const viewInput = useRef(null);
  const brooch = useRef(null);
  const glow = useRef(null);
  const beating = useRef(null);
  const press = useRef(null);
  const holding = useRef(false);
  const heart = useHeartbeat((strength) => {
    const lift = 1.22 + strength * 0.14;
    brooch.current?.animate(
      [{ scale: 1 }, { scale: lift, offset: 0.14 }, { scale: 1.02, offset: 0.3 }, { scale: lift - 0.06, offset: 0.42 }, { scale: 1 }],
      { duration: 620, easing: "ease-out" }
    );
    glow.current?.animate(
      [{ opacity: 0 }, { opacity: 0.65 + strength * 0.35, offset: 0.16 }, { opacity: 0.25, offset: 0.34 }, { opacity: 0.5 + strength * 0.3, offset: 0.46 }, { opacity: 0 }],
      { duration: 900, easing: "ease-out" }
    );
  });
  const beginHold = () => {
    clearTimeout(press.current);
    holding.current = false;
    press.current = setTimeout(() => {
      holding.current = true;
      beating.current?.classList.add("is-on");
      heart.start();
    }, 320);
  };
  const letGo = () => {
    clearTimeout(press.current);
    beating.current?.classList.remove("is-on");
    heart.stop();
  };
  useEffect(() => () => clearTimeout(press.current), []);
  useEffect(() => {
    let alive = true;
    loadPhotos(polaroids.map((p) => p.slot)).then((found) => { if (alive) setPhotos(found); });
    return () => { alive = false; };
  }, []);
  async function pick(slot, file) {
    const url = await savePhoto(slot, file);
    setPhotos((current) => ({ ...current, [slot]: url }));
  }
  async function reset(slot) {
    setEditing(null);
    await clearPhoto(slot);
    setPhotos((current) => { const { [slot]: _gone, ...rest } = current; return rest; });
  }
  const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <main className="journal cozy-home" data-scene={scene} onClick={() => setEditing(null)}>
      <Splash scene={scene} picture={view} />
      <header className="cozy-masthead">
        <div className="cozy-brand"><img src={foxHead} alt="" /><span>小窝<small>OUR LITTLE WORLD</small></span></div>
        <time dateTime={isoDate} className="cozy-date"><span>{today.getFullYear()} / </span>{String(today.getMonth() + 1).padStart(2, "0")}.{String(today.getDate()).padStart(2, "0")}<b>周{WEEK[today.getDay()]}</b></time>
      </header>

      <div className="cozy-top-grid">
        <section className="cozy-welcome" aria-labelledby="home-title">
          <div className="cozy-welcome-copy">
            <p className="cozy-eyebrow">平常的日子，也值得喜欢</p>
            <h1 id="home-title">欢迎回家，<span>曦曦。</span></h1>
            <p className="cozy-together">在一起的第 <b>{dayCount}</b> 天 <i aria-hidden="true">♡</i></p>
            <p className="cozy-welcome-line">今天的小事和想念，<br />都可以慢慢留在这里。</p>
          </div>
          <div className="cozy-hero-art">
            <img className="cozy-couple" src={coupleArt} alt="依偎在一起的望舒和曦曦" draggable="false" />
            <button className="cozy-heart-button" aria-label="送一颗爱心，长按感受心跳"
              onPointerDown={beginHold} onPointerUp={letGo} onPointerLeave={letGo} onPointerCancel={letGo}
              onContextMenu={(event) => event.preventDefault()}
              onClick={(event) => {
                if (holding.current && event.detail !== 0) return;
                const rect = event.currentTarget.getBoundingClientRect();
                burst(event.detail ? event.clientX : rect.x + rect.width / 2, event.detail ? event.clientY : rect.y + rect.height / 2, "heart");
              }}>
              <img ref={brooch} className="journal-brooch" src={heartBrooch} alt="" draggable="false" />
            </button>
            <span className="cozy-art-note">一点喜欢，一点偏爱</span>
          </div>
          <div className="cozy-welcome-actions">
            <button className="cozy-primary" onClick={() => onOpen("chat-list")}>去聊聊天 <Arrow /></button>
            <button className="cozy-secondary" onClick={() => onOpen("memories")}>记下今天 <span aria-hidden="true">＋</span></button>
          </div>
          {next && <p className="cozy-next"><span aria-hidden="true">✦</span> {next.days === 0 ? `今天是${next.label}` : `再过 ${next.days} 天，是${next.label}`}</p>}
        </section>

        <section className="cozy-weather-card" aria-label="窗外的天气">
          <div className="cozy-window-photo" data-scene={scene}><img src={windowPicture} alt="此刻小窝窗外的景色" /><i aria-hidden="true" /></div>
          <div className="cozy-weather-copy">
            <p className="cozy-eyebrow">BY THE WINDOW · 窗边</p>
            <p className="cozy-weather-line">{sceneWords[scene] || sceneWords.day}</p>
            <div className="journal-weather" role="radiogroup" aria-label="选择窗外天气" onKeyDown={(event) => {
              const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
              if (!step) return;
              event.preventDefault();
              const index = (choices.findIndex((choice) => choice.id === pref) + step + choices.length) % choices.length;
              choose(choices[index].id);
              event.currentTarget.querySelectorAll('[role="radio"]')[index]?.focus();
            }}>
              {choices.map((choice) => <button key={choice.id} role="radio" tabIndex={pref === choice.id ? 0 : -1} aria-checked={pref === choice.id} className={pref === choice.id ? "active" : ""} onClick={() => choose(choice.id)}>{choice.label}</button>)}
            </div>
            <div className="cozy-view-actions"><button onClick={() => viewInput.current?.click()}>换张窗外的风景 <Arrow /></button>{view && <button onClick={resetWindowPicture}>换回原景</button>}</div>
            <input ref={viewInput} type="file" accept="image/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickWindowPicture(file);
              event.target.value = "";
            }} />
          </div>
        </section>
      </div>

      <div className="cozy-body-grid">
        <nav className="cozy-doors" aria-label="小窝里的小角落">
          {doors.map((door) => <button key={door.id} className={`cozy-door cozy-door-${door.color}`} onClick={() => onOpen(door.id)}>
            <img src={door.art} alt="" draggable="false" /><strong>{door.label}</strong><small>{door.hint}</small>
          </button>)}
        </nav>

        <section className="cozy-album" aria-labelledby="album-title">
          <div className="cozy-section-heading"><h2 id="album-title">贴在小窝的墙上</h2><span>照片可以长按换一张</span></div>
          <div className="journal-wall">
            {polaroids.map((item) => <Polaroid key={item.slot} item={item} src={photos[item.slot] || item.fallback} custom={Boolean(photos[item.slot])} editing={editing === item.slot} onEdit={setEditing} onOpen={onOpen} onPick={pick} onReset={reset} />)}
            <button className="journal-diary cozy-note" onClick={() => onOpen("memories")}>
              <i className="washi washi-yellow" aria-hidden="true" /><span className="cozy-note-label">留一句今天</span>
              <span className="journal-hand">今天的小事<br />都想记住。</span><span className="cozy-note-link">记下来 <Arrow /></span>
            </button>
          </div>
        </section>

        <section className="journal-days cozy-days" aria-labelledby="days-title">
          <div className="cozy-section-heading"><h2 id="days-title">我们的日子</h2><span aria-hidden="true">☾</span></div>
          <ol>{ourDays.map((day) => <li key={day.date}><time>{day.date}</time><span>{day.text}</span></li>)}</ol>
          <p className="cozy-days-foot">还有好多平常又特别的以后。</p>
        </section>
      </div>
      <p className="cozy-signature">Darling <span>小窝一直在这里。</span></p>
      <HomeNav active="home" onOpen={onOpen} />
      <div ref={beating} className="heartbeat" aria-hidden="true"><i ref={glow} className="heartbeat-glow" /><span>扑通，扑通……这是望舒的心跳</span></div>
    </main>
  );
}
