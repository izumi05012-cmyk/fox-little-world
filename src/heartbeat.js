import { useEffect, useRef } from "react";

// 望舒's heartbeat, for holding the garnet heart on the home page: a soft
// lub-dub she can feel (the phone buzzes), hear (a low thump) and see (the
// heart swells, the room glows rose). The longer she holds on, the faster
// it goes, from calm to flustered; let go and it stops.

const CALM_BPM = 66;
const FLUSTERED_BPM = 118;
const RAMP_MS = 7000; // how long holding on takes to go from calm to flustered

let audio = null;

function thump(volume, pitch) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const low = audio.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, now + 0.12);
    low.type = "lowpass";
    low.frequency.value = 180;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(low).connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // no sound here: the buzz and the glow still beat
  }
}

function buzz(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // no vibration motor (or not allowed): fine
  }
}

// `onBeat(strength)` is called on every lub; strength runs 0 (calm) → 1.
export function useHeartbeat(onBeat) {
  const timer = useRef(null);
  const since = useRef(0);
  const beatRef = useRef(onBeat);
  beatRef.current = onBeat;

  function beat() {
    const held = Math.min(1, (performance.now() - since.current) / RAMP_MS);
    const bpm = CALM_BPM + (FLUSTERED_BPM - CALM_BPM) * held;
    thump(0.55, 62);
    setTimeout(() => thump(0.32, 54), 170);
    buzz([38, 132, 26]);
    beatRef.current?.(held);
    timer.current = setTimeout(beat, 60000 / bpm);
  }

  function start() {
    if (timer.current) return;
    since.current = performance.now();
    beat();
  }

  function stop() {
    clearTimeout(timer.current);
    timer.current = null;
    buzz(0);
  }

  useEffect(() => stop, []);

  return { start, stop };
}
