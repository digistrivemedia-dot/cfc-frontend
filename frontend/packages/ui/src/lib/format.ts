import type { Paise, Timestamp } from "@cfc/types";

/**
 * The formatters. One currency formatter and one date formatter, used
 * everywhere. `toLocaleString` is never called inline — the lint rule enforces
 * it, and this file is the reason the rule can exist.
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Money arrives as integer paise and is only ever turned into a string here.
 *
 * 45000 → "₹450.00". Rendering it requires the `tabular` class so columns of
 * figures align; that is the caller's responsibility and is part of the
 * definition of done.
 */
export function formatCurrency(
  paise: Paise,
  options?: { compact?: boolean },
): string {
  const rupees = paise / 100;
  return options?.compact ? inrCompact.format(rupees) : inr.format(rupees);
}

const inrAxis = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

/**
 * For a chart Y-axis, where the same order of magnitude repeats on every
 * gridline. "₹1.2L" reads at a glance; "₹1,20,000.00" repeated six times does
 * not, and Recharts' own tick rounding otherwise produces near-duplicate
 * labels at values in this range.
 */
export function formatCurrencyAxis(paise: Paise): string {
  return inrAxis.format(paise / 100);
}

const counts = new Intl.NumberFormat("en-IN");

/**
 * A plain count - devices reached, jobs done, tickets open.
 *
 * Indian digit grouping, so 9240 reads 9,240 and 120000 reads 1,20,000 the
 * way every other number on the platform does.
 */
export function formatCount(value: number): string {
  return counts.format(value);
}

const dateOnly = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const monthYear = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

const dayShort = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeOnly = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Dates render as "04 Sep 2026" rather than a numeric format, because 04/09 and
 * 09/04 are the same string to different readers and this product has both.
 */
export function formatDate(
  value: Timestamp,
  style: "date" | "datetime" | "time" | "monthYear" = "date",
): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  if (style === "datetime") return dateTime.format(d);
  if (style === "time") return timeOnly.format(d);
  // "March 2025" — for a joining date, where the day is noise.
  if (style === "monthYear") return monthYear.format(d);
  return dateOnly.format(d);
}

/**
 * Relative day label for schedule columns, falling back to a real date beyond
 * the near window. "Tomorrow, 10:30 am" is more useful to an operator scanning
 * a queue than "05 Sep 2026, 10:30 am".
 */
/**
 * Just the clock time - "10:00 am".
 *
 * Slot grids and arrival windows show a time without a date, because the date
 * is already the heading above them. `formatSchedule` would repeat it on every
 * cell.
 */
export function formatTime(value: Timestamp | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return timeOnly.format(d);
}

/**
 * A day, without the year - "Tue, 9 Sep".
 *
 * For a booking within the next month, where the year is noise.
 */
export function formatDayShort(value: Timestamp | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dayShort.format(d);
}

export function formatSchedule(value: Timestamp): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round(
    (startOfDay(d) - startOfDay(new Date())) / 86_400_000,
  );

  const time = timeOnly.format(d);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  return dateTime.format(d);
}
