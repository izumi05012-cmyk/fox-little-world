import React, { useEffect, useRef, useState } from "react";
import { day, night, rain, snow } from "./effects";
import rainPic from "../assets/window/rain.webp";
import snowPic from "../assets/window/snow.webp";
import dayPic from "../assets/window/day.webp";
import nightPic from "../assets/window/night.webp";

// The view out of the little house's window, behind everything on the page.
// The blurred outside picture drifts a little as you scroll or tilt (depth);
// the glass — drops, frost, frame — stays put.

const scenes = {
  rain: { picture: rainPic, effect: rain, glass: "glass-rain" },
  snow: { picture: snowPic, effect: snow, glass: "glass-snow" },
  day: { picture: dayPic, effect: day, glass: "glass-clear" },
  night: { picture: nightPic, effect: night, glass: "glass-clear" },
};

const FADE_MS = 1400;

function SceneLayer({ scene, leaving }) {
  const canvas = useRef(null);
  const picture = useRef(null);

  useEffect(() => {
    const { effect } = scenes[scene];
    return effect(canvas.current, picture.current);
  }, [scene]);

  return (
    <div className={`window-scene ${scenes[scene].glass} ${leaving ? "is-leaving" : ""}`}>
      <img ref={picture} className="window-outside" src={scenes[scene].picture} alt="" />
      <canvas ref={canvas} className="window-glass" />
      {scene === "snow" && (
        <>
          <i className="window-frost" />
          <i className="window-sill-snow" />
        </>
      )}
    </div>
  );
}

export default function WindowView({ scene }) {
  // keep the old scene around while it fades out under the new one
  const [layers, setLayers] = useState([{ scene, key: 0, leaving: false }]);
  const root = useRef(null);

  useEffect(() => {
    setLayers((current) => {
      const top = current[current.length - 1];
      if (top.scene === scene && !top.leaving) return current;
      return [
        ...current.map((layer) => ({ ...layer, leaving: true })),
        { scene, key: top.key + 1, leaving: false },
      ];
    });
    const timer = setTimeout(() => setLayers((current) => current.filter((l) => !l.leaving)), FADE_MS);
    return () => clearTimeout(timer);
  }, [scene]);

  // depth: scroll, finger/mouse position and phone tilt nudge the outside
  useEffect(() => {
    const el = root.current;
    let tiltX = 0;
    let tiltY = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--scroll", String(window.scrollY));
      el.style.setProperty("--tilt-x", tiltX.toFixed(3));
      el.style.setProperty("--tilt-y", tiltY.toFixed(3));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onPointer = (event) => {
      tiltX = event.clientX / window.innerWidth - 0.5;
      tiltY = event.clientY / window.innerHeight - 0.5;
      queue();
    };
    const onTilt = (event) => {
      if (event.gamma == null) return;
      tiltX = Math.max(-1, Math.min(1, event.gamma / 30)) / 2;
      tiltY = Math.max(-1, Math.min(1, (event.beta - 45) / 30)) / 2;
      queue();
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <div className="window" ref={root} aria-hidden="true">
      {layers.map((layer) => (
        <SceneLayer key={layer.key} scene={layer.scene} leaving={layer.leaving} />
      ))}
      <i className="window-frame" />
    </div>
  );
}
