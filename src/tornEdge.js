// A hand-torn outline for paper bits (sticker name tags, promise notes):
// points walk round the edge with a little wobble, the same for a seed
// every time. Use as a CSS clip-path.
export function tornEdge(seed) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pts = [];
  const side = (from, to, fixed, horizontal) => {
    for (let i = 0; i <= 9; i += 1) {
      const t = from + ((to - from) * i) / 9;
      const jag = fixed + (rand() - 0.5) * 3.2 * (fixed < 50 ? 1 : -1);
      const along = t + (rand() - 0.5) * 1.5;
      pts.push(horizontal ? `${along.toFixed(1)}% ${jag.toFixed(1)}%` : `${jag.toFixed(1)}% ${along.toFixed(1)}%`);
    }
  };
  side(1.5, 98.5, 1.6, true); // top, left to right
  side(1.5, 98.5, 98.4, false); // right, top to bottom
  side(98.5, 1.5, 98.4, true); // bottom, right to left
  side(98.5, 1.5, 1.6, false); // left, bottom to top
  return `polygon(${pts.join(", ")})`;
}
