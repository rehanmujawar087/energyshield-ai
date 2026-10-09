import { useEffect, useState } from "react";
import { ShieldCheck, Info, Radio, FlaskConical, Blend } from "lucide-react";
import { AboutModal } from "./AboutModal.jsx";

const STATUS_META = {
  LIVE: { label: "Live", icon: Radio, tone: "live" },
  PARTIAL: { label: "Partial", icon: Blend, tone: "partial" },
  MOCK: { label: "Demo data", icon: FlaskConical, tone: "demo" },
};

/**
 * @param {{ dataSourceStatus: "LIVE" | "PARTIAL" | "MOCK" }} props
 */
export function Header({ dataSourceStatus }) {
  const [now, setNow] = useState(() => new Date());
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const meta = STATUS_META[dataSourceStatus] ?? STATUS_META.MOCK;
  const StatusIcon = meta.icon;

  const istTime = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="topbar" role="banner">
      <div className="topbar__brand">
        <span className="topbar__logo" aria-hidden="true">
          <ShieldCheck size={26} strokeWidth={2} />
        </span>
        <div>
          <h1 className="topbar__title">EnergyShield AI</h1>
          <p className="topbar__tagline">Anticipatory energy-supply resilience</p>
        </div>
      </div>

      <div className="topbar__status">
        <span
          className={`pill pill--${meta.tone}`}
          data-testid="data-source-pill"
          title="Reflects whether every panel reached the live backend, some did, or none did (see About)"
        >
          <StatusIcon size={13} aria-hidden="true" />
          {meta.label}
        </span>

        <button
          className="btn btn--ghost"
          data-testid="about-button"
          onClick={() => setAboutOpen(true)}
          aria-haspopup="dialog"
        >
          <Info size={14} aria-hidden="true" />
          About
        </button>

        <time className="topbar__clock font-mono" dateTime={now.toISOString()} aria-label="Current time, India Standard Time">
          {istTime} IST
        </time>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </header>
  );
}
