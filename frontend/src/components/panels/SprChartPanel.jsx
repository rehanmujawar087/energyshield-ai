import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SkeletonBlock } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * @param {{ plan: any | null, loading: boolean, error: string | null }} props
 */
export function SprChartPanel({ plan, loading, error }) {
  return (
    <section className="panel" aria-label="SPR drawdown plan">
      <div className="panel__header">
        <h2 className="panel__title">SPR days of cover</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonBlock height="160px" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !plan && <EmptyState icon="🏛️" title="Run a scenario first" />}

      {!loading && !error && plan && (
        <>
          <div className="spr-summary">
            <span>
              Start: <strong>{plan.starting_days_of_cover}d</strong>
            </span>
            <span>
              After bridge: <strong>{plan.ending_days_of_cover}d</strong>
            </span>
          </div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <AreaChart data={plan.schedule} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="sprFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#93a1b8" fontSize={11} tickFormatter={(d) => `Day ${d}`} />
                <YAxis stroke="#93a1b8" fontSize={11} width={34} />
                <Tooltip
                  contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8 }}
                  labelStyle={{ color: "#e8edf7" }}
                  formatter={(value) => [`${value} days`, "Cover remaining"]}
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Area type="monotone" dataKey="days_of_cover_remaining" stroke="#22d3ee" fill="url(#sprFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
