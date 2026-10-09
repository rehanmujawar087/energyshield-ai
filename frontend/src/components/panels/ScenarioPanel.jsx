import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { SCENARIO_PRESETS } from "../../mock/scenario.js";
import { formatBpd, formatPct } from "../../lib/format.js";
import { useCountUp } from "../../hooks/useCountUp.js";
import { SkeletonLines } from "../layout/Skeleton.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * @param {{
 *   result: any | null, loading: boolean, error: string | null,
 *   onRun: (params: { preset: string, corridor: string, closure_pct: number, duration_days: number, demand_elasticity: number }) => void,
 *   assumptionsByKey?: Record<string, { value: number, unit: string, source_note: string }>,
 * }} props
 */
export function ScenarioPanel({ result, loading, error, onRun, assumptionsByKey = {} }) {
  const [presetId, setPresetId] = useState(SCENARIO_PRESETS[0].id);
  const [closurePct, setClosurePct] = useState(SCENARIO_PRESETS[0].closure_pct);
  const [durationDays, setDurationDays] = useState(SCENARIO_PRESETS[0].duration_days);
  const [elasticity, setElasticity] = useState(0.05);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  function selectPreset(preset) {
    setPresetId(preset.id);
    setClosurePct(preset.closure_pct);
    setDurationDays(preset.duration_days);
  }

  function handleRun() {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId) ?? SCENARIO_PRESETS[0];
    onRun({
      preset: preset.id,
      corridor: preset.corridor,
      closure_pct: closurePct,
      duration_days: durationDays,
      demand_elasticity: elasticity,
    });
  }

  return (
    <section className="panel" aria-label="Scenario modeller">
      <div className="panel__header">
        <h2 className="panel__title">Scenario modeller</h2>
        <span className="badge-mock">mock</span>
      </div>

      <div className="chip-row" role="group" aria-label="Scenario presets">
        {SCENARIO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip-button ${p.id === presetId ? "chip-button--active" : ""}`}
            onClick={() => selectPreset(p)}
            disabled={loading}
            aria-pressed={p.id === presetId}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="scenario-sliders">
        <SliderField
          label="Closure"
          value={closurePct}
          onChange={setClosurePct}
          min={0}
          max={100}
          step={5}
          display={`${closurePct}%`}
          disabled={loading}
        />
        <SliderField
          label="Duration"
          value={durationDays}
          onChange={setDurationDays}
          min={7}
          max={180}
          step={1}
          display={`${durationDays} days`}
          disabled={loading}
        />
        <SliderField
          label="Demand elasticity"
          value={elasticity}
          onChange={setElasticity}
          min={0}
          max={0.2}
          step={0.01}
          display={elasticity.toFixed(2)}
          disabled={loading}
        />
      </div>

      <button type="button" className="btn btn--primary" data-testid="scenario-run" onClick={handleRun} disabled={loading}>
        <Play size={14} aria-hidden="true" />
        {loading ? "Running…" : "Run scenario"}
      </button>

      {loading && <SkeletonLines count={4} />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && result && (
        <div data-testid="scenario-result">
          <dl className="stat-grid">
            <Stat label="Supply gap" value={result.supply_gap_bpd} format={formatBpd} />
            <Stat label="Refinery run-rate drop" value={result.refinery_runrate_drop_pct} format={formatPct} />
            <Stat label="Fuel price impact" value={result.fuel_price_impact_pct} format={formatPct} />
            <Stat label="SPR days of cover" value={result.spr_days_of_cover} format={(v) => `${v.toFixed(1)} days`} />
            <Stat label="Rough GDP impact" value={result.gdp_impact_pct} format={formatPct} />
          </dl>

          {result.assumptions_used?.length > 0 && (
            <div className="assumptions-expand">
              <button
                type="button"
                className="assumptions-expand__toggle"
                onClick={() => setAssumptionsOpen((o) => !o)}
                aria-expanded={assumptionsOpen}
              >
                <ChevronDown size={14} className={assumptionsOpen ? "rotate-180" : ""} aria-hidden="true" />
                Assumptions used ({result.assumptions_used.length})
              </button>
              {assumptionsOpen && (
                <ul className="assumptions-expand__list">
                  {result.assumptions_used.map((key) => {
                    const a = assumptionsByKey[key];
                    return (
                      <li key={key}>
                        <strong className="font-mono">{key}</strong>
                        {a && (
                          <>
                            {" "}
                            = {a.value} {a.unit} — <span className="text-faint">{a.source_note}</span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SliderField({ label, value, onChange, min, max, step, display, disabled }) {
  return (
    <label className="slider-field">
      <span className="slider-field__label">
        <span>{label}</span>
        <span className="font-mono">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </label>
  );
}

function Stat({ label, value, format }) {
  const animated = useCountUp(value);
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className="font-display">{format(animated)}</dd>
    </div>
  );
}
