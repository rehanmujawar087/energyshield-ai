import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

/**
 * Animates a number from its previous value to `target` over `duration`ms
 * with an ease-out curve. Jumps straight to the target if the value isn't
 * finite yet, or if the viewer prefers reduced motion.
 *
 * @param {number | null | undefined} target
 * @param {number} duration
 */
export function useCountUp(target, duration = 700) {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target == null || Number.isNaN(target)) return;

    if (reducedMotion) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(from + (target - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, reducedMotion]);

  return value;
}
