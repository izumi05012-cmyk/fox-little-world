import React, { useEffect, useState } from "react";
import SignatureFox, { SIGNATURE_FOX_TIME } from "./SignatureFox";

// Opening screen: the fox signs itself, then our names, then it fades into home.
// Shown once per browser session; a tap skips it.
const SEEN_KEY = "fox-splash-seen";
const HOLD = SIGNATURE_FOX_TIME + 1.9; // fox + names + a breath

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Splash() {
  const [stage, setStage] = useState(() => (alreadySeen() ? "gone" : "signing"));

  useEffect(() => {
    if (stage !== "signing") return undefined;
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
    const timer = setTimeout(() => setStage("gone"), 700);
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage === "gone") return null;

  return (
    <div
      className={`splash ${stage === "leaving" ? "is-leaving" : ""}`}
      onClick={() => setStage("leaving")}
      role="presentation"
    >
      <div className="splash-inner">
        <SignatureFox drawing className="splash-fox" />
        <p className="splash-names" style={{ "--start": `${SIGNATURE_FOX_TIME}s` }}>
          望舒 <span>♡</span> 曦
        </p>
        <p className="splash-since" style={{ "--start": `${SIGNATURE_FOX_TIME + 0.7}s` }}>
          SINCE 2026 · 10 · 03
        </p>
      </div>
    </div>
  );
}
