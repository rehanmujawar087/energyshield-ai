import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip } from "react-leaflet";
import { CORRIDOR_LABELS, riskColorVar } from "../../lib/format.js";
import { SkeletonBlock } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";
import { portIcon, refineryIcon, sprIcon, vesselIcon } from "./icons.js";
import { useVesselDrift } from "./useVesselDrift.js";
import { MapLegend } from "./MapLegend.jsx";
import { CorridorDetailDrawer } from "./CorridorDetailDrawer.jsx";

const ARABIAN_SEA_CENTER = [15, 65];

/**
 * @param {{
 *   mapLayers: any, riskCorridors: any[],
 *   loading: boolean, error: string | null,
 * }} props
 */
export function MapPanel({ mapLayers, riskCorridors, loading, error }) {
  const [selectedCorridorId, setSelectedCorridorId] = useState(null);
  const vessels = useVesselDrift(mapLayers?.vessels ?? []);

  const selectedCorridor = useMemo(
    () => riskCorridors?.find((c) => c.corridor === selectedCorridorId) ?? null,
    [riskCorridors, selectedCorridorId]
  );

  return (
    <section className="panel map-panel" aria-label="Digital twin map">
      <div className="panel__header">
        <h2 className="panel__title">Digital twin — corridors &amp; infrastructure</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonBlock height="420px" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !mapLayers && (
        <EmptyState icon="🗺️" title="No map data" message="Map layers did not load." />
      )}

      {!loading && !error && mapLayers && (
        <>
          <div className="map-container-wrap">
            <MapContainer
              center={ARABIAN_SEA_CENTER}
              zoom={4}
              scrollWheelZoom
              style={{ height: "420px", width: "100%", borderRadius: "var(--radius)" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {mapLayers.corridors.map((corridor) => (
                <Polyline
                  key={corridor.id}
                  positions={corridor.waypoints.map((w) => [w.lat, w.lon])}
                  pathOptions={{ color: riskColorVar(corridor.risk_score), weight: 5, opacity: 0.85 }}
                  eventHandlers={{ click: () => setSelectedCorridorId(corridor.id) }}
                >
                  <Tooltip sticky>
                    {CORRIDOR_LABELS[corridor.id] || corridor.name} — risk {corridor.risk_score.toFixed(0)}/100
                  </Tooltip>
                </Polyline>
              ))}

              {mapLayers.ports.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lon]} icon={portIcon}>
                  <Tooltip>⚓ {p.name}</Tooltip>
                </Marker>
              ))}

              {mapLayers.refineries.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lon]} icon={refineryIcon}>
                  <Tooltip>
                    🏭 {r.name} — approx {Math.round(r.capacity_bpd_approx / 1000)}k bpd
                  </Tooltip>
                </Marker>
              ))}

              {mapLayers.spr_sites.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lon]} icon={sprIcon}>
                  <Tooltip>🛢️ {s.name} — approx {s.capacity_mmt_approx} MMT</Tooltip>
                </Marker>
              ))}

              {vessels.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lon]} icon={vesselIcon}>
                  <Tooltip>🚢 {v.name} (SIMULATED)</Tooltip>
                </Marker>
              ))}

              {/* Subtle risk halo so corridor colouring reads even before hover/click */}
              {mapLayers.corridors.map((corridor) => (
                <CircleMarker
                  key={`halo-${corridor.id}`}
                  center={[corridor.waypoints[0].lat, corridor.waypoints[0].lon]}
                  radius={6}
                  pathOptions={{ color: riskColorVar(corridor.risk_score), fillOpacity: 0.6 }}
                />
              ))}
            </MapContainer>
          </div>
          <MapLegend />
        </>
      )}

      <CorridorDetailDrawer corridor={selectedCorridor} onClose={() => setSelectedCorridorId(null)} />
    </section>
  );
}
