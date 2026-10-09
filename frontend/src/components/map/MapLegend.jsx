import { Anchor, Factory, Fuel, Ship } from "lucide-react";

export function MapLegend() {
  return (
    <div className="map-legend" aria-label="Map legend">
      <div className="map-legend__group">
        <span className="map-legend__swatch bg-risk-green" /> Low risk
        <span className="map-legend__swatch bg-risk-amber" /> Elevated
        <span className="map-legend__swatch bg-risk-red" /> High risk
      </div>
      <div className="map-legend__group">
        <span>
          <Anchor size={12} aria-hidden="true" /> Port
        </span>
        <span>
          <Factory size={12} aria-hidden="true" /> Refinery
        </span>
        <span>
          <Fuel size={12} aria-hidden="true" /> SPR site
        </span>
        <span>
          <Ship size={12} aria-hidden="true" /> Vessel
        </span>
      </div>
      <span className="badge-mock" title="Vessel positions are simulated, not a live AIS feed">
        Vessels: simulated
      </span>
    </div>
  );
}
