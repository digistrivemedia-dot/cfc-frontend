/**
 * Token values that must exist in JavaScript.
 *
 * Almost everything reads tokens through CSS custom properties in tokens.css.
 * A few places genuinely cannot — a `<meta name="theme-color">` tag, a canvas
 * fill, a chart library that takes a colour string — and those import from here.
 *
 * These are the only literal hex values permitted anywhere outside tokens.css,
 * and they are kept in step with it by hand. If you change a value here, change
 * it there.
 */

/** Mirrors --color-surface. Browser chrome, meta theme-color. */
export const SURFACE = "#ffffff";

/** Mirrors --color-ink. Canvas text where CSS variables cannot reach. */
export const INK = "#0f1728";

/** Mirrors --color-ink-muted. Chart axis labels. */
export const INK_MUTED = "#5c6472";

/** Mirrors --color-border. Chart gridlines. */
export const BORDER = "#e7eaef";

/** Mirrors --color-structure. The navy rail; also the second chart series. */
export const STRUCTURE = "#0e1f3d";

/** Mirrors --color-action. Chart hover cursors and focus rings in canvas work. */
export const ACTION = "#0891a0";

/**
 * Mirrors --color-series-1..6. Recharts takes colour strings, not CSS
 * variables, so the chart theme reads the palette from here.
 *
 * Action teal leads because a chart's primary series should read as the
 * subject of the screen. Navy follows. Neither reads as clickable inside a
 * plot area, where nothing is.
 */
export const SERIES = [
  "#0891a0", // action teal — always the primary series
  "#0e1f3d", // navy
  "#b8790f", // amber — the same value as --color-clock
  "#7b5ea7", // violet
  "#4a7c9b", // slate blue
  "#9a5a6b", // muted rose
] as const;
