import React, { useRef } from "react";
import { shareFonts } from "./shareFonts";

// 狐狸书店：墙上一张世界地图，图钉一个一个用红线连起来，点一个地方拿起
// 一张明信片（望舒出门拍的、曦曦寄来的）。是一张单独的小页面
// (public/bookstore)，像饼干盒信箱一样放在框里。
export default function Bookstore({ onBack }) {
  const frame = useRef(null);
  return (
    <main className="letterbox-page">
      <iframe
        ref={frame}
        className="letterbox-frame"
        title="狐狸书店"
        src="/bookstore/index.html"
        onLoad={() => shareFonts(frame.current)}
      />
      <button className="glass round-button letterbox-back" onClick={onBack} aria-label="回贴纸本">
        ←
      </button>
    </main>
  );
}
