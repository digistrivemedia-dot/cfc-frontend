"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, seriesColor } from "./theme";
import { ChartTooltip } from "./tooltip";
import { usePrefersReducedMotion } from "../lib/use-prefers-reduced-motion";

export interface LineSeriesDef {
  key: string;
  label: string;
}

/**
 * Line chart for a trend over time — revenue, bookings, growth.
 *
 * Never a gradient fill under the line, per the design system's chart rules. A
 * flat colour or nothing.
 */
export function LineChart({
  data,
  xKey,
  series,
  formatValue,
  formatAxisValue,
  height = 280,
}: {
  data: readonly object[];
  xKey: string;
  series: LineSeriesDef[];
  /** Full-precision, used in the tooltip. */
  formatValue?: ((v: number) => string) | undefined;
  /** Compact, used on the repeated Y-axis gridlines. Falls back to `formatValue`. */
  formatAxisValue?: ((v: number) => string) | undefined;
  height?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const axisFormatter = formatAxisValue ?? formatValue;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data as object[]} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          // Recharts draws every label by default, so a 24-hour or 30-day
          // series overlaps into unreadable mush on a phone. This drops labels
          // until each has room, which costs nothing on a wide chart (there is
          // already space, so none are dropped) and makes a narrow one legible.
          minTickGap={16}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
          width={56}
          allowDecimals={false}
          {...(axisFormatter && { tickFormatter: axisFormatter })}
        />
        <Tooltip content={<ChartTooltip formatValue={formatValue} />} />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: CHART_AXIS_COLOR }}
          />
        )}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={seriesColor(i)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={!reduceMotion}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}
