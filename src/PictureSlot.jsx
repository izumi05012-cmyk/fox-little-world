import React, { useEffect, useRef, useState } from "react";
import { clearPhoto, loadPhotos, savePhoto, saveBlob } from "./photoStore";

// 曦曦's own pictures for a set of slots, kept in IndexedDB like the
// polaroids. `raw` keeps the file as it is (a sticker's transparent edges
// would turn white if it went through the JPEG shrink).
export function usePictures(slots, { raw = false } = {}) {
  const [pictures, setPictures] = useState({});
  const key = slots.join("|");

  useEffect(() => {
    let alive = true;
    loadPhotos(key.split("|")).then((found) => {
      if (alive) setPictures(found);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  async function pick(slot, file) {
    const url = raw ? await saveBlob(slot, file) : await savePhoto(slot, file);
    setPictures((current) => ({ ...current, [slot]: url }));
  }

  async function reset(slot) {
    await clearPhoto(slot);
    setPictures((current) => {
      const { [slot]: _gone, ...rest } = current;
      return rest;
    });
  }

  return { pictures, pick, reset };
}

// Hold a picture a moment (or right-click) to change it; a plain tap does
// whatever the parent wants. The small glass menu is the same as the
// polaroids' on the home page.
export function useHoldToChange(onTap) {
  const [editing, setEditing] = useState(false);
  const press = useRef(null);
  const held = useRef(false);
  const cancel = () => clearTimeout(press.current);

  // a tap anywhere else puts the menu away
  useEffect(() => {
    if (!editing) return undefined;
    const away = (event) => {
      if (event.target.closest?.(".polaroid-menu")) return;
      held.current = true; // this tap only closes the menu
      setEditing(false);
    };
    const timer = setTimeout(() => window.addEventListener("pointerdown", away), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", away);
    };
  }, [editing]);

  const handlers = {
    onPointerDown: () => {
      held.current = false;
      press.current = setTimeout(() => {
        held.current = true;
        setEditing(true);
      }, 480);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onContextMenu: (event) => {
      event.preventDefault();
      setEditing(true);
    },
    onClick: (event) => {
      event.stopPropagation();
      if (held.current || editing) return;
      onTap?.(event);
    },
  };

  return { editing, setEditing, handlers };
}

export function ChangeMenu({ custom, onPick, onReset, onClose }) {
  const input = useRef(null);
  return (
    <span className="polaroid-menu" onClick={(event) => event.stopPropagation()}>
      <button onClick={() => input.current?.click()}>换一张</button>
      {custom && (
        <button
          onClick={() => {
            onReset();
            onClose();
          }}
        >
          换回原图
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
          onClose();
        }}
      />
    </span>
  );
}
