import { useEffect, useState } from "react";
import { clearSky, isDaytime, loadPref, realWeather, savePref } from "./weather";

// roughly the colour at the top of each view, for the phone's status bar
const barColor = { day: "#eef0f4", night: "#1c2131", rain: "#2f3a4f", snow: "#e6ebf1" };

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
    // the phone's top bar takes the colour of the view, not a black strip
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", barColor[scene] || barColor.day);
    // in the 小窝 app the status bar floats over the view: dark clock and
    // battery on a bright view, white ones on a dark one
    const bright = scene === "day" || scene === "snow" || (scene === "rain" && isDaytime());
    window.Capacitor?.Plugins?.SystemBars?.setStyle?.({ style: bright ? "LIGHT" : "DARK" })?.catch?.(() => {});
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
