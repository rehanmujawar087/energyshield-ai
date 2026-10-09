import L from "leaflet";

// Small emoji-in-a-div markers — avoids the classic broken-default-marker-
// image problem with Leaflet + Vite bundling, and keeps styling in CSS.
function emojiIcon(emoji, className) {
  return L.divIcon({
    html: `<span class="map-emoji-icon ${className}">${emoji}</span>`,
    className: "map-emoji-icon-wrapper",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export const portIcon = emojiIcon("⚓", "map-emoji-icon--port");
export const refineryIcon = emojiIcon("🏭", "map-emoji-icon--refinery");
export const sprIcon = emojiIcon("🛢️", "map-emoji-icon--spr");
export const vesselIcon = emojiIcon("🚢", "map-emoji-icon--vessel");
