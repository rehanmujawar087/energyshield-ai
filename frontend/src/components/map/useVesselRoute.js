import { useEffect, useRef, useState } from "react";
import { interpolateAlongPath, pingPong } from "../../lib/geo.js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";

/**
 * Animates each SIMULATED vessel back and forth along its own corridor's
 * waypoints, instead of a static or random position — this is cosmetic
 * motion for the demo, not real vessel tracking.
 *
 * @param {Array<{id: string, corridor: string}>} vessels
 * @param {Record<string, Array<{lat: number, lon: number}>>} corridorWaypointsById
 */
export function useVesselRoute(vessels, corridorWaypointsById, periodMs = 26000) {
  const reducedMotion = usePrefersReducedMotion();
  const rafRef = useRef(null);

  function computeAt(elapsedMs) {
    return vessels.map((v, i) => {
      const waypoints = corridorWaypointsById[v.corridor];
      if (!waypoints || waypoints.length < 2) return v;
      // Stagger each vessel's phase so a corridor's vessels don't move in lockstep.
      const phase = elapsedMs / periodMs + i / Math.max(vessels.length, 1);
      const pos = interpolateAlongPath(waypoints, pingPong(phase * 2));
      return { ...v, lat: pos.lat, lon: pos.lon };
    });
  }

  const [positions, setPositions] = useState(() => computeAt(0));

  useEffect(() => {
    setPositions(computeAt(0));
    if (reducedMotion || vessels.length === 0) return undefined;

    const start = performance.now();
    function tick(now) {
      setPositions(computeAt(now - start));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vessels, corridorWaypointsById, reducedMotion, periodMs]);

  return positions;
}
