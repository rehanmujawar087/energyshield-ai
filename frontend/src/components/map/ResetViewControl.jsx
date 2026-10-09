import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * A plain Leaflet control (not a React-rendered DOM node) so it is
 * positioned and clipped correctly inside the map pane. Resets the view
 * to the given center/zoom.
 */
export function ResetViewControl({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: "topright" });
    control.onAdd = () => {
      const container = L.DomUtil.create("div", "map-reset-control leaflet-bar");
      const button = L.DomUtil.create("button", "", container);
      button.type = "button";
      button.textContent = "Reset view";
      button.setAttribute("aria-label", "Reset map view");
      L.DomEvent.on(button, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        map.setView(center, zoom);
      });
      L.DomEvent.disableClickPropagation(container);
      return container;
    };
    control.addTo(map);
    return () => control.remove();
  }, [map, center, zoom]);

  return null;
}
