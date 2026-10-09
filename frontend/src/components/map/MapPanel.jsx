import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Polyline, CircleMarker, Marker, Tooltip } from "react-leaflet";
import { CORRIDOR_LABELS, riskColorVar } from "../../lib/format.js";
import { SkeletonBlock } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";
import { useToast } from "../layout/ToastProvider.jsx";
import { portIcon, refineryIcon, sprIcon, vesselIcon } from "./icons.js";
import { useVesselRoute } from "./useVesselRoute.js";
import { MapLegend } from "./MapLegend.jsx";
import { LayerToggle } from "./LayerToggle.jsx";
import { ResetViewControl } from "./ResetViewControl.jsx";
import { CorridorDetailDrawer } from "./CorridorDetailDrawer.jsx";
// Simplified world land outline (Natural Earth 1:110m, public domain),
// used as an offline fallback when basemap tiles fail to load — see
// handleTileError below. ~135KB.
import worldLand from "../../mock/world-simple.json";

const ARABIAN_SEA_CENTER = [15, 65];
const DEFAULT_ZOOM = 4;

// Tile loads can fail individually and recover (one slow/dropped tile is
// normal even on good connections) — only treat it as "basemap is down"
// after several failures in a short window, so a single hiccup doesn't
// trigger the offline fallback.
const TILE_FAILURE_THRESHOLD = 4;

const WORLD_LAND_STYLE = {
  fillColor: "var(--bg-panel-2)",
  color: "var(--border-strong)",
  weight: 1,
  fillOpacity: 0.95,
  // Distinguishes these paths from corridor polylines (both render as
  // plain SVG <path> — this className is how scripts/smoke.mjs confirms
  // the land fallback specifically rendered, not just "some path").
  className: "world-land-path",
};

const DEFAULT_VISIBLE = { corridors: true, ports: true, refineries: true, sprSites: true, vessels: true };
// Stable empty-array reference. `mapLayers?.vessels ?? []` would otherwise
// create a brand new array every render while mapLayers is still loading,
// which useVesselRoute's effect sees as "changed" every time — an
// infinite render loop (caught by scripts/smoke.mjs's console-error check).
const NO_VESSELS = [];

/**
 * @param {{
 *   mapLayers: any, riskCorridors: any[],
 *   loading: boolean, error: string | null,
 *   selectedCorridorId: string | null, onSelectCorridor: (id: string | null) => void,
 *   onRetry?: () => void,
 * }} props
 */
export function MapPanel({ mapLayers, riskCorridors, loading, error, selectedCorridorId, onSelectCorridor, onRetry }) {
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);
  const [tilesOffline, setTilesOffline] = useState(false);
  const tileErrorCount = useRef(0);
  const { show: showToast } = useToast();

  function handleTileError() {
    // react-leaflet binds eventHandlers once at TileLayer mount and doesn't
    // rebind them on re-render, so this closure always sees the *initial*
    // tilesOffline value (false) no matter how many renders have happened
    // since — reading that state here would never see a flip. The ref-
    // based counter doesn't have that problem (refs are mutated in place,
    // not captured by value), so use strict equality against it as a
    // one-shot guard instead of state. setTilesOffline/showToast themselves
    // are unaffected by the stale closure: the setter functions are stable
    // across renders regardless of which render's closure calls them.
    tileErrorCount.current += 1;
    if (tileErrorCount.current === TILE_FAILURE_THRESHOLD) {
      setTilesOffline(true);
      showToast("Basemap tiles unavailable, showing offline outline", { tone: "warn" });
    }
  }

  const corridorWaypointsById = useMemo(() => {
    const map = {};
    for (const c of mapLayers?.corridors ?? []) {
      map[c.id] = c.waypoints;
    }
    return map;
  }, [mapLayers]);

  const vessels = useVesselRoute(mapLayers?.vessels ?? NO_VESSELS, corridorWaypointsById);

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
      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
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
              {/* Keyless OSM standard tiles, no API key required. Darkened to
                  match the control-room theme via a CSS filter on the tile
                  pane (see .map-tile-pane-dark in index.css) rather than a
                  provider-side dark style, since those need a key. */}
              <TileLayer
                className="map-tile-pane-dark"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                eventHandlers={{ tileerror: handleTileError }}
              />
              <ResetViewControl center={ARABIAN_SEA_CENTER} zoom={DEFAULT_ZOOM} />

              {/* Offline fallback: a simplified world land outline, shown
                  only once tile loads have actually failed repeatedly.
                  Rendered before the corridors/markers below so they stay
                  on top of it. */}
              {tilesOffline && <GeoJSON data={worldLand} style={WORLD_LAND_STYLE} interactive={false} />}

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
