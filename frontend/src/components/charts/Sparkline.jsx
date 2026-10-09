const WIDTH = 64;
const HEIGHT = 20;

/**
 * Tiny inline trend line. There is no real score history yet (see
 * docs/API.md), so this draws an illustrative ramp toward the current
 * score — clearly not a claim of historical data.
 * @param {{ currentScore: number, color: string }} props
 */
export function Sparkline({ currentScore, color }) {
  const points = [0.55, 0.7, 0.6, 0.8, 0.9, 1].map((f) => Math.max(2, currentScore * f));
  const max = Math.max(...points, 1);
  const step = WIDTH / (points.length - 1);

  const coords = points
    .map((v, i) => `${(i * step).toFixed(1)},${(HEIGHT - (v / max) * (HEIGHT - 4) - 2).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      className="sparkline"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Illustrative recent trend, not historical data"
    >
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
