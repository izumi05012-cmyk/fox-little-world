import { useEffect, useState } from "react";
import { clearPhoto, loadPhotos, savePhoto } from "./photoStore";

const SLOTS = ["avatar-me", "avatar-him"];

// Our two avatars, if 曦曦 has picked her own; kept with the polaroid photos.
export function useAvatars() {
  const [custom, setCustom] = useState({});

  useEffect(() => {
    let alive = true;
    loadPhotos(SLOTS).then((found) => {
      if (alive) setCustom(found);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function pick(who, file) {
    const url = await savePhoto(`avatar-${who}`, file);
    setCustom((current) => ({ ...current, [`avatar-${who}`]: url }));
  }

  async function reset(who) {
    await clearPhoto(`avatar-${who}`);
    setCustom((current) => {
      const { [`avatar-${who}`]: _gone, ...rest } = current;
      return rest;
    });
  }

  return { me: custom["avatar-me"], him: custom["avatar-him"], pick, reset };
}

// Is this picture mostly dark? Then words on it go white, like at night.
function isDark(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, 16, 16);
        const px = g.getImageData(0, 0, 16, 16).data;
        let sum = 0;
        for (let i = 0; i < px.length; i += 4) sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
        resolve(sum / (px.length / 4) < 140);
      } catch {
        resolve(true);
      }
    };
    img.onerror = () => resolve(true);
    img.src = url;
  });
}

// 曦曦's own picture behind the chat, instead of the window.
export function useChatBackground() {
  const [background, setBackground] = useState(null); // { url, dark }

  async function show(url) {
    setBackground(url ? { url, dark: await isDark(url) } : null);
  }

  useEffect(() => {
    let alive = true;
    loadPhotos(["chat-background"]).then((found) => {
      if (alive) show(found["chat-background"]);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function pick(file) {
    show(await savePhoto("chat-background", file));
  }

  async function reset() {
    await clearPhoto("chat-background");
    setBackground(null);
  }

  return { background, pick, reset };
}
