import React from "react";

// Home's first screen, as a little Showa-style poster: a tiny-icon wallpaper,
// a cream "shop sign" circle with our title, a ribbon and a ticket stuck on top.
const pad = (n) => String(n).padStart(2, "0");

function Wallpaper() {
  // one 96×96 tile of little things that are ours: sun (曦), moon (望舒),
  // hearts, sparkles, a paw — and a drumstick, because 曦曦 loves 鸡腿.
  return (
    <svg className="poster-wallpaper" aria-hidden="true">
      <defs>
        <pattern id="poster-tile" width="96" height="96" patternUnits="userSpaceOnUse">
          {/* sun */}
          <g transform="translate(18 18)" fill="#e2a33a" stroke="#b5532e" strokeWidth="1.2">
            <circle r="5.5" />
            <g strokeLinecap="round">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <line key={a} x1="0" y1="-8.5" x2="0" y2="-11" transform={`rotate(${a})`} />
              ))}
            </g>
          </g>
          {/* moon */}
          <path
            transform="translate(66 64)"
            d="M3 -9 A9 9 0 1 0 3 9 A7 7 0 1 1 3 -9 Z"
            fill="#33408f"
          />
          {/* heart */}
          <path
            transform="translate(70 20) scale(.55)"
            d="M0 6 C-10 -2 -12 -10 -6 -13 C-2 -15 0 -12 0 -10 C0 -12 2 -15 6 -13 C12 -10 10 -2 0 6 Z"
            fill="#c2462e"
          />
          <path
            transform="translate(22 70) scale(.4)"
            d="M0 6 C-10 -2 -12 -10 -6 -13 C-2 -15 0 -12 0 -10 C0 -12 2 -15 6 -13 C12 -10 10 -2 0 6 Z"
            fill="#c2462e"
          />
          {/* sparkles */}
          <path transform="translate(46 44)" d="M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6 Z" fill="#fbf1dc" />
          <path transform="translate(88 88) scale(.7)" d="M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6 Z" fill="#fbf1dc" />
          {/* drumstick */}
          <g transform="translate(44 84) rotate(-35)">
            <ellipse cx="0" cy="-4" rx="5" ry="6.5" fill="#a5532f" />
            <rect x="-1.2" y="1.5" width="2.4" height="6" rx="1" fill="#fbf1dc" />
            <circle cx="-1.6" cy="8" r="1.7" fill="#fbf1dc" />
            <circle cx="1.6" cy="8" r="1.7" fill="#fbf1dc" />
          </g>
          {/* paw */}
          <g transform="translate(86 44) scale(.42)" fill="#7a3a26" opacity=".75">
            <ellipse cx="0" cy="4" rx="7" ry="6" />
            <ellipse cx="-8" cy="-4" rx="2.6" ry="3.4" />
            <ellipse cx="-3" cy="-9" rx="2.6" ry="3.4" />
            <ellipse cx="3" cy="-9" rx="2.6" ry="3.4" />
            <ellipse cx="8" cy="-4" rx="2.6" ry="3.4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#poster-tile)" />
    </svg>
  );
}

export default function RetroHero({ today, dayCount }) {
  return (
    <section className="poster">
      <Wallpaper />

      <div className="poster-top">
        <span>FOX LITTLE WORLD</span>
        <span>NO.{String(dayCount).padStart(3, "0")}</span>
      </div>

      <div className="poster-sign">
        <p className="poster-kicker">
          DAWN <small>and</small> MOON
        </p>
        <h1>我们的小世界</h1>
        <p className="poster-names">
          曦 <span>♡</span> 望舒
        </p>
      </div>

      <div className="poster-ribbon">
        <span>在一起的第 {dayCount} 天</span>
      </div>

      <div className="poster-ticket">
        <small>SINCE</small>
        <strong>2026.10.03</strong>
      </div>

      <p className="poster-date">
        {today.getFullYear()} · {pad(today.getMonth() + 1)} · {pad(today.getDate())}
      </p>
    </section>
  );
}
