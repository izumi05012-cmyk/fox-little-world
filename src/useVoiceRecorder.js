import { useRef, useState } from "react";

// Hold to talk, like every chat app: press starts the microphone, letting
// go sends, sliding up first cancels. Hands back the recording and how
// long it was.
export function useVoiceRecorder(onDone, onError) {
  const [state, setState] = useState(null); // null | "recording" | "cancel"
  const recorder = useRef(null);
  const chunks = useRef([]);
  const started = useRef(0);
  const startY = useRef(0);
  const cancelled = useRef(false);
  const released = useRef(false);

  async function start(event) {
    startY.current = event.clientY;
    cancelled.current = false;
    released.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const seconds = (Date.now() - started.current) / 1000;
        if (!cancelled.current && seconds >= 0.8 && chunks.current.length) {
          onDone(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }), Math.min(60, Math.round(seconds)));
        }
        setState(null);
      };
      recorder.current = rec;
      started.current = Date.now();
      rec.start();
      setState("recording");
      // let go before the microphone even opened: that was just a tap
      if (released.current) {
        cancelled.current = true;
        rec.stop();
        return;
      }
      // a minute is plenty for one bubble
      setTimeout(() => rec.state === "recording" && rec.stop(), 60000);
    } catch {
      setState(null);
      onError?.();
    }
  }

  function move(event) {
    if (!recorder.current || recorder.current.state !== "recording") return;
    const up = startY.current - event.clientY > 70;
    cancelled.current = up;
    setState(up ? "cancel" : "recording");
  }

  function stop() {
    released.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    else setState(null);
  }

  return { state, start, move, stop };
}
