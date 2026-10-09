import { Waypoints, Anchor, Factory, Fuel, Ship } from "lucide-react";

const LAYERS = [
  { key: "corridors", label: "Corridors", Icon: Waypoints },
  { key: "ports", label: "Ports", Icon: Anchor },
  { key: "refineries", label: "Refineries", Icon: Factory },
  { key: "sprSites", label: "SPR sites", Icon: Fuel },
  { key: "vessels", label: "Vessels", Icon: Ship },
];

/**
 * @param {{ visible: Record<string, boolean>, onToggle: (key: string) => void }} props
 */
export function LayerToggle({ visible, onToggle }) {
  return (
    <fieldset className="layer-toggle" aria-label="Map layers">
      <legend className="layer-toggle__legend">Layers</legend>
      {LAYERS.map(({ key, label, Icon }) => (
        <label key={key} className="layer-toggle__item">
          <input
            type="checkbox"
            checked={visible[key]}
            onChange={() => onToggle(key)}
            aria-label={`Toggle ${label} layer`}
          />
          <Icon size={13} aria-hidden="true" />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
