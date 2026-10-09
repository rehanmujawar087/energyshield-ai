import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AlertTriangle, SlidersHorizontal, Truck, Database, Workflow } from "lucide-react";
import { api } from "./lib/api.js";
import { useApiOrMock } from "./lib/useApiOrMock.js";
import { useToast, ToastProvider } from "./components/layout/ToastProvider.jsx";
import { Header } from "./components/layout/Header.jsx";
import { KpiStrip } from "./components/layout/KpiStrip.jsx";
import { SkeletonBlock } from "./components/layout/Skeleton.jsx";

// Code-split the map: leaflet + react-leaflet are the single biggest
// contributor to bundle size, and the map isn't needed to paint the rest
// of the dashboard first.
const MapPanel = lazy(() => import("./components/map/MapPanel.jsx").then((m) => ({ default: m.MapPanel })));
import { Tabs, TabPanel } from "./components/ui/Tabs.jsx";
import { CorridorRiskList } from "./components/panels/CorridorRiskList.jsx";
import { ScenarioPanel } from "./components/panels/ScenarioPanel.jsx";
import { ProcurementPanel } from "./components/panels/ProcurementPanel.jsx";
import { SprChartPanel } from "./components/panels/SprChartPanel.jsx";
import { PipelineTimerCard } from "./components/panels/PipelineTimerCard.jsx";
import { InjectHeadlineBar } from "./components/panels/InjectHeadlineBar.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { mockScenarioResult } from "./mock/scenario.js";
import { mockRiskCorridors } from "./mock/riskCorridors.js";
import { mockMapLayers } from "./mock/mapLayers.js";
import { mockAssumptions } from "./mock/assumptions.js";
import { mockProcurement } from "./mock/procurement.js";
import { mockSprPlan } from "./mock/sprPlan.js";
import { mockPipeline } from "./mock/pipeline.js";

const TAB_ITEMS = [
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "scenario", label: "Scenario", icon: SlidersHorizontal },
  { id: "procurement", label: "Procurement", icon: Truck },
  { id: "reserves", label: "Reserves", icon: Database },
  { id: "pipeline", label: "Pipeline", icon: Workflow },
];

/**
 * Dashboard shell. Every panel loads via useApiOrMock: it tries the real
 * backend first and falls back to the local mock/ data if that backend
 * isn't reachable. Either source is currently mock-sourced (see
 * docs/API.md) — that's what the header's DATA SOURCE pill communicates.
 */
