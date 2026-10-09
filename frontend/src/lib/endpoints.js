/**
 * Typed list of every backend endpoint, mirroring docs/API.md exactly.
 * This is the single source of truth for paths/methods on the frontend —
 * api.js below reads from it instead of hard-coding URLs. No UI uses this
 * yet; it exists so the endpoint contract is visible and typed in one place.
 *
 * @typedef {"GET" | "POST" | "PUT"} HttpMethod
 * @typedef {{ method: HttpMethod, path: string, description: string }} EndpointDef
 */

/** @type {Record<string, EndpointDef>} */
export const ENDPOINTS = {
  health: { method: "GET", path: "/api/health", description: "Backend liveness check" },

  riskCorridors: {
    method: "GET",
    path: "/api/risk/corridors",
    description: "Current per-corridor disruption risk scores, breakdown, and evidence",
  },
  injectHeadline: {
    method: "POST",
    path: "/api/risk/inject-headline",
    description: "Manually inject a headline; bumps the matching corridor's risk score",
  },

  mapLayers: {
    method: "GET",
    path: "/api/map/layers",
    description: "Corridors (with waypoints), ports, refineries, SPR sites, simulated vessels",
  },

  getAssumptions: {
    method: "GET",
    path: "/api/assumptions",
    description: "Every assumption behind the Scenario Modeller",
  },
  updateAssumptions: {
    method: "PUT",
    path: "/api/assumptions",
    description: "Update one or more assumptions (in-memory only)",
  },

  runScenario: {
    method: "POST",
    path: "/api/scenario/run",
    description: "Run a disruption scenario; returns supply gap, price/refinery/SPR/GDP impact",
  },

  optimiseProcurement: {
    method: "POST",
    path: "/api/procurement/optimise",
    description: "Ranked sourcing options (cost, route, transit time) for a supply gap",
  },

  planSpr: {
    method: "POST",
    path: "/api/spr/plan",
    description: "SPR drawdown schedule bridging a supply gap until alternate cargo arrives",
  },

  runPipeline: {
    method: "POST",
    path: "/api/pipeline/run",
    description: "Chains risk -> scenario -> procurement -> SPR, with per-stage timing and audit log",
  },
};
