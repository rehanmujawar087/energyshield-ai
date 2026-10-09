// Mirrors ProcurementResponse in docs/API.md.

export const mockProcurement = {
  scenario_id: "scn_mock_0001",
  options: [
    { supplier_id: "sup_uae", supplier_name: "UAE (Fujairah bypass)", route_corridor: "hormuz", volume_bpd: 473025, landed_cost_usd_per_bbl: 84.5, transit_days: 6, rank: 1 },
    { supplier_id: "sup_us_gulf", supplier_name: "US Gulf Coast", route_corridor: "cape_route", volume_bpd: 360400, landed_cost_usd_per_bbl: 89.0, transit_days: 21, rank: 2 },
    { supplier_id: "sup_nigeria", supplier_name: "Nigeria (Bonny Light)", route_corridor: "cape_route", volume_bpd: 292825, landed_cost_usd_per_bbl: 90.25, transit_days: 18, rank: 3 },
  ],
  memo: "MOCK MEMO: Based on a supply gap of 1,126,250 bpd, the top-ranked option is UAE (Fujairah bypass) via hormuz at $84.50/bbl landed, arriving in 6 days.",
  meta: { source: "mock", generated_at: "2026-10-09T04:55:00Z" },
};
