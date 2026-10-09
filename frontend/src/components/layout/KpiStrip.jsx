import { riskLevel, CORRIDOR_LABELS } from "../../lib/format.js";
import { SkeletonBlock } from "./Skeleton.jsx";

/**
 * Four headline KPI cards. The first three use the stated PS figures
 * (labelled with their source); the fourth is computed from loaded
 * corridor risk data.
 *
 * @param {{ highestRiskCorridor: { corridor: string, score: number } | null, loading: boolean }} props
 */
export function KpiStrip({ highestRiskCorridor, loading }) {
  return (
    <section className="kpi-strip" aria-label="Key risk indicators">
      <KpiCard label="Import dependence" value="88%" note="Crude oil imports, PS brief" />
      <KpiCard label="Via Strait of Hormuz" value="40–45%" note="Share of India's crude imports, PS brief" />
      <KpiCard label="SPR cover" value="~9.5 days" note="Strategic Petroleum Reserve, PS brief" />
      {loading || !highestRiskCorridor ? (
        <div className="kpi-card">
          <span className="kpi-card__label">Highest corridor risk</span>
          <SkeletonBlock width="70%" height="28px" />
        </div>
      ) : (
        <KpiCard
          label="Highest corridor risk"
          value={`${highestRiskCorridor.score.toFixed(0)} / 100`}
          note={CORRIDOR_LABELS[highestRiskCorridor.corridor] || highestRiskCorridor.corridor}
          riskLevel={riskLevel(highestRiskCorridor.score)}
        />
      )}
    </section>
  );
}

function KpiCard({ label, value, note, riskLevel: level }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <span className={`kpi-card__value ${level ? `risk-${level}` : ""}`}>{value}</span>
      <span className="kpi-card__note">{note}</span>
    </div>
  );
}
