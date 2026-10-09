// Mirrors MapLayersResponse in docs/API.md. Waypoints/positions are
// SIMULATED/approximate — see data/README.md in the repo root.

export const mockMapLayers = {
  corridors: [
    {
      id: "hormuz",
      name: "Strait of Hormuz",
      waypoints: [
        { lat: 26.75, lon: 55.95 },
        { lat: 26.55, lon: 56.25 },
        { lat: 26.3, lon: 56.5 },
        { lat: 25.95, lon: 56.9 },
      ],
      risk_score: 43.5,
    },
    {
      id: "bab_el_mandeb",
      name: "Bab-el-Mandeb / Red Sea",
      waypoints: [
        { lat: 12.7, lon: 43.35 },
        { lat: 12.55, lon: 43.45 },
        { lat: 12.4, lon: 43.55 },
      ],
      risk_score: 25.5,
    },
    {
      id: "suez",
      name: "Suez Canal",
      waypoints: [
        { lat: 31.26, lon: 32.32 },
        { lat: 30.6, lon: 32.35 },
        { lat: 29.93, lon: 32.55 },
      ],
      risk_score: 11.5,
    },
    {
      id: "malacca",
      name: "Strait of Malacca",
      waypoints: [
        { lat: 5.5, lon: 98.0 },
        { lat: 3.5, lon: 100.5 },
        { lat: 1.5, lon: 103.0 },
      ],
      risk_score: 10.0,
    },
    {
      id: "cape_route",
      name: "Cape of Good Hope route",
      waypoints: [
        { lat: -20.0, lon: 10.0 },
        { lat: -34.35, lon: 18.47 },
        { lat: -10.0, lon: 55.0 },
      ],
      risk_score: 6.0,
    },
  ],
  ports: [
    { id: "jnpt", name: "Jawaharlal Nehru Port (Nhava Sheva)", lat: 18.95, lon: 72.95, type: "container_and_liquid" },
    { id: "kandla", name: "Kandla / Deendayal Port", lat: 23.02, lon: 70.22, type: "liquid_bulk" },
    { id: "paradip", name: "Paradip Port", lat: 20.27, lon: 86.68, type: "crude_and_bulk" },
    { id: "chennai", name: "Chennai Port", lat: 13.1, lon: 80.29, type: "crude_and_container" },
    { id: "new_mangalore", name: "New Mangalore Port", lat: 12.93, lon: 74.8, type: "crude_terminal" },
  ],
  refineries: [
    { id: "jamnagar", name: "Jamnagar Refinery (Reliance)", lat: 22.34, lon: 69.9, capacity_bpd_approx: 1240000 },
    { id: "vadinar", name: "Vadinar Refinery (Nayara Energy)", lat: 22.47, lon: 69.7, capacity_bpd_approx: 400000 },
    { id: "vizag_refinery", name: "Visakhapatnam Refinery (HPCL)", lat: 17.7, lon: 83.22, capacity_bpd_approx: 170000 },
    { id: "mangalore_refinery", name: "Mangalore Refinery (MRPL)", lat: 12.93, lon: 74.8, capacity_bpd_approx: 300000 },
  ],
  spr_sites: [
    { id: "visakhapatnam", name: "Visakhapatnam SPR", lat: 17.7, lon: 83.3, capacity_mmt_approx: 1.33 },
    { id: "mangaluru", name: "Mangaluru SPR", lat: 12.87, lon: 74.84, capacity_mmt_approx: 1.5 },
    { id: "padur", name: "Padur SPR", lat: 13.35, lon: 74.84, capacity_mmt_approx: 2.5 },
  ],
  vessels: [
    { id: "v001", name: "SIMULATED Tanker 1", lat: 26.4, lon: 56.3, corridor: "hormuz", simulated: true },
    { id: "v002", name: "SIMULATED Tanker 2", lat: 12.5, lon: 43.5, corridor: "bab_el_mandeb", simulated: true },
    { id: "v003", name: "SIMULATED Tanker 3", lat: 2.5, lon: 101.5, corridor: "malacca", simulated: true },
  ],
  meta: { source: "mock", generated_at: "2026-10-09T04:40:00Z" },
};
