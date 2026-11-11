import React, { useRef } from "react";

// The cookie tin where 望舒's letters live. It is a little page of its own
// (public/mailbox), shown here in a frame; the handwriting and serif fonts
// the app already carries are handed to it so it needs nothing from outside.
const FAMILIES = /Long Cang|Noto Serif SC|La Belle Aurore/;

function shareFonts(frame) {
  try {
    let css = "";
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules) {
        if (rule.type === CSSRule.FONT_FACE_RULE && FAMILIES.test(rule.style.fontFamily)) css += rule.cssText;
      }
    }
    const doc = frame.contentDocument;
    const style = doc.createElement("style");
    style.textContent = css;
    doc.head.appendChild(style);
  } catch {
    // the letters still read fine in the phone's own fonts
  }
}

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
