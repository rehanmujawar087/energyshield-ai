import { useEffect } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab focus within `containerRef` while `active` is true,
 * closes on Escape via `onClose`, and restores focus to whatever was
 * focused before the trap activated once it deactivates.
 */
export function useFocusTrap(containerRef, active, onClose) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const previouslyFocused = document.activeElement;
    const container = containerRef.current;

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE));
    const first = focusables()[0];
    (first || container).focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = focusables();
      if (nodes.length === 0) return;
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [active, containerRef, onClose]);
}
