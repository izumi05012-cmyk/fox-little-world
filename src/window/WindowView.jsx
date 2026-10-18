import React, { useEffect, useRef, useState } from "react";
import { day, night, rain, rainAir, snow } from "./effects";
import { depthPhoto } from "./depthPhoto";
import { rainGlass } from "./rainGlass";
import { useWindowPicture } from "./windowPicture";
import { rainView } from "./rainView";
import snowPic from "../assets/window/snow.webp";
import dayPic from "../assets/window/day.webp";
import nightPic from "../assets/window/night.webp";
// sun, snow and night share one view and its depth map; rain has its own
// (see rainView)
import depthMap from "../assets/window/depth.webp";
import skyMask from "../assets/window/sky.webp";

// The view out of the little house's window, behind everything on the page.
// The outside is a photo with a depth map, so as you scroll or tilt the
// phone near things shift more than far ones (a real 3D view); the glass —
// drops, frost, frame — stays put. Without WebGL the plain photo drifts.

const scenes = {
  // rain: the water on the glass is drawn on the GPU when it can be
  // (rainGlass), with only the weather beyond on the canvas; without
  // WebGL the canvas draws the drops too
  rain: { effect: rain, gpuGlass: rainGlass, air: rainAir, glass: "glass-rain" },
  snow: { picture: snowPic, effect: snow, glass: "glass-snow" },
  day: { picture: dayPic, effect: day, glass: "glass-clear" },
  night: { picture: nightPic, effect: night, glass: "glass-clear" },
};

const FADE_MS = 1400;

// her own picture has no depth map: an even grey moves it as one piece
const FLAT_DEPTH = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const g = c.getContext("2d");
  g.fillStyle = "#666";
  g.fillRect(0, 0, 2, 2);
  return c.toDataURL();
})();

// what one layer shows: the scene as it comes, or rain and snow (the
// glass) over her own picture. Clear skies keep the little house's own
// views: her picture is for the weather to fall on.
function resolve(scene, custom) {
  const base = scene === "rain" ? { ...scenes.rain, ...rainView() } : scenes[scene];
  if (!custom || (scene !== "rain" && scene !== "snow")) return { ...base, depth: base.depth || depthMap };
  return { ...base, picture: custom, depth: FLAT_DEPTH };
}

function SceneLayer({ scene, custom, leaving, motion }) {
  const canvas = useRef(null);
  const picture = useRef(null);
  const depth = useRef(null);
  const glassHost = useRef(null);
  const [has3d, setHas3d] = useState(false);

  const view = resolve(scene, custom);

  useEffect(() => {
    const { effect, gpuGlass, air, picture: src } = resolve(scene, custom);
    const stopGlass = gpuGlass ? gpuGlass(glassHost.current, src) : null;
    const stopEffect = stopGlass
      ? air(canvas.current, picture.current)
      : effect(canvas.current, picture.current, { sky: skyMask });
    return () => {
      stopEffect?.();
      stopGlass?.();
    };
  }, [scene, custom]);

  useEffect(() => {
    const { picture: src, depth: map } = resolve(scene, custom);
    const stop = depthPhoto(depth.current, src, map, motion, () => setHas3d(true));
    return stop || undefined;
  }, [scene, custom, motion]);

  return (
    <div className={`window-scene ${view.glass} ${leaving ? "is-leaving" : ""} ${has3d ? "has-3d" : ""}`}>
      <img ref={picture} className="window-outside" src={view.picture} alt="" />
      <div ref={depth} className="window-depth" />
      <canvas ref={canvas} className="window-glass" />
      {view.gpuGlass && <div ref={glassHost} className="window-rainglass-host" />}
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
  const custom = useWindowPicture();
  // keep the old scene around while it fades out under the new one
  const [layers, setLayers] = useState([]);
  const root = useRef(null);
  // where the viewer is, read every frame by the 3D photo
  const viewer = useRef({ x: 0, y: 0 });
  const [motion] = useState(() => () => viewer.current);

  useEffect(() => {
    if (custom === undefined) return undefined; // still finding out
    setLayers((current) => {
      const top = current[current.length - 1];
      if (top && top.scene === scene && top.custom === custom && !top.leaving) return current;
      return [
        ...current.map((layer) => ({ ...layer, leaving: true })),
        { scene, custom, key: top ? top.key + 1 : 0, leaving: false },
      ];
    });
    const timer = setTimeout(() => setLayers((current) => current.filter((l) => !l.leaving)), FADE_MS);
    return () => clearTimeout(timer);
  }, [scene, custom]);

  // depth: scroll, finger/mouse position and phone tilt nudge the outside
  useEffect(() => {
    const el = root.current;
    let tiltX = 0;
    let tiltY = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const scrolled = Math.max(-0.5, Math.min(0.5, window.scrollY / 2400));
      // move the eye opposite to the tilt, like leaning to look past the frame
      viewer.current = { x: -tiltX, y: -(tiltY + scrolled) };
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
        <SceneLayer key={layer.key} scene={layer.scene} custom={layer.custom} leaving={layer.leaving} motion={motion} />
      ))}
    </div>
  );
}
