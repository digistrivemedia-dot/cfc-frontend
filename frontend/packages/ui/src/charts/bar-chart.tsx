"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, seriesColor } from "./theme";
import { ChartTooltip } from "./tooltip";
import { usePrefersReducedMotion } from "../lib/use-prefers-reduced-motion";

export interface BarSeriesDef {
  key: string;
  label: string;
}

/**
 * Grouped or stacked bar chart. Used by bookings volume, revenue breakdown.
 *
 * `prefers-reduced-motion` disables the entry animation — Recharts animates by
 * default, so `isAnimationActive` is tied to the media query at mount.
 */
export function BarChart({
  data,
  xKey,
  series,
  stacked = false,
  formatValue,
  formatAxisValue,
  height = 280,
}: {
  data: readonly object[];
  xKey: string;
  series: BarSeriesDef[];
  stacked?: boolean;
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
      <RBarChart data={data as object[]} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
        <Tooltip
          content={<ChartTooltip formatValue={formatValue} />}
          cursor={{ fill: "var(--color-action-subtle)" }}
        />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: CHART_AXIS_COLOR }}
          />
        )}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={seriesColor(i)}
            radius={[4, 4, 0, 0]}
            {...(stacked ? { stackId: "stack" } : {})}
            isAnimationActive={!reduceMotion}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
