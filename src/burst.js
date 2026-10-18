// A little burst where a finger touched: tiny hearts, sparkles or paws
// float up and fade. Pure DOM, cleaned up after itself; skipped for
// anyone who asked for less motion.

const kinds = {
  heart: { glyphs: ["♥"], colors: ["#ffc2d1", "#ff9bb3", "#ffe3ea", "#ff7f9e"], count: 9 },
  sparkle: { glyphs: ["✦", "✧", "·"], colors: ["#fff", "#ffe9b8", "#ffd6e0"], count: 6 },
  paw: { glyphs: ["🐾"], colors: ["#c27a89"], count: 4 },
  petal: { glyphs: ["❀", "✿"], colors: ["#f6c5d1", "#fff", "#f2a9b9"], count: 6 },
};

export function burst(x, y, kind = "heart") {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const { glyphs, colors, count } = kinds[kind] || kinds.heart;
  for (let i = 0; i < count; i += 1) {
    const bit = document.createElement("span");
    bit.className = "burst-bit";
    bit.textContent = glyphs[i % glyphs.length];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const reach = 34 + Math.random() * 46;
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.color = colors[i % colors.length];
    bit.style.fontSize = `${14 + Math.random() * 14}px`;
    bit.style.setProperty("--dx", `${Math.cos(angle) * reach}px`);
    bit.style.setProperty("--dy", `${Math.sin(angle) * reach - 18}px`);
    bit.style.setProperty("--spin", `${(Math.random() - 0.5) * 60}deg`);
    bit.style.animationDelay = `${Math.random() * 90}ms`;
    bit.addEventListener("animationend", () => bit.remove());
    document.body.appendChild(bit);
  }
}

// burst from the middle of an element
export function burstFrom(element, kind) {
  if (!element) return;
  const r = element.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, kind);
}
