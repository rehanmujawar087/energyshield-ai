import { useEffect, useState } from "react";

/**
 * Nudges each SIMULATED vessel's position slightly every tick so the map
 * doesn't look static. Pure cosmetic animation — not real movement data.
 *
 * @param {Array<{id: string, lat: number, lon: number}>} vessels
 */
export function useVesselDrift(vessels) {
  const [positions, setPositions] = useState(vessels);

  useEffect(() => {
    setPositions(vessels);
  }, [vessels]);

  useEffect(() => {
    if (!vessels.length) return;
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / 1000;
      setPositions(
        vessels.map((v, i) => ({
          ...v,
          lat: v.lat + Math.sin(t / 3 + i) * 0.15,
          lon: v.lon + Math.cos(t / 4 + i) * 0.15,
        }))
      );
    }, 1200);
    return () => clearInterval(id);
  }, [vessels]);

  return positions;
}
