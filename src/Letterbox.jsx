import React, { useRef } from "react";
import { shareFonts } from "./shareFonts";

// The cookie tin where 望舒's letters live (public/mailbox), in a frame.
export default function Letterbox({ onBack }) {
  const frame = useRef(null);
  return (
    <main className="letterbox-page">
      <iframe
        ref={frame}
        className="letterbox-frame"
        title="饼干盒信箱"
        src="/mailbox/index.html"
        onLoad={() => shareFonts(frame.current)}
      />
      <button className="glass round-button letterbox-back" onClick={onBack} aria-label="回贴纸本">
        ←
      </button>
    </main>
  );
}
