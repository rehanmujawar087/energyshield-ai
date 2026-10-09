import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Anchor, Factory, Fuel, Ship } from "lucide-react";

// Render a lucide icon to static SVG markup and wrap it in a Leaflet
// divIcon — avoids the classic broken-default-marker-image problem with
// Leaflet + Vite bundling, and keeps styling in CSS.
function lucideIcon(IconComponent, className) {
  const svg = renderToStaticMarkup(createElement(IconComponent, { size: 14, strokeWidth: 2.25 }));
  return L.divIcon({
    html: `<span class="map-emoji-icon ${className}">${svg}</span>`,
    className: "map-emoji-icon-wrapper",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export const portIcon = lucideIcon(Anchor, "map-emoji-icon--port");
export const refineryIcon = lucideIcon(Factory, "map-emoji-icon--refinery");
export const sprIcon = lucideIcon(Fuel, "map-emoji-icon--spr");
export const vesselIcon = lucideIcon(Ship, "map-emoji-icon--vessel");
