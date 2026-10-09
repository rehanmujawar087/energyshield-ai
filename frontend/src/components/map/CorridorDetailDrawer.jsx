import { CORRIDOR_LABELS, riskColorVar, riskLevel } from "../../lib/format.js";

/**
 * @param {{ corridor: any | null, onClose: () => void }} props
 */
export function CorridorDetailDrawer({ corridor, onClose }) {
  if (!corridor) return null;

  const { breakdown } = corridor;

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-label={`${CORRIDOR_LABELS[corridor.corridor] || corridor.name} risk detail`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer__header">
          <h3>{CORRIDOR_LABELS[corridor.corridor] || corridor.name}</h3>
          <button className="btn" onClick={onClose} aria-label="Close corridor detail">
            ✕
          </button>
        </div>

        <div className="drawer__score">
          <span className={`drawer__score-value risk-${riskLevel(corridor.score)}`}>{corridor.score.toFixed(0)}</span>
          <span className="drawer__score-max">/ 100</span>
        </div>

        <div className="drawer__breakdown">
          <BreakdownBar label="News severity" value={breakdown.news_severity} weight={breakdown.weights.news_severity} />
          <BreakdownBar label="Price volatility" value={breakdown.price_volatility} weight={breakdown.weights.price_volatility} />
          <BreakdownBar label="Vessel anomaly" value={breakdown.vessel_anomaly} weight={breakdown.weights.vessel_anomaly} />
        </div>

        <h4 className="drawer__subheading">Evidence</h4>
        {corridor.evidence.length === 0 ? (
          <p className="drawer__empty">No evidence logged for this corridor yet.</p>
        ) : (
          <ul className="drawer__evidence">
            {corridor.evidence.map((e, i) => (
              <li key={i}>
                <p className="drawer__evidence-headline">{e.headline}</p>
                <p className="drawer__evidence-meta">
                  {e.event_type} · severity {e.severity}/5 ·{" "}
                  {new Date(e.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {e.source_url && (
                  <a href={e.source_url} target="_blank" rel="noreferrer">
                    source ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function BreakdownBar({ label, value, weight }) {
  return (
    <div className="breakdown-bar">
      <div className="breakdown-bar__label">
        <span>{label}</span>
        <span className="text-faint">weight {Math.round(weight * 100)}%</span>
      </div>
      <div className="breakdown-bar__track">
        <div
          className="breakdown-bar__fill"
          style={{ width: `${Math.min(value, 100)}%`, background: riskColorVar(value) }}
        />
      </div>
    </div>
  );
}
