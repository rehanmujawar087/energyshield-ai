import { Info, AlertTriangle } from "lucide-react";
import { riskLevel, CORRIDOR_LABELS } from "../../lib/format.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { SkeletonBlock } from "./Skeleton.jsx";

/**
 * Four headline KPI cards. The first three are the fixed problem-statement
 * figures (never computed — see docs/API.md and the About modal); the
 * fourth is computed live from loaded corridor risk data.
 *
 * @param {{ highestRiskCorridor: { corridor: string, score: number } | null, loading: boolean }} props
 */
export function KpiStrip({ highestRiskCorridor, loading }) {
  return (
    <section className="kpi-strip" aria-label="Key risk indicators">
      <KpiCard
        label="Import dependence"
        value={88}
        suffix="%"
        source="India's crude oil import share — ET AI Hackathon problem statement brief"
      />
      <KpiCard
        label="Via Strait of Hormuz"
        display="40–45%"
        source="Share of India's crude imports transiting Hormuz — problem statement brief"
      />
      <KpiCard
        label="SPR cover"
        value={9.5}
        suffix=" days"
        decimals={1}
        source="Strategic Petroleum Reserve coverage at typical consumption — problem statement brief"
      />
      {loading || !highestRiskCorridor ? (
        <div className="kpi-card" data-testid="kpi-card">
          <span className="kpi-card__label">Highest corridor risk</span>
          <SkeletonBlock width="70%" height="32px" />
        </div>
      ) : (
        <KpiCard
          label="Highest corridor risk"
          value={highestRiskCorridor.score}
          suffix=" / 100"
          riskLevel={riskLevel(highestRiskCorridor.score)}
          source={`${CORRIDOR_LABELS[highestRiskCorridor.corridor] || highestRiskCorridor.corridor} — live from the Risk Intelligence Agent (mock data for now)`}
        />
      )}
    </section>
  );
}

function KpiCard({ label, value, display, suffix = "", decimals = 0, riskLevel: level, source }) {
  const animated = useCountUp(display ? null : value);
  const shown = display ?? `${animated.toFixed(decimals)}${suffix}`;

  return (
    <div className={`kpi-card ${level ? `kpi-card--${level}` : ""}`} data-testid="kpi-card">
      <div className="kpi-card__label-row">
        <span className="kpi-card__label">{label}</span>
        {level === "red" && <AlertTriangle size={13} className="risk-red" aria-hidden="true" />}
        {source && (
          <span className="info-tip" tabIndex={0} aria-label={`Source: ${source}`}>
            <Info size={13} aria-hidden="true" />
            <span className="info-tip__bubble" role="tooltip">
              {source}
            </span>
          </span>
        )}
      </div>
      <span className={`kpi-card__value font-display ${level ? `risk-${level}` : ""}`}>{shown}</span>
    </div>
  );
}
