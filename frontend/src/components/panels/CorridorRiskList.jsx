import { CORRIDOR_LABELS, riskLevel } from "../../lib/format.js";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * Ranked corridor risk list with a simple horizontal bar per corridor
 * (current score as a fraction of 100 — not a time-series sparkline, since
 * there is no history yet; see docs/API.md).
 *
 * @param {{ corridors: any[] | null, loading: boolean, error: string | null, onSelect?: (id: string) => void }} props
 */
export function CorridorRiskList({ corridors, loading, error, onSelect }) {
  const ranked = corridors ? [...corridors].sort((a, b) => b.score - a.score) : null;

  return (
    <section className="panel" aria-label="Corridor risk ranking">
      <div className="panel__header">
        <h2 className="panel__title">Corridor risk</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonLines count={5} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && (!ranked || ranked.length === 0) && (
        <EmptyState icon="📉" title="No risk data" />
      )}

      {!loading && !error && ranked && ranked.length > 0 && (
        <ul className="risk-list">
          {ranked.map((c) => (
            <li key={c.corridor}>
              <button
                type="button"
                className="risk-list__row"
                onClick={() => onSelect?.(c.corridor)}
                aria-label={`View ${CORRIDOR_LABELS[c.corridor] || c.name} risk detail, score ${c.score.toFixed(0)}`}
              >
                <span className="risk-list__name">{CORRIDOR_LABELS[c.corridor] || c.name}</span>
                <span className={`risk-list__score risk-${riskLevel(c.score)}`}>{c.score.toFixed(0)}</span>
                <span className="risk-list__bar-track">
                  <span
                    className={`risk-list__bar-fill bg-risk-${riskLevel(c.score)}`}
                    style={{ width: `${Math.min(c.score, 100)}%` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
