import { useEffect, useState } from "react";
import { formatClock } from "../../lib/format.js";

/**
 * @param {{ isLive: boolean }} props - whether the last data load reached
 * the real backend (still mock-sourced either way, see useApiOrMock.js).
 */
export function TopBar({ isLive }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar" role="banner">
      <div className="topbar__brand">
        <span className="topbar__logo" aria-hidden="true">
          🛡️
        </span>
        <div>
          <h1 className="topbar__title">EnergyShield AI</h1>
          <p className="topbar__tagline">Anticipatory energy-supply resilience</p>
        </div>
      </div>

      <div className="topbar__status">
        <span
          className={`pill ${isLive ? "pill--live" : "pill--demo"}`}
          title={isLive ? "Reached the backend (mock data)" : "Backend unreachable — using local mock data"}
        >
          <span className="dot" style={{ background: isLive ? "var(--accent-cyan)" : "var(--accent-amber)" }} />
          Demo data
        </span>
        <time className="topbar__clock" dateTime={now.toISOString()} aria-label="Current time">
          {formatClock(now)}
        </time>
      </div>
    </header>
  );
}
