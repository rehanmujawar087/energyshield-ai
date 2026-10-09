import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip } from "react-leaflet";
import { CORRIDOR_LABELS, riskColorVar } from "../../lib/format.js";
import { SkeletonBlock } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";
import { portIcon, refineryIcon, sprIcon, vesselIcon } from "./icons.js";
import { useVesselRoute } from "./useVesselRoute.js";
import { MapLegend } from "./MapLegend.jsx";
import { LayerToggle } from "./LayerToggle.jsx";
import { ResetViewControl } from "./ResetViewControl.jsx";
import { CorridorDetailDrawer } from "./CorridorDetailDrawer.jsx";

const ARABIAN_SEA_CENTER = [15, 65];
const DEFAULT_ZOOM = 4;

const DEFAULT_VISIBLE = { corridors: true, ports: true, refineries: true, sprSites: true, vessels: true };

/**
 * @param {{
 *   mapLayers: any, riskCorridors: any[],
 *   loading: boolean, error: string | null,
 *   selectedCorridorId: string | null, onSelectCorridor: (id: string | null) => void,
 * }} props
 */
export function MapPanel({ mapLayers, riskCorridors, loading, error, selectedCorridorId, onSelectCorridor }) {
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);

  const corridorWaypointsById = useMemo(() => {
    const map = {};
    for (const c of mapLayers?.corridors ?? []) {
      map[c.id] = c.waypoints;
    }
    return map;
  }, [mapLayers]);

  const vessels = useVesselRoute(mapLayers?.vessels ?? [], corridorWaypointsById);

  const selectedCorridor = useMemo(
    () => riskCorridors?.find((c) => c.corridor === selectedCorridorId) ?? null,
    [riskCorridors, selectedCorridorId]
  );

  function toggleLayer(key) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }

  return (
    <section className="panel map-panel" aria-label="Digital twin map">
      <div className="panel__header">
        <h2 className="panel__title">Digital twin — corridors &amp; infrastructure</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonBlock height="560px" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !mapLayers && (
        <EmptyState icon="🗺️" title="No map data" message="Map layers did not load." />
      )}

      {!loading && !error && mapLayers && (
        <>
          <div className="map-container-wrap">
            <LayerToggle visible={visible} onToggle={toggleLayer} />

            <MapContainer
              center={ARABIAN_SEA_CENTER}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom
              style={{ height: "560px", width: "100%", borderRadius: "var(--radius)" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <ResetViewControl center={ARABIAN_SEA_CENTER} zoom={DEFAULT_ZOOM} />

              {visible.corridors &&
                mapLayers.corridors.map((corridor) => (
                  <Polyline
                    key={corridor.id}
                    positions={corridor.waypoints.map((w) => [w.lat, w.lon])}
                    pathOptions={{
                      color: riskColorVar(corridor.risk_score),
                      weight: corridor.id === selectedCorridorId ? 7 : 5,
                      opacity: 0.88,
                    }}
                    eventHandlers={{ click: () => onSelectCorridor(corridor.id) }}
                  >
                    <Tooltip sticky>
                      {CORRIDOR_LABELS[corridor.id] || corridor.name} — risk {corridor.risk_score.toFixed(0)}/100
                    </Tooltip>
                  </Polyline>
                ))}

              {visible.ports &&
                mapLayers.ports.map((p) => (
                  <Marker key={p.id} position={[p.lat, p.lon]} icon={portIcon}>
                    <Tooltip>{p.name}</Tooltip>
                  </Marker>
                ))}

              {visible.refineries &&
                mapLayers.refineries.map((r) => (
                  <Marker key={r.id} position={[r.lat, r.lon]} icon={refineryIcon}>
                    <Tooltip>
                      {r.name} — approx {Math.round(r.capacity_bpd_approx / 1000)}k bpd
                    </Tooltip>
                  </Marker>
                ))}

              {visible.sprSites &&
                mapLayers.spr_sites.map((s) => (
                  <Marker key={s.id} position={[s.lat, s.lon]} icon={sprIcon}>
                    <Tooltip>{s.name} — approx {s.capacity_mmt_approx} MMT</Tooltip>
                  </Marker>
                ))}

              {visible.vessels &&
                vessels.map((v) => (
                  <Marker key={v.id} position={[v.lat, v.lon]} icon={vesselIcon}>
                    <Tooltip>{v.name} (SIMULATED)</Tooltip>
                  </Marker>
                ))}

              {/* Subtle risk halo at each corridor's start so colouring reads before hover/click */}
              {visible.corridors &&
                mapLayers.corridors.map((corridor) => (
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

      <CorridorDetailDrawer corridor={selectedCorridor} onClose={() => onSelectCorridor(null)} />
    </section>
  );
}
