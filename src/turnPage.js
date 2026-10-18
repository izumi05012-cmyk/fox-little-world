import { flushSync } from "react-dom";

// Changing pages: the old page melts away as the new one drifts in, over
// the window, which stays as it is. Uses the browser's view transitions
// where it has them (the look is in style.css); elsewhere the new page
// just fades in on its own.
export function turnPage(change, way) {
  const root = document.documentElement;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || still) {
    change();
    return;
  }
  root.dataset.turn = way;
  const turning = document.startViewTransition(() => flushSync(change));
  turning.finished.finally(() => {
    delete root.dataset.turn;
  });
}
