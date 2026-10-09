import { PIPELINE_STAGE_LABELS } from "../../mock/pipeline.js";
import { EmptyState } from "../layout/EmptyState.jsx";

const STAGE_ORDER = ["signal", "risk", "scenario", "procurement", "spr"];

/**
 * @param {{ timings: Array<{stage: string, duration_ms: number}> | null, totalMs: number | null }} props
 */
export function PipelineTimerCard({ timings, totalMs }) {
  const byStage = new Map((timings ?? []).map((t) => [t.stage, t.duration_ms]));

  return (
    <section className="panel" aria-label="Pipeline timing">
      <div className="panel__header">
        <h2 className="panel__title">Signal → recommendation</h2>
        <span className="badge-mock">mock timings</span>
      </div>

      {!timings ? (
        <EmptyState icon="⏱️" title="Run the pipeline" message="Inject a headline or run a scenario to time it." />
      ) : (
        <>
          <ol className="pipeline-stages">
            {STAGE_ORDER.map((stage) => (
              <li key={stage} className="pipeline-stages__item">
                <span className="pipeline-stages__name">{PIPELINE_STAGE_LABELS[stage]}</span>
                <span className="pipeline-stages__duration">
                  {byStage.has(stage) ? `${byStage.get(stage)} ms` : "—"}
                </span>
              </li>
            ))}
          </ol>
          <p className="pipeline-total">
            Total: <strong>{totalMs ?? "—"} ms</strong>
          </p>
        </>
      )}
    </section>
  );
}
