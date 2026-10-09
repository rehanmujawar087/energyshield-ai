import { useState } from "react";
import { Trophy, Scale, ChevronDown } from "lucide-react";
import { CORRIDOR_LABELS, formatBpd, formatUsd } from "../../lib/format.js";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * @param {{ result: any | null, loading: boolean, error: string | null }} props
 */
export function ProcurementPanel({ result, loading, error }) {
  const [compareIds, setCompareIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);

  function toggleCompare(id) {
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  const compareOptions = result?.options.filter((o) => compareIds.includes(o.supplier_id)) ?? [];

  return (
    <section className="panel" aria-label="Procurement options">
      <div className="panel__header">
        <h2 className="panel__title">Procurement options</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge-mock">mock</span>
          {result && (
            <button
              type="button"
              className={`chip-button ${compareMode ? "chip-button--active" : ""}`}
              onClick={() => setCompareMode((m) => !m)}
              aria-pressed={compareMode}
            >
              <Scale size={12} aria-hidden="true" /> Compare
            </button>
          )}
        </div>
      </div>

      {loading && <SkeletonLines count={3} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState icon="🛢️" title="Run a scenario first" />}

      {!loading && !error && result && (
        <>
          <ol className="procurement-list">
            {result.options.map((o) => (
              <li
                key={o.supplier_id}
                className={`procurement-card ${o.rank === 1 ? "procurement-card--best" : ""}`}
                data-testid="procurement-option"
              >
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={compareIds.includes(o.supplier_id)}
                    onChange={() => toggleCompare(o.supplier_id)}
                    aria-label={`Select ${o.supplier_name} for comparison`}
                  />
                )}
                <span className="procurement-card__rank">
                  {o.rank === 1 ? <Trophy size={13} aria-hidden="true" /> : `#${o.rank}`}
                </span>
                <div className="procurement-card__body">
                  <span className="procurement-card__route">
                    {o.supplier_name} <span className="text-faint">→</span> {CORRIDOR_LABELS[o.route_corridor] || o.route_corridor}
                  </span>
                  <div className="procurement-card__chips">
                    <span className="chip chip--green">Compatible grade</span>
                    <span className="chip" style={{ color: "var(--text-dim)", borderColor: "var(--border-strong)" }}>
                      {o.transit_days}d transit
                    </span>
                  </div>
                </div>
                <div className="procurement-card__figures">
                  <span className="procurement-card__cost font-display">{formatUsd(o.landed_cost_usd_per_bbl)}/bbl</span>
                  <span className="text-faint">{formatBpd(o.volume_bpd)}</span>
                </div>
              </li>
            ))}
          </ol>

          {compareMode && compareOptions.length > 1 && (
            <table className="compare-table">
              <caption className="field-label">Comparing {compareOptions.length} options</caption>
              <thead>
                <tr>
                  <th scope="col">Supplier</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Transit</th>
                  <th scope="col">Volume</th>
                </tr>
              </thead>
              <tbody>
                {compareOptions.map((o) => (
                  <tr key={o.supplier_id}>
                    <td>{o.supplier_name}</td>
                    <td>{formatUsd(o.landed_cost_usd_per_bbl)}</td>
                    <td>{o.transit_days}d</td>
                    <td>{formatBpd(o.volume_bpd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <details className="memo-collapsible">
            <summary>
              <ChevronDown size={14} aria-hidden="true" /> AI memo
            </summary>
            <p className="procurement-memo">{result.memo}</p>
          </details>
        </>
      )}
    </section>
  );
}
