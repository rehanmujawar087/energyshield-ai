import { useState } from "react";
import { SCENARIO_PRESETS } from "../../mock/scenario.js";
import { formatBpd, formatPct } from "../../lib/format.js";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * @param {{ result: any | null, loading: boolean, error: string | null, onRun: (presetId: string) => void }} props
 */
export function ScenarioPanel({ result, loading, error, onRun }) {
  const [presetId, setPresetId] = useState(SCENARIO_PRESETS[0].id);

  return (
    <section className="panel" aria-label="Scenario modeller">
      <div className="panel__header">
        <h2 className="panel__title">Scenario modeller</h2>
        <span className="badge-mock">mock</span>
      </div>

      <div className="scenario-controls">
        <label className="field-label" htmlFor="scenario-preset">
          Preset
        </label>
        <select
          id="scenario-preset"
          className="input"
          value={presetId}
          onChange={(e) => setPresetId(e.target.value)}
        >
          {SCENARIO_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--primary" onClick={() => onRun(presetId)} disabled={loading}>
          {loading ? "Running…" : "Run scenario"}
        </button>
      </div>

      {loading && <SkeletonLines count={4} />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && result && (
        <dl className="stat-grid">
          <Stat label="Supply gap" value={formatBpd(result.supply_gap_bpd)} />
          <Stat label="Refinery run-rate drop" value={formatPct(result.refinery_runrate_drop_pct)} />
          <Stat label="Fuel price impact" value={formatPct(result.fuel_price_impact_pct)} />
          <Stat label="SPR days of cover" value={`${result.spr_days_of_cover} days`} />
          <Stat label="Rough GDP impact" value={formatPct(result.gdp_impact_pct)} />
        </dl>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
