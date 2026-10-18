import { useEffect, useState } from "react";
import { clearSky, loadPref, realWeather, savePref } from "./weather";

// The scene outside the window, shared by every page that has the window
// behind it: 曦曦's pick, or the real weather when she leaves it on "auto".
export function useScene() {
  const [pref, setPref] = useState(loadPref);
  const [outside, setOutside] = useState(() => clearSky());

  useEffect(() => {
    if (pref !== "auto") return undefined;
    let alive = true;
    realWeather().then((found) => {
      if (alive) setOutside(found);
    });
    return () => {
      alive = false;
    };
  }, [pref]);

  const scene = pref === "auto" ? outside : pref === "sun" ? clearSky() : pref;

  // remembered for next time, so the page can open in the right colour
  // before anything has loaded (see the little script in index.html)
  useEffect(() => {
    document.documentElement.dataset.scene = scene;
    try {
      localStorage.setItem("fox-last-scene", scene);
    } catch {
      // not remembered: next visit guesses from the clock
    }
  }, [scene]);

  function choose(next) {
    setPref(next);
    savePref(next);
  }

  return { pref, scene, choose };
}
