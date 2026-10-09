import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <span>
        EnergyShield AI — IEEE SYNAPSE 2026 hackathon build.{" "}
        <span className="font-mono text-faint">{import.meta.env.VITE_BUILD_INFO || "dev build"}</span>
      </span>
      <a
        href="https://github.com/rehanmujawar087/energyshield-ai"
        target="_blank"
        rel="noreferrer"
        className="footer__link"
      >
        <ExternalLink size={13} aria-hidden="true" /> Repository
      </a>
      <span className="text-faint">Simulated and mock data are always labelled — see the About button above.</span>
    </footer>
  );
}
