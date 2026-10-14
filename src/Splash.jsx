import React, { useEffect, useState } from "react";
// 曦曦's drawing of the two of us, cheek to cheek
import foxes from "./assets/splash/foxes.webp";
import heart from "./assets/splash/heart.webp";
import "@fontsource/la-belle-aurore/400.css";

// Opening screen: the window is fogged over; the two little foxes appear
// on the mist and nuzzle, a heart pops up, and our names are signed below
// in one stroke; then the glass clears into home. Shown once per browser
// session; a tap skips it.
const SEEN_KEY = "fox-splash-seen";
const SIGN_AT = 2.0; // after the foxes have said hello
const SIGN_TIME = 1.8; // how long the signature takes to write
const HOLD = SIGN_AT + SIGN_TIME + 2;

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Splash() {
  const [stage, setStage] = useState(() => (alreadySeen() ? "gone" : "writing"));

  useEffect(() => {
    if (stage !== "writing") return undefined;
    const timer = setTimeout(() => setStage("leaving"), HOLD * 1000);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "leaving") return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // private mode: it just plays again next time
    }
    const timer = setTimeout(() => setStage("gone"), 1200);
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === "gone") return null;

  const afterNames = SIGN_AT + SIGN_TIME;

  return (
    <div
      className={`splash ${stage === "leaving" ? "is-leaving" : ""}`}
      onClick={() => setStage("leaving")}
      role="presentation"
    >
      <div className="splash-inner">
        <div className="splash-art" aria-hidden="true">
          <img className="splash-foxes" src={foxes} alt="" />
          <img className="splash-love" src={heart} alt="" />
        </div>
        <p
          className="splash-sign"
          style={{ "--start": `${SIGN_AT}s`, "--time": `${SIGN_TIME}s` }}
        >
          Wangshu &amp; Xi
        </p>
        <i className="splash-rule" style={{ "--start": `${afterNames + 0.2}s` }} />
        <p className="splash-since" style={{ "--start": `${afterNames + 0.6}s` }}>
          SINCE 2026 · 10 · 03
        </p>
      </div>
    </div>
  );
}
