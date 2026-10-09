/** Linear interpolation along a polyline of {lat, lon} points, t in [0,1]. */
export function interpolateAlongPath(waypoints, t) {
  if (!waypoints || waypoints.length === 0) return { lat: 0, lon: 0 };
  if (waypoints.length === 1) return waypoints[0];

  const segLengths = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const d = Math.hypot(b.lat - a.lat, b.lon - a.lon);
    segLengths.push(d);
    total += d;
  }

  let dist = Math.max(0, Math.min(t, 1)) * total;
  for (let i = 0; i < segLengths.length; i++) {
    const isLast = i === segLengths.length - 1;
    if (dist <= segLengths[i] || isLast) {
      const segT = segLengths[i] === 0 ? 0 : Math.min(dist / segLengths[i], 1);
      const a = waypoints[i];
      const b = waypoints[i + 1];
      return { lat: a.lat + (b.lat - a.lat) * segT, lon: a.lon + (b.lon - a.lon) * segT };
    }
    dist -= segLengths[i];
  }
  return waypoints[waypoints.length - 1];
}

/** Maps an ever-increasing value to a 0 -> 1 -> 0 ping-pong, for back-and-forth motion. */
export function pingPong(t) {
  const cycle = t % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}
