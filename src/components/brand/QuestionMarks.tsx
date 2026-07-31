/**
 * Decorative scattered "?" motifs, matching the look of Jay's existing
 * Shorts/Reels thumbnails. Positions/rotations are a fixed list rather
 * than randomised at render time — random values would differ between
 * the server-rendered and client-hydrated markup and trigger a hydration
 * mismatch warning.
 *
 * Usage: render as the first child of a `relative` container, e.g.
 * `<div className="relative"><QuestionMarks />{content}</div>` — it
 * positions itself absolutely and ignores pointer events so it never
 * blocks the content in front of it.
 */

interface Mark {
  top: string;
  left: string;
  rotateDeg: number;
  sizeRem: number;
  opacity: number;
}

const MARKS: Mark[] = [
  { top: "6%", left: "8%", rotateDeg: -18, sizeRem: 3.5, opacity: 0.12 },
  { top: "12%", left: "82%", rotateDeg: 12, sizeRem: 4.5, opacity: 0.1 },
  { top: "28%", left: "4%", rotateDeg: 8, sizeRem: 2.5, opacity: 0.14 },
  { top: "38%", left: "90%", rotateDeg: -10, sizeRem: 3, opacity: 0.1 },
  { top: "55%", left: "12%", rotateDeg: -25, sizeRem: 3.75, opacity: 0.1 },
  { top: "62%", left: "78%", rotateDeg: 20, sizeRem: 2.75, opacity: 0.12 },
  { top: "78%", left: "6%", rotateDeg: 15, sizeRem: 4, opacity: 0.08 },
  { top: "82%", left: "88%", rotateDeg: -8, sizeRem: 3.25, opacity: 0.1 },
  { top: "95%", left: "45%", rotateDeg: 5, sizeRem: 3, opacity: 0.08 },
];

export function QuestionMarks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {MARKS.map((mark, index) => (
        <span
          key={index}
          className="absolute font-display leading-none text-yellow-300"
          style={{
            top: mark.top,
            left: mark.left,
            fontSize: `${mark.sizeRem}rem`,
            opacity: mark.opacity,
            transform: `rotate(${mark.rotateDeg}deg)`,
          }}
        >
          ?
        </span>
      ))}
    </div>
  );
}
