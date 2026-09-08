import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Table primitives.
 *
 * Admin density: 11–13px row padding, `small` type, condensed width axis on
 * numeric columns. Header sits on the canvas rather than on navy — a navy
 * header on every table makes the whole panel feel heavier than it is, and navy
 * is structure, not emphasis.
 *
 * These are the raw elements. `DataTable` composes them and owns sorting,
 * selection, states, and the card collapse.
 */

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full caption-bottom border-collapse text-small", className)}
    {...props}
  />
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    /**
     * Pins the header while the body scrolls. Requires an ancestor with a
     * bounded height and `overflow-y: auto`; without one this is inert rather
     * than broken.
     */
    sticky?: boolean;
  }
>(({ className, sticky = false, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-canvas",
      sticky && "sticky top-0 z-sticky",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn(className)} {...props} />
));
TableBody.displayName = "TableBody";

/** Totals row. Sits below the body, above any pagination. */
export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-canvas font-medium text-ink",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border-soft transition-colors duration-fast last:border-0",
      "hover:bg-canvas",
      "data-[selected=true]:bg-action-subtle",
      "data-[selected=true]:border-action-line",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "border-b border-border px-3 py-2 text-left align-middle",
      "text-caption font-semibold uppercase tracking-wide text-ink-faint",
      "whitespace-nowrap",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-3 py-3 align-middle text-ink", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

/**
 * Table caption. Visually hidden by default — it exists so a screen reader can
 * announce what the table contains before reading rows, which a visible heading
 * elsewhere on the page does not guarantee.
 */
export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("sr-only", className)} {...props} />
));
TableCaption.displayName = "TableCaption";
