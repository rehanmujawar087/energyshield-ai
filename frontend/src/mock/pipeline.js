// Mirrors PipelineResponse in docs/API.md — stage timings shown on the
// Pipeline Timer card. Durations are placeholders, not measured.

export const mockPipeline = {
  risk: null,
  scenario: { scenario_id: "scn_mock_0001" },
  procurement: { scenario_id: "scn_mock_0001" },
  spr: {},
  timings: [
    { stage: "risk", duration_ms: 420 },
    { stage: "scenario", duration_ms: 90 },
    { stage: "procurement", duration_ms: 140 },
    { stage: "spr", duration_ms: 60 },
  ],
  total_duration_ms: 710,
  audit_log: [
    { stage: "risk", detail: "Injected headline, corridor hormuz score 42.5 -> 58.0", timestamp: "2026-10-09T05:05:00Z" },
    { stage: "scenario", detail: "Ran preset hormuz_partial_closure, 50% closure, 30 days", timestamp: "2026-10-09T05:05:00Z" },
    { stage: "procurement", detail: "Ranked 3 mock supplier options", timestamp: "2026-10-09T05:05:00Z" },
    { stage: "spr", detail: "Computed 6-day bridge drawdown schedule", timestamp: "2026-10-09T05:05:00Z" },
  ],
  meta: { source: "mock", generated_at: "2026-10-09T05:05:00Z" },
};

export const PIPELINE_STAGE_LABELS = {
  signal: "Signal",
  risk: "Score",
  scenario: "Scenario",
  procurement: "Procurement",
  spr: "SPR",
};
