import React from "react";

// The pixel cottage (楼上卧室、楼下客厅、大黄、三个人递饭) is a little page
// of its own (public/pixel-home), drawn by 望舒 with 羲和's people and
// furniture; here it is shown full screen in a frame, like the letter tin.
export default function PixelHome({ onBack }) {
  return (
    <main className="letterbox-page pixel-home-page">
      <iframe className="letterbox-frame" title="像素小家" src="/pixel-home/index.html" />
      <button className="glass round-button letterbox-back" onClick={onBack} aria-label="回贴纸本">
        ←
      </button>
    </main>
  );
}
