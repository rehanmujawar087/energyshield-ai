import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatBpd } from "../../lib/format.js";
import { SkeletonBlock } from "../layout/Skeleton.jsx";
import { EmptyState } from "../layout/EmptyState.jsx";
import { ErrorState } from "../layout/ErrorState.jsx";

/**
 * SPR days-of-cover area, with the constant supply-gap overlaid on a
 * second axis, a hover crosshair, and the drawdown schedule as a table.
 * @param {{ plan: any | null, loading: boolean, error: string | null }} props
 */
export function SprChartPanel({ plan, loading, error }) {
  return (
    <section className="panel" aria-label="SPR drawdown plan" data-testid="reserves-chart">
      <div className="panel__header">
        <h2 className="panel__title">SPR days of cover</h2>
        <span className="badge-mock">mock</span>
      </div>

      {loading && <SkeletonBlock height="220px" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !plan && <EmptyState icon="🏛️" title="Run a scenario first" />}

      {!loading && !error && plan && (
        <>
          <div className="spr-summary">
            <span>
              Start: <strong className="font-mono">{plan.starting_days_of_cover}d</strong>
            </span>
            <span>
              After bridge: <strong className="font-mono">{plan.ending_days_of_cover}d</strong>
            </span>
          </div>

          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <ComposedChart data={plan.schedule} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="sprFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#93a1b8" fontSize={11} tickFormatter={(d) => `Day ${d}`} />
                <YAxis yAxisId="days" stroke="#93a1b8" fontSize={11} width={34} />
                <YAxis yAxisId="gap" orientation="right" stroke="#f59e0b" fontSize={11} width={0} hide />
                <Tooltip
                  cursor={{ stroke: "#93a1b8", strokeDasharray: "4 4" }}
                  contentStyle={{ background: "#0f1626", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8 }}
                  labelStyle={{ color: "#eaf0fb" }}
                  formatter={(value, name) =>
                    name === "Supply gap" ? [formatBpd(value), name] : [`${value} days`, "Cover remaining"]
                  }
                  labelFormatter={(d) => `Day ${d}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#93a1b8" }} />
                <Area
                  yAxisId="days"
                  type="monotone"
                  dataKey="days_of_cover_remaining"
                  name="Days of cover"
                  stroke="#22d3ee"
                  fill="url(#sprFill)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="gap"
                  type="monotone"
                  dataKey="drawdown_bpd"
                  name="Supply gap"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <table className="drawdown-table">
            <caption className="field-label">Drawdown schedule</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Cover remaining</th>
                <th scope="col">Drawdown</th>
              </tr>
            </thead>
            <tbody>
              {plan.schedule.map((row) => (
                <tr key={row.day}>
                  <td className="font-mono">{row.day}</td>
                  <td>{row.days_of_cover_remaining}d</td>
                  <td>{formatBpd(row.drawdown_bpd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
