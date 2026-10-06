"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { Button, formatDate } from "@cfc/ui";
import { type GeoSelection, describeGeo } from "@/lib/geography";

/**
 * Print a filtered list.
 *
 * The client asked for a print option on every admin menu. Two decisions are
 * worth stating, because both were choices rather than defaults:
 *
 * ## 1. `window.print()`, not a PDF library
 *
 * An admin printing a pro list wants paper. A PDF library (jsPDF, react-pdf)
 * means a second layout to build and keep in step with the table, 100-400KB of
 * JavaScript, and a file the admin then has to open and print anyway. The
 * browser already paginates tables, repeats table headers across pages and
 * knows the paper size. `@media print` is a stylesheet, not a dependency.
 *
 * ## 2. The printed page states its filters
 *
 * A printed list with no header is a page of names nobody can place a week
 * later. Printing while filtered to Bengaluru → Indiranagar and getting an
 * untitled list is how a filtered extract gets mistaken for the whole file. So
 * `PrintHeader` is rendered print-only, carrying the title, the active
 * geography and the date.
 */

/**
 * The print button.
 *
 * Hidden when printing — a button is not useful on paper, and leaving it in
 * reserves a blank rectangle where it was.
 */
export function PrintButton({
  label = "Print",
  disabled = false,
}: {
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="print:hidden"
      disabled={disabled}
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

/**
 * The heading that appears only on the printed page.
 *
 * `hidden print:block` — absent on screen, present on paper. `rowCount` is the
 * number of rows actually printed, so a reader can tell a 40-row extract from a
 * 400-row file.
 */
export function PrintHeader({
  title,
  geo,
  rowCount,
  extra,
}: {
  title: string;
  geo?: GeoSelection | undefined;
  rowCount?: number | undefined;
  extra?: string | undefined;
}) {
  // Rendered on the server too, so the date has to be stable between the server
  // and the client or React warns about a hydration mismatch. It is computed on
  // the client only, after mount, which is also when it is accurate — the
  // moment of printing, not the moment the page was built.
  const [printedAt, setPrintedAt] = React.useState<string>("");
  React.useEffect(() => {
    // `formatDate`, not `toLocaleString`: one formatter everywhere, which the
    // lint rule enforces. A printed page with a different date format from the
    // screen it came from is the exact inconsistency that rule exists for.
    setPrintedAt(formatDate(new Date().toISOString(), "datetime"));
  }, []);

  return (
    <div className="hidden border-b border-border pb-3 print:block">
      <h1 className="text-title font-bold text-ink">CityFamilyCare — {title}</h1>
      <p className="mt-1 text-caption text-ink-muted">
        {geo ? `Location: ${describeGeo(geo)}` : null}
        {geo && (rowCount !== undefined || extra) ? " · " : null}
        {rowCount !== undefined
          ? `${rowCount} ${rowCount === 1 ? "record" : "records"}`
          : null}
        {extra ? ` · ${extra}` : null}
        {printedAt ? ` · Printed ${printedAt}` : null}
      </p>
    </div>
  );
}

/**
 * Wraps the part of a screen that should print.
 *
 * Everything outside it still prints unless told otherwise, so the shell's own
 * chrome carries `print:hidden` — see `app-shell.tsx`. This exists so a screen
 * can mark its table as the thing that matters and drop the tab strip and
 * filter row from the page.
 */
export function PrintArea({ children }: { children: React.ReactNode }) {
  return <div className="print:[&_*]:!overflow-visible">{children}</div>;
}
