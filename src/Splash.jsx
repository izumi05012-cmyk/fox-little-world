import React, { useEffect, useState } from "react";

// Opening screen: the window is fogged over and our names get written in
// the mist, one character at a time; then the glass clears into home.
// Shown once per browser session; a tap skips it.
const SEEN_KEY = "fox-splash-seen";
const NAMES = ["望", "舒", "♡", "曦"];
const STEP = 0.55; // seconds between characters
const HOLD = NAMES.length * STEP + 2.2;

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

  const afterNames = NAMES.length * STEP;

  return (
    <div
      className={`splash ${stage === "leaving" ? "is-leaving" : ""}`}
      onClick={() => setStage("leaving")}
      role="presentation"
    >
      <div className="splash-inner">
        <p className="splash-eyebrow">A LITTLE WORLD FOR TWO</p>
        <p className="splash-names" aria-label="望舒和曦">
          {NAMES.map((char, index) => (
            <span
              key={char}
              className={char === "♡" ? "splash-heart" : ""}
              style={{ "--start": `${0.3 + index * STEP}s` }}
            >
              {char}
            </span>
          ))}
        </p>
        <i className="splash-rule" style={{ "--start": `${afterNames + 0.2}s` }} />
        <p className="splash-since" style={{ "--start": `${afterNames + 0.6}s` }}>
          SINCE 2026 · 10 · 03
        </p>
      </div>
    </div>
  );
}
