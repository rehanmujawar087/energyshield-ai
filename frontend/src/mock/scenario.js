// Mirrors ScenarioResult in docs/API.md.

export const mockScenarioResult = {
  scenario_id: "scn_mock_0001",
  supply_gap_bpd: 1126250,
  refinery_runrate_drop_pct: 12.5,
  fuel_price_impact_pct: 8.0,
  spr_days_of_cover: 7.9,
  gdp_impact_pct: -0.24,
  assumptions_used: ["india_crude_demand_bpd", "hormuz_import_share_pct", "spr_total_days_cover"],
  meta: { source: "mock", generated_at: "2026-10-09T04:50:00Z" },
};

export const SCENARIO_PRESETS = [
  { id: "hormuz_partial_closure", label: "Hormuz 50% closure, 30 days", corridor: "hormuz", closure_pct: 50, duration_days: 30 },
  { id: "red_sea_suspension", label: "Red Sea suspension, 45 days", corridor: "bab_el_mandeb", closure_pct: 100, duration_days: 45 },
  { id: "opec_cut", label: "OPEC+ supply cut, 60 days", corridor: "hormuz", closure_pct: 20, duration_days: 60 },
];
