/**
 * Minimal Round-1 app shell. Just renders the project name so we can verify
 * the Vite dev server builds and starts. Dashboard components (map, risk
 * panel, scenario/procurement/SPR panels) are added in later commits.
 */
export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>EnergyShield AI</h1>
      <p>Frontend scaffold — dashboard coming soon.</p>
    </div>
  );
}
