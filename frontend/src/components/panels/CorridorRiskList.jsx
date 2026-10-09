import { CORRIDOR_LABELS, riskLevel, riskColorVar } from "../../lib/format.js";
import { Sparkline } from "../charts/Sparkline.jsx";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

const STATUS_LABEL = { green: "Low", amber: "Elevated", red: "High" };

/**
 * Ranked corridor risk list: score bar, status chip (colour is never the
 * only signal — the chip always carries a text label too), an
 * illustrative trend sparkline, and an animated "+N" delta badge right
 * after an inject-headline update.
 *
 * @param {{
 *   corridors: any[] | null, loading: boolean, error: string | null,
 *   onSelect?: (id: string) => void, deltaByCorridor?: Record<string, number>,
 *   onRetry?: () => void,
 * }} props
 */
export function CorridorRiskList({ corridors, loading, error, onSelect, deltaByCorridor = {}, onRetry }) {
  const ranked = corridors ? [...corridors].sort((a, b) => b.score - a.score) : null;

  return (
    <section className="panel" aria-label="Corridor risk ranking">
      <div className="panel__header">
        <h2 className="panel__title">Corridor risk</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonLines count={5} />}
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (!ranked || ranked.length === 0) && <EmptyState icon="📉" title="No risk data" />}

      {!loading && !error && ranked && ranked.length > 0 && (
        <ul className="risk-list">
          {ranked.map((c) => {
            const level = riskLevel(c.score);
            const delta = deltaByCorridor[c.corridor];
            return (
              <li key={c.corridor}>
                <button
                  type="button"
                  className="risk-list__row"
                  data-testid="risk-row"
                  onClick={() => onSelect?.(c.corridor)}
                  aria-label={`View ${CORRIDOR_LABELS[c.corridor] || c.name} risk detail, score ${c.score.toFixed(0)}, status ${STATUS_LABEL[level]}`}
                >
                  <span className="risk-list__name">{CORRIDOR_LABELS[c.corridor] || c.name}</span>
                  <span className={`chip chip--${level}`}>{STATUS_LABEL[level]}</span>
                  <Sparkline currentScore={c.score} color={riskColorVar(c.score)} />
                  <span className={`risk-list__score risk-${level} font-mono`}>
                    {c.score.toFixed(0)}
                    {delta != null && (
                      <span className="risk-list__delta" aria-label={`changed by ${delta > 0 ? "+" : ""}${delta}`}>
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                  </span>
                  <span className="risk-list__bar-track">
                    <span className={`risk-list__bar-fill bg-risk-${level}`} style={{ width: `${Math.min(c.score, 100)}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
