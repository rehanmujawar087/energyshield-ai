import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/api.js";
import { useApiOrMock } from "./lib/useApiOrMock.js";
import { useToast, ToastProvider } from "./components/layout/ToastProvider.jsx";
import { TopBar } from "./components/layout/TopBar.jsx";
import { KpiStrip } from "./components/layout/KpiStrip.jsx";
import { MapPanel } from "./components/map/MapPanel.jsx";
import { CorridorRiskList } from "./components/panels/CorridorRiskList.jsx";
import { ScenarioPanel } from "./components/panels/ScenarioPanel.jsx";
import { ProcurementPanel } from "./components/panels/ProcurementPanel.jsx";
import { SprChartPanel } from "./components/panels/SprChartPanel.jsx";
import { PipelineTimerCard } from "./components/panels/PipelineTimerCard.jsx";
import { InjectHeadlineBar } from "./components/panels/InjectHeadlineBar.jsx";
import { SCENARIO_PRESETS, mockScenarioResult } from "./mock/scenario.js";
import { mockRiskCorridors } from "./mock/riskCorridors.js";
import { mockMapLayers } from "./mock/mapLayers.js";
import { mockProcurement } from "./mock/procurement.js";
import { mockSprPlan } from "./mock/sprPlan.js";
import { mockPipeline } from "./mock/pipeline.js";

/**
 * Dashboard shell. Every panel loads via useApiOrMock: it tries the real
 * backend first and falls back to the local mock/ data if that backend
 * isn't reachable. Either source is currently mock-sourced (see
 * docs/API.md) — that's what the "Demo data" pill communicates.
 */
function Dashboard() {
  const { show: showToast } = useToast();

  const riskQuery = useApiOrMock(() => api.getRiskCorridors(), mockRiskCorridors, { deps: [] });
  const mapQuery = useApiOrMock(() => api.getMapLayers(), mockMapLayers, { deps: [] });

  const [corridors, setCorridors] = useState(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState(null);

  const [pipeline, setPipeline] = useState({
    scenario: null,
    procurement: null,
    spr: null,
    timings: null,
    totalMs: null,
    loading: false,
    error: null,
  });
  const [injecting, setInjecting] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Sync the first successful corridor load into local state so inject-headline
  // can update individual corridors afterwards without re-fetching everything.
  useEffect(() => {
    if (riskQuery.data) {
      setCorridors(riskQuery.data.corridors);
      setIsLive(riskQuery.isLive);
    }
  }, [riskQuery.data, riskQuery.isLive]);

  const highestRiskCorridor = useMemo(() => {
    if (!corridors || corridors.length === 0) return null;
    return corridors.reduce((max, c) => (c.score > max.score ? c : max), corridors[0]);
  }, [corridors]);

  async function runPipelineRequest({ headline, scenario }) {
    try {
      const live = await api.runPipeline({ headline, scenario });
      return { result: live, live: true };
    } catch {
      // Backend not reachable — fall back to local mock pipeline shape.
      const mockResult = {
        risk: headline
          ? {
              extracted_event: { headline, timestamp: new Date().toISOString(), event_type: "tanker_incident", severity: 4, corridor: scenario.corridor || "hormuz" },
              updated_corridor: null,
            }
          : null,
        scenario: mockScenarioResult,
        procurement: mockProcurement,
        spr: mockSprPlan,
        timings: mockPipeline.timings,
        total_duration_ms: mockPipeline.total_duration_ms,
      };
      return { result: mockResult, live: false };
    }
  }

  async function handleRunScenario(presetId) {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId) ?? SCENARIO_PRESETS[0];
    setPipeline((p) => ({ ...p, loading: true, error: null }));

    const { result, live } = await runPipelineRequest({
      headline: null,
      scenario: {
        preset: preset.id,
        corridor: preset.corridor,
        closure_pct: preset.closure_pct,
        duration_days: preset.duration_days,
      },
    });

    setIsLive(live);
    if (!live) showToast("Demo mode — backend not reachable, showing mock scenario results", { tone: "warn" });

    setPipeline({
      scenario: result.scenario,
      procurement: result.procurement,
      spr: result.spr,
      timings: result.timings,
      totalMs: result.total_duration_ms,
      loading: false,
      error: null,
    });
  }

  async function handleInjectHeadline(headline) {
    setInjecting(true);
    const defaultScenario = { preset: "hormuz_partial_closure", corridor: "hormuz", closure_pct: 50, duration_days: 30 };
    const { result, live } = await runPipelineRequest({ headline, scenario: defaultScenario });

    setIsLive(live);

    if (live && result.risk?.updated_corridor) {
      const updated = result.risk.updated_corridor;
      setCorridors((prev) => (prev ? prev.map((c) => (c.corridor === updated.corridor ? updated : c)) : prev));
      showToast(`Risk updated: ${updated.name} now ${updated.score.toFixed(0)}/100`, { tone: "info" });
    } else if (!live) {
      showToast("Demo mode — backend not reachable, using mock data", { tone: "warn" });
      // Keep the demo interactive even offline: bump the likely corridor a bit.
      const guess = headline.toLowerCase().includes("red sea") || headline.toLowerCase().includes("yemen")
        ? "bab_el_mandeb"
        : "hormuz";
      setCorridors((prev) =>
        prev ? prev.map((c) => (c.corridor === guess ? { ...c, score: Math.min(c.score + 15, 100) } : c)) : prev
      );
    }

    setPipeline({
      scenario: result.scenario,
      procurement: result.procurement,
      spr: result.spr,
      timings: result.timings,
      totalMs: result.total_duration_ms,
      loading: false,
      error: null,
    });
    setInjecting(false);
  }

  return (
    <div className="app">
      <TopBar isLive={isLive} />

      <InjectHeadlineBar onSubmit={handleInjectHeadline} submitting={injecting} />

      <KpiStrip highestRiskCorridor={highestRiskCorridor} loading={riskQuery.loading} />

      <div className="main-grid">
        <MapPanel
          mapLayers={mapQuery.data}
          riskCorridors={corridors}
          loading={mapQuery.loading}
          error={mapQuery.error}
          selectedCorridorId={selectedCorridorId}
          onSelectCorridor={setSelectedCorridorId}
        />

        <div className="right-column">
          <CorridorRiskList
            corridors={corridors}
            loading={riskQuery.loading}
            error={riskQuery.error}
            onSelect={setSelectedCorridorId}
          />
          <ScenarioPanel
            result={pipeline.scenario}
            loading={pipeline.loading}
            error={pipeline.error}
            onRun={handleRunScenario}
          />
          <ProcurementPanel result={pipeline.procurement} loading={pipeline.loading} error={pipeline.error} />
          <SprChartPanel plan={pipeline.spr} loading={pipeline.loading} error={pipeline.error} />
          <PipelineTimerCard timings={pipeline.timings} totalMs={pipeline.totalMs} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
