import { useRef } from "react";
import { X, ExternalLink, Eye } from "lucide-react";
import { CORRIDOR_LABELS, CORRIDOR_WATCH_NOTES, riskColorVar } from "../../lib/format.js";
import { RiskGauge } from "../ui/RiskGauge.jsx";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

/**
 * @param {{ corridor: any | null, onClose: () => void }} props
 */
export function CorridorDetailDrawer({ corridor, onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, Boolean(corridor), onClose);

  if (!corridor) return null;

  const { breakdown } = corridor;
  const label = CORRIDOR_LABELS[corridor.corridor] || corridor.name;

  return (
    <div className="drawer-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        ref={containerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${label} risk detail`}
        data-testid="corridor-drawer"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer__header">
          <h3>{label}</h3>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close corridor detail" data-testid="drawer-close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="drawer__gauge-row">
          <RiskGauge score={corridor.score} label={`${label} risk score`} />
          <p className="drawer__watch">
            <Eye size={14} aria-hidden="true" /> {CORRIDOR_WATCH_NOTES[corridor.corridor] || "No notes yet."}
          </p>
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
                <p className="drawer__evidence-meta font-mono">
                  {e.event_type} · severity {e.severity}/5 ·{" "}
                  {new Date(e.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {e.source_url && (
                  <a href={e.source_url} target="_blank" rel="noreferrer">
                    source <ExternalLink size={11} aria-hidden="true" style={{ display: "inline" }} />
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
