// Mirrors RiskCorridorsResponse in docs/API.md. Used when the backend
// (which itself also returns mock data right now) isn't reachable.

const WEIGHTS = { news_severity: 0.5, price_volatility: 0.3, vessel_anomaly: 0.2 };

export const mockRiskCorridors = {
  corridors: [
    {
      corridor: "hormuz",
      name: "Strait of Hormuz",
      score: 43.5,
      breakdown: { news_severity: 55, price_volatility: 30, vessel_anomaly: 35, weights: WEIGHTS },
      evidence: [
        {
          headline: "Tensions rise near Strait of Hormuz after naval incident",
          source_url: "https://example.com/news/hormuz-incident",
          timestamp: "2026-10-09T03:12:00Z",
          event_type: "tanker_incident",
          severity: 3,
          corridor: "hormuz",
        },
      ],
      updated_at: "2026-10-09T04:30:00Z",
    },
    {
      corridor: "bab_el_mandeb",
      name: "Bab-el-Mandeb / Red Sea",
      score: 25.5,
      breakdown: { news_severity: 20, price_volatility: 25, vessel_anomaly: 40, weights: WEIGHTS },
      evidence: [],
      updated_at: "2026-10-09T04:30:00Z",
    },
    {
      corridor: "suez",
      name: "Suez Canal",
      score: 11.5,
      breakdown: { news_severity: 10, price_volatility: 15, vessel_anomaly: 10, weights: WEIGHTS },
      evidence: [],
      updated_at: "2026-10-09T04:30:00Z",
    },
    {
      corridor: "malacca",
      name: "Strait of Malacca",
      score: 10.0,
      breakdown: { news_severity: 8, price_volatility: 10, vessel_anomaly: 15, weights: WEIGHTS },
      evidence: [],
      updated_at: "2026-10-09T04:30:00Z",
    },
    {
      corridor: "cape_route",
      name: "Cape of Good Hope route",
      score: 6.0,
      breakdown: { news_severity: 5, price_volatility: 10, vessel_anomaly: 5, weights: WEIGHTS },
      evidence: [],
      updated_at: "2026-10-09T04:30:00Z",
    },
  ],
  meta: { source: "mock", generated_at: "2026-10-09T04:30:05Z" },
};
