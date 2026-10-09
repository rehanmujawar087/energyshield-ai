import { useCountUp } from "../../hooks/useCountUp.js";
import { riskColorVar } from "../../lib/format.js";

const SIZE = 96;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular 0-100 risk score gauge. Colour is never the only signal — the
 * numeric score is always rendered in the centre too.
 * @param {{ score: number, label?: string }} props
 */
export function RiskGauge({ score, label }) {
  const animated = useCountUp(score);
  const color = riskColorVar(score);
  const offset = CIRCUMFERENCE * (1 - Math.min(animated, 100) / 100);

  return (
    <div className="risk-gauge" role="img" aria-label={`${label ?? "Risk score"}: ${score.toFixed(0)} out of 100`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset var(--duration-slow) var(--ease-out)" }}
        />
      </svg>
      <div className="risk-gauge__value font-display" style={{ color }}>
        {Math.round(animated)}
      </div>
    </div>
  );
}