function Dashboard() {
  const { show: showToast } = useToast();

  const riskQuery = useApiOrMock(() => api.getRiskCorridors(), mockRiskCorridors, { deps: [] });
  const mapQuery = useApiOrMock(() => api.getMapLayers(), mockMapLayers, { deps: [] });
  const assumptionsQuery = useApiOrMock(() => api.getAssumptions(), mockAssumptions, { deps: [] });

  const [activeTab, setActiveTab] = useState("risk");
  const [corridors, setCorridors] = useState(null);
  const [selectedCorridorId, setSelectedCorridorId] = useState(null);
  const [deltaByCorridor, setDeltaByCorridor] = useState({});

  const [pipeline, setPipeline] = useState({
    scenario: null,
    procurement: null,
    spr: null,
    timings: null,
    totalMs: null,
    auditLog: null,
    loading: false,
    error: null,
  });
  const [lastScenarioParams, setLastScenarioParams] = useState({
    preset: "hormuz_partial_closure",
    corridor: "hormuz",
    closure_pct: 50,
    duration_days: 30,
    demand_elasticity: 0.05,
  });
  const [injecting, setInjecting] = useState(false);
  // Tracks whether the most recent scenario/inject-headline action reached
  // the real backend. null = no pipeline action run yet (not counted below).
  const [pipelineLive, setPipelineLive] = useState(null);

  // Sync the first successful corridor load into local state so inject-headline
  // can update individual corridors afterwards without re-fetching everything.
  useEffect(() => {
    if (riskQuery.data) setCorridors(riskQuery.data.corridors);
  }, [riskQuery.data]);

  const assumptionsByKey = useMemo(() => {
    const list = assumptionsQuery.data?.assumptions ?? [];
    return Object.fromEntries(list.map((a) => [a.key, a]));
  }, [assumptionsQuery.data]);

  // The header's DATA SOURCE pill reflects reality: LIVE only if every
  // panel that has loaded so far reached the real backend, MOCK if none
  // did, PARTIAL if mixed.
  const dataSourceStatus = useMemo(() => {
    const flags = [];
    if (riskQuery.data) flags.push(riskQuery.isLive);
    if (mapQuery.data) flags.push(mapQuery.isLive);
    if (pipelineLive !== null) flags.push(pipelineLive);
    if (flags.length === 0) return "MOCK";
    if (flags.every(Boolean)) return "LIVE";
    if (flags.every((f) => !f)) return "MOCK";
    return "PARTIAL";
  }, [riskQuery.data, riskQuery.isLive, mapQuery.data, mapQuery.isLive, pipelineLive]);

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
        audit_log: mockPipeline.audit_log,
      };
      return { result: mockResult, live: false };
    }
  }

  async function handleRunScenario(scenarioParams) {
    setLastScenarioParams(scenarioParams);
    setPipeline((p) => ({ ...p, loading: true, error: null }));

    const { result, live } = await runPipelineRequest({ headline: null, scenario: scenarioParams });

    setPipelineLive(live);
    if (!live) showToast("Demo mode — backend not reachable, showing mock scenario results", { tone: "warn" });

    setPipeline({
      scenario: result.scenario,
      procurement: result.procurement,
      spr: result.spr,
      timings: result.timings,
      totalMs: result.total_duration_ms,
      auditLog: result.audit_log ?? null,
      loading: false,
      error: null,
    });
  }

  /** The Pipeline tab's "Run full pipeline" button re-runs with the most
   * recently used scenario parameters (or the default), so switching to
   * that tab and running it doesn't require re-entering scenario inputs. */
  function handleRunFullPipeline() {
    handleRunScenario(lastScenarioParams);
  }

  async function handleInjectHeadline(headline) {
    setInjecting(true);
    const defaultScenario = { preset: "hormuz_partial_closure", corridor: "hormuz", closure_pct: 50, duration_days: 30 };
    const previousScores = Object.fromEntries((corridors ?? []).map((c) => [c.corridor, c.score]));

    const { result, live } = await runPipelineRequest({ headline, scenario: defaultScenario });

    setPipelineLive(live);

    let changedCorridor = null;
    if (live && result.risk?.updated_corridor) {
      const updated = result.risk.updated_corridor;
      changedCorridor = updated.corridor;
      setCorridors((prev) => (prev ? prev.map((c) => (c.corridor === updated.corridor ? updated : c)) : prev));
      showToast(`Risk updated: ${updated.name} now ${updated.score.toFixed(0)}/100`, { tone: "info" });
    } else if (!live) {
      showToast("Demo mode — backend not reachable, using mock data", { tone: "warn" });
      // Keep the demo interactive even offline: bump the likely corridor a bit.
      const guess =
        headline.toLowerCase().includes("red sea") || headline.toLowerCase().includes("yemen")
          ? "bab_el_mandeb"
          : "hormuz";
      changedCorridor = guess;
      setCorridors((prev) =>
        prev ? prev.map((c) => (c.corridor === guess ? { ...c, score: Math.min(c.score + 15, 100) } : c)) : prev
      );
    }

    if (changedCorridor && previousScores[changedCorridor] != null) {
      // Delta is computed after the state update settles, using the mock
      // bump amount or the live new score minus the old one.
      setTimeout(() => {
        setCorridors((prev) => {
          const now = prev?.find((c) => c.corridor === changedCorridor)?.score;
          if (now != null) {
            const delta = Math.round(now - previousScores[changedCorridor]);
            setDeltaByCorridor((d) => ({ ...d, [changedCorridor]: delta }));
            setTimeout(() => setDeltaByCorridor((d) => ({ ...d, [changedCorridor]: undefined })), 4000);
          }
          return prev;
        });
      }, 0);
    }

    setPipeline({
      scenario: result.scenario,
      procurement: result.procurement,
      spr: result.spr,
      timings: result.timings,
      totalMs: result.total_duration_ms,
      auditLog: result.audit_log ?? null,
      loading: false,
      error: null,
    });
    setInjecting(false);
  }

  return (
    <div className="app">
      <Header dataSourceStatus={dataSourceStatus} />

      <KpiStrip highestRiskCorridor={highestRiskCorridor} loading={riskQuery.loading} />

      <main className="main-grid" aria-label="Risk map and analysis panels">
        <Suspense fallback={<div className="panel"><SkeletonBlock height="560px" /></div>}>
          <MapPanel
            mapLayers={mapQuery.data}
            riskCorridors={corridors}
            loading={mapQuery.loading}
            error={mapQuery.error}
            selectedCorridorId={selectedCorridorId}
            onSelectCorridor={setSelectedCorridorId}
            onRetry={mapQuery.refetch}
          />
        </Suspense>

        <div className="right-column">
          <Tabs items={TAB_ITEMS} activeId={activeTab} onChange={setActiveTab} />

          <TabPanel id="risk" activeId={activeTab}>
            <InjectHeadlineBar onSubmit={handleInjectHeadline} submitting={injecting} />
            <CorridorRiskList
              corridors={corridors}
              loading={riskQuery.loading}
              error={riskQuery.error}
              onSelect={setSelectedCorridorId}
              deltaByCorridor={deltaByCorridor}
              onRetry={riskQuery.refetch}
            />
          </TabPanel>

          <TabPanel id="scenario" activeId={activeTab}>
            <ScenarioPanel
              result={pipeline.scenario}
              loading={pipeline.loading}
              error={pipeline.error}
              onRun={handleRunScenario}
              assumptionsByKey={assumptionsByKey}
            />
          </TabPanel>

          <TabPanel id="procurement" activeId={activeTab}>
            <ProcurementPanel result={pipeline.procurement} loading={pipeline.loading} error={pipeline.error} />
          </TabPanel>

          <TabPanel id="reserves" activeId={activeTab}>
            <SprChartPanel plan={pipeline.spr} loading={pipeline.loading} error={pipeline.error} />
          </TabPanel>

          <TabPanel id="pipeline" activeId={activeTab}>
            <PipelineTimerCard
              timings={pipeline.timings}
              totalMs={pipeline.totalMs}
              auditLog={pipeline.auditLog}
              loading={pipeline.loading}
              onRun={handleRunFullPipeline}
            />
          </TabPanel>
        </div>
      </main>

      <Footer />
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
