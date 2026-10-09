import { useRef } from "react";
import { X, Info } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

/**
 * Explains what in this demo is real vs simulated/mock. Focus-trapped,
 * closes on Escape or backdrop click, returns focus to the trigger button.
 */
export function AboutModal({ open, onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, open, onClose);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        ref={containerRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        data-testid="about-modal"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="about-modal-title" className="modal__title">
            <Info size={18} aria-hidden="true" /> About this demo
          </h2>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          <p>
            EnergyShield AI is a hackathon prototype built for IEEE SYNAPSE 2026. This panel exists so nothing on
            screen is mistaken for a live operational system.
          </p>
          <ul className="modal__list">
            <li>
              <strong>Vessel positions are always SIMULATED.</strong> There is no live AIS feed — vessels drift along
              illustrative waypoints for the demo.
            </li>
            <li>
              <strong>The three headline KPIs</strong> (import dependence, Hormuz share, SPR cover) are the fixed
              figures from the problem statement brief, not computed from live data.
            </li>
            <li>
              <strong>Everything else is mock data</strong> unless the "DATA SOURCE" pill in the header says LIVE —
              it tries the real backend first and clearly falls back to local mock files, marked with a{" "}
              <span className="badge-mock">MOCK</span> chip, if the backend isn't reachable.
            </li>
            <li>
              <strong>Numbers never come from the LLM.</strong> The language model (where used) only drafts text —
              scores, gaps, costs and reserve figures come from deterministic formulas.
            </li>
          </ul>
          <p className="text-faint">
            See <code>docs/API.md</code> and <code>data/README.md</code> in the repository for full source notes.
          </p>
        </div>
      </div>
    </div>
  );
}
