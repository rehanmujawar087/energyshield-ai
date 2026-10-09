/**
 * Minimal API client for the EnergyShield AI backend. One function per
 * endpoint in endpoints.js. No UI wires this up yet — it exists so module
 * owners can build dashboard components against a stable client instead of
 * hand-rolling fetch calls per component.
 *
 * All current responses have meta.source === "mock" — see docs/API.md.
 */

import { ENDPOINTS } from "./endpoints.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * @param {import("./endpoints.js").EndpointDef} endpoint
 * @param {{ body?: unknown }} [options]
 */
async function request(endpoint, { body } = {}) {
  const response = await fetch(`${BASE_URL}${endpoint.path}`, {
    method: endpoint.method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${endpoint.method} ${endpoint.path} failed: ${response.status} ${text}`);
  }

  return response.json();
}

export const api = {
  health: () => request(ENDPOINTS.health),

  getRiskCorridors: () => request(ENDPOINTS.riskCorridors),
  injectHeadline: (body) => request(ENDPOINTS.injectHeadline, { body }),

  getMapLayers: () => request(ENDPOINTS.mapLayers),

  getAssumptions: () => request(ENDPOINTS.getAssumptions),
  updateAssumptions: (body) => request(ENDPOINTS.updateAssumptions, { body }),

  runScenario: (body) => request(ENDPOINTS.runScenario, { body }),
  optimiseProcurement: (body) => request(ENDPOINTS.optimiseProcurement, { body }),
  planSpr: (body) => request(ENDPOINTS.planSpr, { body }),
  runPipeline: (body) => request(ENDPOINTS.runPipeline, { body }),
};
