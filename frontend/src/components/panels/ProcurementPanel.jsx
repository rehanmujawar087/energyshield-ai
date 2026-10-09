import { CORRIDOR_LABELS, formatBpd, formatUsd } from "../../lib/format.js";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * @param {{ result: any | null, loading: boolean, error: string | null }} props
 */
export function ProcurementPanel({ result, loading, error }) {
  return (
    <section className="panel" aria-label="Procurement options">
      <div className="panel__header">
        <h2 className="panel__title">Procurement options</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonLines count={3} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState icon="🛢️" title="Run a scenario first" />}

      {!loading && !error && result && (
        <>
          <ol className="procurement-list">
            {result.options.map((o) => (
              <li key={o.supplier_id} className="procurement-list__item">
                <span className="procurement-list__rank">#{o.rank}</span>
                <div className="procurement-list__body">
                  <span className="procurement-list__name">{o.supplier_name}</span>
                  <span className="procurement-list__meta">
                    via {CORRIDOR_LABELS[o.route_corridor] || o.route_corridor} · {formatBpd(o.volume_bpd)} ·{" "}
                    {o.transit_days}d transit
                  </span>
                </div>
                <span className="procurement-list__cost">{formatUsd(o.landed_cost_usd_per_bbl)}/bbl</span>
              </li>
            ))}
          </ol>
          <p className="procurement-memo">{result.memo}</p>
        </>
      )}
    </section>
  );
}
