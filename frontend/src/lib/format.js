export const CORRIDOR_WATCH_NOTES = {
  hormuz: "Watch for tanker insurance premium spikes, naval incident reports, and Iran-US diplomatic statements.",
  bab_el_mandeb: "Watch for Houthi attack claims, shipping rerouting announcements, and Suez traffic volume drops.",
  suez: "Watch for canal transit delays, Egyptian government statements, and grounding/blockage reports.",
  malacca: "Watch for piracy advisories and Singapore/Malaysia port congestion reports.",
  cape_route: "Watch for storm/weather routing and freight rate changes on the bypass route.",
};

export const CORRIDOR_LABELS = {
  hormuz: "Strait of Hormuz",
  bab_el_mandeb: "Bab-el-Mandeb / Red Sea",
  suez: "Suez Canal",
  malacca: "Strait of Malacca",
  cape_route: "Cape of Good Hope route",
};

/** green < 40, amber 40-70, red > 70 */
export function riskLevel(score) {
  if (score > 70) return "red";
  if (score >= 40) return "amber";
  return "green";
}

export function riskColorVar(score) {
  const level = riskLevel(score);
  return `var(--risk-${level})`;
}

export function formatNumber(n, opts = {}) {
  return new Intl.NumberFormat("en-IN", opts).format(n);
}

export function formatBpd(n) {
  return `${formatNumber(Math.round(n))} bpd`;
}

export function formatUsd(n) {
  return `$${n.toFixed(2)}`;
}

export function formatPct(n, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function formatClock(date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
