import { BORDER, INK, INK_MUTED, SERIES } from "@cfc/tokens";

/**
 * The chart theme. A screen never styles a chart inline — axes, grid,
 * tooltip, legend, and the series palette are defined once, here.
 *
 * Recharts takes colour strings rather than CSS custom properties, so these
 * import from @cfc/tokens rather than duplicating hex literals. They used to
 * be inline hex here, which drifted from the palette the moment it changed.
 *
 * The palette runs action teal → navy → amber → violet → slate → rose,
 * low-chroma so it reads as data rather than decoration.
 */
export const CHART_SERIES = SERIES;

export const CHART_GRID_COLOR = BORDER;
export const CHART_AXIS_COLOR = INK_MUTED;
export const CHART_INK_COLOR = INK;

/** Six series maximum. Beyond that the chart is the wrong form. */
export function seriesColor(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length] as string;
}
