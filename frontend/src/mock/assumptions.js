// Mirrors AssumptionsResponse in docs/API.md.

export const mockAssumptions = {
  assumptions: [
    {
      key: "india_crude_demand_bpd",
      value: 5300000,
      unit: "barrels_per_day",
      source_note: "Approximate India crude consumption, public industry estimates (see data/README.md)",
    },
    {
      key: "india_import_share_pct",
      value: 88,
      unit: "percent",
      source_note: "Commonly cited figure for India's crude import dependence (approximate)",
    },
    {
      key: "hormuz_import_share_pct",
      value: 42.5,
      unit: "percent",
      source_note: "Midpoint of commonly cited 40-45% figure for Hormuz-transiting imports",
    },
    {
      key: "spr_total_days_cover",
      value: 9.5,
      unit: "days",
      source_note: "Commonly cited ISPRL strategic reserve figure (approximate)",
    },
  ],
  meta: { source: "mock", generated_at: "2026-10-09T04:45:00Z" },
};
