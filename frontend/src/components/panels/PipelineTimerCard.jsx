import { useEffect, useState } from "react";
import { Play, CheckCircle2, Loader2 } from "lucide-react";
import { PIPELINE_STAGE_LABELS } from "../../mock/pipeline.js";
import { EmptyState } from "../layout/EmptyState.jsx";

const STAGE_ORDER = ["signal", "risk", "scenario", "procurement", "spr"];
const REVEAL_STEP_MS = 380;

/**
 * Animated stage-by-stage stepper: Signal -> Score -> Scenario ->
 * Procurement -> SPR. The underlying pipeline call is effectively
 * instant (mock data); this component paces the reveal of each already-
 * known stage so the "signal -> recommendation" flow is visible, not an
 * artificial delay on the real timings shown once revealed.
 *
 * @param {{
 *   timings: Array<{stage: string, duration_ms: number}> | null, totalMs: number | null,
 *   auditLog: Array<{stage: string, detail: string, timestamp: string}> | null,
 *   loading: boolean, onRun: () => void,
 * }} props
 */
export function PipelineTimerCard({ timings, totalMs, auditLog, loading, onRun }) {
  const [revealedCount, setRevealedCount] = useState(timings ? STAGE_ORDER.length : 0);

  useEffect(() => {
    if (!timings) return;
    setRevealedCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i >= STAGE_ORDER.length) clearInterval(id);
    }, REVEAL_STEP_MS);
    return () => clearInterval(id);
  }, [timings]);

  const byStage = new Map((timings ?? []).map((t) => [t.stage, t.duration_ms]));
  const done = revealedCount >= STAGE_ORDER.length;

  return (
    <section className="panel" aria-label="Pipeline timing">
      <div className="panel__header">
        <h2 className="panel__title">Signal → recommendation</h2>
        <span className="badge-mock">mock timings</span>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        data-testid="pipeline-run"
        onClick={onRun}
        disabled={loading}
        style={{ marginBottom: "var(--space-2)" }}
      >
        {loading ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        {loading ? "Running…" : "Run full pipeline"}
      </button>

      {!timings ? (
        <EmptyState icon="⏱️" title="Run the pipeline" message="Times every stage from signal to recommendation." />
      ) : (
        <>
          <ol className="pipeline-stages" aria-label="Pipeline stages">
            {STAGE_ORDER.map((stage, i) => {
              const revealed = i < revealedCount;
              return (
                <li
                  key={stage}
                  className={`pipeline-stages__item ${revealed ? "pipeline-stages__item--done" : "pipeline-stages__item--pending"}`}
                >
                  {revealed ? (
                    <CheckCircle2 size={13} aria-hidden="true" />
                  ) : (
                    <Loader2 size={13} className="spin" aria-hidden="true" />
                  )}
                  <span className="pipeline-stages__name">{PIPELINE_STAGE_LABELS[stage]}</span>
                  <span className="pipeline-stages__duration font-mono">
                    {revealed ? (byStage.has(stage) ? `${byStage.get(stage)} ms` : "—") : ""}
                  </span>
                </li>
              );
            })}
          </ol>

          {done && (
            <>
              <p className="pipeline-total" data-testid="pipeline-total">
                Total: <strong className="font-display">{totalMs ?? "—"} ms</strong>
              </p>

              {auditLog?.length > 0 && (
                <div className="audit-log">
                  <h3 className="drawer__subheading">Audit log</h3>
                  <ul>
                    {auditLog.map((entry, i) => (
                      <li key={i} className="audit-log__item">
                        <span className="chip" style={{ color: "var(--text-dim)", borderColor: "var(--border-strong)" }}>
                          {entry.stage}
                        </span>
                        <span>{entry.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
