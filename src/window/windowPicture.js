import { useEffect, useState } from "react";
import { clearPhoto, loadPhotos, savePhoto } from "../photoStore";

// 曦曦's own picture for the view outside the window, if she has chosen
// one. Rain and snow are layers on the glass, so they fall over it just
// as they fall over the views that come with the little house. Kept
// with the polaroid photos; shared by every page that has the window.

const SLOT = "window-view";
let current; // undefined: not read yet; null: none chosen
const listeners = new Set();

function set(url) {
  current = url || null;
  listeners.forEach((listener) => listener(current));
}

let loading = null;
function load() {
  if (!loading) loading = loadPhotos([SLOT]).then((found) => set(found[SLOT]));
  return loading;
}

export async function pickWindowPicture(file) {
  set(await savePhoto(SLOT, file));
}

export async function resetWindowPicture() {
  await clearPhoto(SLOT);
  set(null);
}

// undefined while it's still being looked up (so nothing flashes the
// wrong view first), then the picture's url, or null for the usual views
export function useWindowPicture() {
  const [picture, setPicture] = useState(current);
  useEffect(() => {
    listeners.add(setPicture);
    if (current === undefined) load();
    else setPicture(current);
    return () => listeners.delete(setPicture);
  }, []);
  return picture;
}
