import React from "react";

// One-line "signature" fox: the outline is a single stroke that ends in a tail
// curling under the chin, so it can be drawn like a pen signing its name.
// Each stroke draws in order when `drawing` is on (see .sig-fox in style.css).
const strokes = [
  {
    d: "M24 98 C30 84 36 70 41 58 C42 44 43 28 46 13 C62 22 76 34 84 47 C95 43 105 43 116 47 C124 34 138 22 154 13 C157 28 158 44 159 58 C164 70 170 84 176 98 C170 99 165 101 162 104 C166 105 168 107 169 110 C160 110 153 112 148 115 C138 124 118 134 100 137 C82 134 62 124 52 115 C47 112 40 110 31 110 C32 107 34 105 38 104 C35 101 30 99 24 98 C14 104 14 120 26 132 C50 154 112 162 158 144 C176 137 188 126 186 112 C185 106 180 104 177 108",
    width: 2.2,
    time: 1.9,
  },
  { d: "M51 28 C58 37 64 45 67 53", width: 1.5, time: 0.25 },
  { d: "M149 28 C142 37 136 45 133 53", width: 1.5, time: 0.25 },
  { d: "M52 115 C66 112 80 113 92 121", width: 1.4, time: 0.3 },
  { d: "M148 115 C134 112 120 113 108 121", width: 1.4, time: 0.3 },
  { d: "M66 88 Q74 79 83 87", width: 2.4, time: 0.22 },
  { d: "M134 88 Q126 79 117 87", width: 2.4, time: 0.22 },
  { d: "M100 128 Q100 133 94 133 M100 128 Q100 133 106 133", width: 1.7, time: 0.25 },
];

const NOSE = "M94 121 Q100 117 106 121 Q103 127 100 128 Q97 127 94 121 Z";

export default function SignatureFox({ drawing = false, delay = 0, className = "" }) {
  let at = delay;
  const timed = strokes.map((stroke) => {
    const start = at;
    at += stroke.time;
    return { ...stroke, start };
  });
  const end = at;

  return (
    <svg
      className={`sig-fox ${drawing ? "is-drawing" : ""} ${className}`}
      viewBox="0 0 200 170"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {timed.map((stroke) => (
        <path
          key={stroke.d}
          className="sig-stroke"
          d={stroke.d}
          strokeWidth={stroke.width}
          pathLength="1"
          style={{ "--start": `${stroke.start}s`, "--time": `${stroke.time}s` }}
        />
      ))}
      <g className="sig-dab" style={{ "--start": `${end}s` }}>
        <path d={NOSE} fill="currentColor" strokeWidth="1.5" />
        <ellipse cx="63" cy="99" rx="7" ry="3.4" fill="#e3a998" stroke="none" opacity=".55" />
        <ellipse cx="137" cy="99" rx="7" ry="3.4" fill="#e3a998" stroke="none" opacity=".55" />
      </g>
    </svg>
  );
}

export const SIGNATURE_FOX_TIME = strokes.reduce((sum, s) => sum + s.time, 0);
