import { cn } from "@/lib/utils";

/**
 * A topographic contour field: rings around a few summits, with every fifth
 * ring drawn as a slightly brighter "index contour", as on survey maps.
 * Generated deterministically on the server; purely decorative.
 */

type Peak = { cx: number; cy: number; rings: number; step: number; sx: number; sy: number; seed: number };

const PEAKS: Peak[] = [
  { cx: 1090, cy: 250, rings: 13, step: 30, sx: 1.45, sy: 0.9, seed: 1.3 },
  { cx: 200, cy: 840, rings: 8, step: 38, sx: 1.3, sy: 0.85, seed: 4.1 },
  { cx: 620, cy: -40, rings: 5, step: 30, sx: 1.7, sy: 0.7, seed: 2.6 },
];

function ringPath(peak: Peak, k: number): string {
  const n = 72;
  const radius = peak.step * (k + 1);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const wobble =
      1 +
      0.11 * Math.sin(3 * t + peak.seed + k * 0.32) +
      0.05 * Math.sin(5 * t - peak.seed * 1.7 - k * 0.21) +
      0.07 * Math.cos(2 * t + peak.seed * 0.6);
    const r = radius * wobble;
    points.push([peak.cx + Math.cos(t) * r * peak.sx, peak.cy + Math.sin(t) * r * peak.sy]);
  }
  // Closed Catmull–Rom spline through the points, as cubic Béziers.
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(
      p2[1] - (p3[1] - p1[1]) / 6,
    )} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

const RINGS = PEAKS.flatMap((peak) =>
  Array.from({ length: peak.rings }, (_, k) => ({ d: ringPath(peak, k), index: (k + 1) % 5 === 0 })),
);

export function ContourField({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <g fill="none" stroke="#E6D65C" strokeLinejoin="round">
        {RINGS.map((ring, i) => (
          <path
            key={i}
            d={ring.d}
            strokeWidth={ring.index ? 1.4 : 0.9}
            strokeOpacity={ring.index ? 0.2 : 0.09}
          />
        ))}
      </g>
    </svg>
  );
}
