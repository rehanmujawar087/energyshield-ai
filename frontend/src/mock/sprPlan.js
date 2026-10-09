// Mirrors SprPlanResponse in docs/API.md.

export const mockSprPlan = {
  schedule: [
    { day: 0, days_of_cover_remaining: 9.5, drawdown_bpd: 1126250 },
    { day: 2, days_of_cover_remaining: 9.1, drawdown_bpd: 1126250 },
    { day: 4, days_of_cover_remaining: 8.7, drawdown_bpd: 1126250 },
    { day: 6, days_of_cover_remaining: 8.2, drawdown_bpd: 1126250 },
  ],
  starting_days_of_cover: 9.5,
  ending_days_of_cover: 8.2,
  meta: { source: "mock", generated_at: "2026-10-09T05:00:00Z" },
};
