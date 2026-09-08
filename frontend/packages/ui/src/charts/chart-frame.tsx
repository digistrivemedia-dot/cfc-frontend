"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../primitives/table";

/**
 * The accessible wrapper every chart sits inside.
 *
 * A Recharts SVG is a pile of unlabelled paths. To a screen reader it is
 * nothing at all — not a summary, not a value, not even a hint that a chart
 * exists — so a page of five charts reads as a page of five blank regions.
 *
 * Two things fix that, and both are cheap:
 *
 *   The drawing is marked `role="img"` with a one-line summary, so someone
 *   scanning the page is told what it shows and roughly what it says.
 *
 *   The same numbers are rendered as a real table, visually hidden. A reader
 *   who wants the actual figures can walk it row by row, which is more useful
 *   than any summary sentence, and it costs a sighted user nothing.
 *
 * The table is not `aria-hidden` and the SVG is not focusable: exactly one
 * representation is announced, and it is the one carrying the data.
 */
export function ChartFrame<T extends object>({
  /** One line: what the chart shows, and the headline it supports. */
  summary,
  data,
  xKey,
  /** Column key and heading for each series, in the order drawn. */
  columns,
  formatValue,
  children,
}: {
  summary: string;
  data: readonly T[];
  xKey: keyof T & string;
  columns: readonly { key: keyof T & string; label: string }[];
  formatValue?: ((v: number) => string) | undefined;
  children: React.ReactNode;
}) {
  const format = React.useCallback(
    (v: unknown) => {
      if (typeof v === "number") return formatValue ? formatValue(v) : String(v);
      return String(v ?? "—");
    },
    [formatValue],
  );

  return (
    <figure className="m-0">
      <div role="img" aria-label={summary}>
        {children}
      </div>

      {/* The same data, for anyone the drawing does not reach. */}
      <div className="sr-only">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{String(xKey)}</TableHead>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell>{String(row[xKey] ?? "")}</TableCell>
                {columns.map((c) => (
                  <TableCell key={c.key}>{format(row[c.key])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </figure>
  );
}
