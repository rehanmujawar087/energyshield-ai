import { useCallback, useEffect, useState } from "react";

/**
 * Tries a live backend call first; if the backend isn't reachable (not
 * running, CORS, network error), falls back to local mock data after a
 * short simulated delay so the loading skeleton is actually visible.
 *
 * Either way the data is currently mock-sourced (the backend's own mock
 * endpoints return meta.source === "mock" too) — isLive just tells callers
 * whether the *network call* succeeded, for the "DEMO DATA" pill wording.
 *
 * Returns a `refetch()` function so panels can wire a working Retry
 * button even though this hook never surfaces a terminal `error` today
 * (it always falls back to mock rather than failing — see docs/API.md).
 *
 * @param {() => Promise<any>} apiFn
 * @param {any} mockData
 * @param {{ deps?: any[], delayMs?: number }} [options]
 */
export function useApiOrMock(apiFn, mockData, { deps = [], delayMs = 450 } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null, isLive: false });
  const [generation, setGeneration] = useState(0);
  const refetch = useCallback(() => setGeneration((g) => g + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const live = await apiFn();
        if (!cancelled) setState({ data: live, loading: false, error: null, isLive: true });
        return;
      } catch {
        // Backend not reachable in this environment — fall back to mock.
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (!cancelled) setState({ data: mockData, loading: false, error: null, isLive: false });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, generation]);

  return { ...state, refetch };
}
