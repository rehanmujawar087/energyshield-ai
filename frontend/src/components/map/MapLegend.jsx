export function MapLegend() {
  return (
    <div className="map-legend" aria-label="Map legend">
      <div className="map-legend__group">
        <span className="map-legend__swatch bg-risk-green" /> Low risk
        <span className="map-legend__swatch bg-risk-amber" /> Elevated
        <span className="map-legend__swatch bg-risk-red" /> High risk
      </div>
      <div className="map-legend__group">
        <span>⚓ Port</span>
        <span>🏭 Refinery</span>
        <span>🛢️ SPR site</span>
        <span>🚢 Vessel</span>
      </div>
      <span className="badge-mock" title="Vessel positions are simulated, not a live AIS feed">
        Vessels: simulated
      </span>
    </div>
  );
}
