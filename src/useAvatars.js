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
