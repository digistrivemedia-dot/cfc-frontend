"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, TriangleAlert } from "lucide-react";
import { cn } from "../lib/cn";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../primitives/table";
import { Checkbox } from "../primitives/checkbox";
import { Skeleton } from "../primitives/skeleton";
import { Button } from "../primitives/button";
import { EmptyState, ErrorState } from "./states";

/**
 * The data table.
 *
 * Roughly thirty of the forty-nine admin screens are a filterable, sortable,
 * paginated list. They all use this. A screen supplies columns and rows; it does
 * not build a table.
 *
 * Below the `cardBreakpoint` container width the same rows render as cards.
 * That collapse is CONTAINER-query driven, not viewport, so the pattern also
 * works inside a drawer or a split pane — a table in a 400px drawer on a 1440px
 * monitor still needs to be cards.
 */

export interface Column<T> {
  /** Stable key, also used as the sort field when `sortable`. */
  id: string;
  header: string;
  /** Full-width table cell. */
  cell: (row: T) => React.ReactNode;
  sortable?: boolean | undefined;
  /** Right-align numeric columns. */
  align?: "left" | "right" | undefined;
  /**
   * Lining figures for a column of numbers. Sets `tabular-nums` on the cell so
   * every screen does not have to remember to wrap its own value in a span.
   */
  tabular?: boolean | undefined;
  /** Hidden below this container width, in px. Undefined = always shown. */
  hideBelow?: number | undefined;
  /** Column width hint for the loading skeleton. */
  skeletonWidth?: string | undefined;
  className?: string | undefined;
}

export interface CardLayout<T> {
  /** Top-left of the card — usually the identifier. */
  title: (row: T) => React.ReactNode;
  /** Top-right — usually status. */
  badge?: ((row: T) => React.ReactNode) | undefined;
  /** Secondary lines. */
  lines: ((row: T) => React.ReactNode)[];
  /** Bottom-right — usually the amount. */
  trailing?: ((row: T) => React.ReactNode) | undefined;
}

export type SortDir = "asc" | "desc";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Card rendering below the collapse width. Required — every table collapses. */
  card: CardLayout<T>;
  /**
   * Announced to screen readers before the rows, e.g. "Pros, 12 rows". A
   * visible page heading does not reach a reader who jumps straight to the
   * table.
   */
  caption?: string | undefined;
  loading?: boolean | undefined;
  /**
   * Renders an error state with a retry in place of the rows. A failed fetch
   * used to have to be handled entirely outside the table, which meant every
   * screen re-implemented the same block.
   */
  error?: string | null | undefined;
  onRetry?: (() => void) | undefined;
  /** Shown when `rows` is empty and not loading. Has a sensible default. */
  empty?: React.ReactNode | undefined;
  sortBy?: string | undefined;
  sortDir?: SortDir | undefined;
  /**
   * Called with `null` when the column cycles back to unsorted. Sorting is a
   * three-state cycle — descending, ascending, off — because a list that can
   * never return to its natural order strands the operator in a view they did
   * not choose.
   */
  onSort?: ((id: string | null, dir: SortDir) => void) | undefined;
  onRowClick?: ((row: T) => void) | undefined;

  // Selection ---------------------------------------------------------------
  /**
   * Row keys currently selected. Supplying this turns on the checkbox column;
   * omitting it leaves the table exactly as it was.
   */
  selectedIds?: readonly string[] | undefined;
  onSelectionChange?: ((ids: string[]) => void) | undefined;
  /**
   * Rendered above the header while the selection is non-empty. Receives the
   * selected keys and a clear callback so the bar can offer "Clear".
   */
  bulkBar?:
    | ((args: { selectedIds: string[]; clear: () => void }) => React.ReactNode)
    | undefined;
  /** Noun for the selection count, e.g. "pro" → "2 pros selected". */
  selectionNoun?: string | undefined;

  /** Container width below which rows become cards. */
  cardBreakpoint?: number | undefined;
  skeletonRows?: number | undefined;
  /**
   * Pins the header while the body scrolls. The table must sit inside a
   * bounded, scrollable ancestor for this to do anything.
   */
  stickyHeader?: boolean | undefined;
  className?: string | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  card,
  caption,
  loading = false,
  error,
  onRetry,
  empty,
  sortBy,
  sortDir = "desc",
  onSort,
  onRowClick,
  selectedIds,
  onSelectionChange,
  bulkBar,
  selectionNoun = "row",
  cardBreakpoint = 640,
  skeletonRows = 8,
  stickyHeader = false,
  className,
}: DataTableProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | null>(null);

  // Container query in JS rather than CSS, because which COLUMNS are dropped at
  // which width is data the component needs, not just a style.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render as table until measured, so server output matches the desktop case
  // and there is no flash of cards on a wide screen.
  const asCards = width !== null && width < cardBreakpoint;
  const visible = columns.filter(
    (c) => !c.hideBelow || width === null || width >= c.hideBelow,
  );

  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const selected = React.useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds],
  );

  const allKeys = React.useMemo(() => rows.map(rowKey), [rows, rowKey]);
  const selectedHere = allKeys.filter((k) => selected.has(k));
  const allSelected = allKeys.length > 0 && selectedHere.length === allKeys.length;
  const someSelected = selectedHere.length > 0 && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    // Only the visible page is affected — selecting "all" on page 1 must not
    // silently claim rows the operator has never seen.
    onSelectionChange(allSelected ? [] : allKeys);
  };

  const toggleOne = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange([...next]);
  };

  const clearSelection = React.useCallback(
    () => onSelectionChange?.([]),
    [onSelectionChange],
  );

  /**
   * Descending → ascending → unsorted. A new column enters at descending
   * because the useful first question of a list is almost always "which is the
   * largest / most recent".
   */
  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    if (sortBy !== col.id) {
      onSort(col.id, "desc");
    } else if (sortDir === "desc") {
      onSort(col.id, "asc");
    } else {
      onSort(null, "desc");
    }
  };

  const body = (() => {
    if (error) {
      return (
        <ErrorState
          icon={<TriangleAlert />}
          title="This list could not load"
          description={error}
          {...(onRetry ? { action: { label: "Try again", onClick: onRetry } } : {})}
        />
      );
    }

    if (loading) {
      return asCards ? (
        <CardSkeletons count={skeletonRows} />
      ) : (
        <TableSkeletons
          columns={visible}
          count={skeletonRows}
          selectable={selectable}
          sticky={stickyHeader}
        />
      );
    }

    if (rows.length === 0) {
      return (
        empty ?? (
          <EmptyState
            title="Nothing here yet"
            description="Records will appear here as they are created."
          />
        )
      );
    }

    if (asCards) {
      return (
        <ul className="divide-y divide-border-soft">
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <li key={key}>
                <RowCard
                  row={row}
                  card={card}
                  selected={selected.has(key)}
                  {...(selectable ? { onToggle: () => toggleOne(key) } : {})}
                  {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
                />
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader sticky={stickyHeader}>
          <TableRow className="hover:bg-canvas">
            {selectable && (
              <TableHead className="w-8">
                <Checkbox
                  className="size-4"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label={
                    allSelected
                      ? `Deselect all ${selectionNoun}s on this page`
                      : `Select all ${selectionNoun}s on this page`
                  }
                />
              </TableHead>
            )}
            {visible.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  col.align === "right" && "text-right",
                  col.className,
                )}
                aria-sort={
                  sortBy === col.id
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill",
                      "transition-colors duration-fast hover:text-ink",
                      col.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {col.header}
                    <SortIcon active={sortBy === col.id} dir={sortDir} />
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const key = rowKey(row);
            const isSelected = selected.has(key);
            return (
              <TableRow
                key={key}
                data-selected={isSelected || undefined}
                // A clickable row must be reachable without a mouse. This used
                // to be a bare `onClick` on the `<tr>`, which meant the same
                // record was openable by keyboard in card mode and not openable
                // at all in table mode.
                {...(onRowClick
                  ? {
                      role: "button",
                      tabIndex: 0,
                      onClick: () => onRowClick(row),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        // Let a nested control handle its own key press.
                        if (e.target !== e.currentTarget) return;
                        e.preventDefault();
                        onRowClick(row);
                      },
                      className: "cursor-pointer",
                    }
                  : {})}
              >
                {selectable && (
                  <TableCell
                    // A checkbox inside a clickable row must not also open the
                    // row.
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      className="size-4"
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(key)}
                      aria-label={`Select this ${selectionNoun}`}
                    />
                  </TableCell>
                )}
                {visible.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.tabular && "tabular",
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  })();

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      {selectable && selectedHere.length > 0 && bulkBar && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-b border-action-line",
            "bg-action-subtle px-3 py-2 text-small text-action-press",
          )}
          role="region"
          aria-label="Bulk actions"
        >
          <span className="tabular font-semibold">
            {selectedHere.length} {selectionNoun}
            {selectedHere.length === 1 ? "" : "s"} selected
          </span>
          {bulkBar({ selectedIds: selectedHere, clear: clearSelection })}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}
      {body}
      {/* Row count changes silently for a screen reader otherwise — a filter
          that removes every row currently announces nothing at all. */}
      <span className="sr-only" aria-live="polite">
        {loading
          ? "Loading"
          : error
            ? "Could not load"
            : `${rows.length} ${selectionNoun}${rows.length === 1 ? "" : "s"} shown`}
      </span>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <ChevronsUpDown className="size-4 text-ink-faint" aria-hidden="true" />;
  return dir === "asc" ? (
    <ArrowUp className="size-4 text-action" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-4 text-action" aria-hidden="true" />
  );
}

function RowCard<T>({
  row,
  card,
  selected,
  onToggle,
  onClick,
}: {
  row: T;
  card: CardLayout<T>;
  selected: boolean;
  onToggle?: (() => void) | undefined;
  onClick?: (() => void) | undefined;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-body font-medium text-ink">{card.title(row)}</span>
        {card.badge?.(row)}
      </div>
      <div className="mt-1 space-y-px">
        {card.lines.map((line, i) => (
          <p key={i} className="text-small text-ink-muted">
            {line(row)}
          </p>
        ))}
      </div>
      {card.trailing && (
        <div className="mt-2 text-body font-medium text-ink">
          {card.trailing(row)}
        </div>
      )}
    </>
  );

  const inner = onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 flex-1 p-4 text-left transition-colors duration-fast hover:bg-canvas"
    >
      {content}
    </button>
  ) : (
    <div className="min-w-0 flex-1 p-4">{content}</div>
  );

  if (!onToggle) return inner;

  return (
    <div className={cn("flex items-start", selected && "bg-action-subtle")}>
      <span className="p-4 pr-0">
        <Checkbox
          className="size-4"
          checked={selected}
          onCheckedChange={onToggle}
          aria-label="Select this row"
        />
      </span>
      {inner}
    </div>
  );
}

function TableSkeletons<T>({
  columns,
  count,
  selectable,
  sticky,
}: {
  columns: Column<T>[];
  count: number;
  selectable: boolean;
  sticky: boolean;
}) {
  return (
    <Table>
      <TableHeader sticky={sticky}>
        <TableRow className="hover:bg-canvas">
          {selectable && <TableHead className="w-8" />}
          {columns.map((col) => (
            <TableHead
              key={col.id}
              className={cn(col.align === "right" && "text-right")}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: count }, (_, i) => (
          <TableRow key={i} className="hover:bg-surface">
            {selectable && (
              <TableCell>
                <Skeleton className="size-4 rounded-control" />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell key={col.id}>
                <Skeleton
                  className={cn(
                    "h-4",
                    col.skeletonWidth ?? "w-line-sm",
                    col.align === "right" && "ml-auto",
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <ul className="divide-y divide-border-soft">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-line-md" />
            <Skeleton className="h-4 w-line-xs" />
          </div>
          <Skeleton className="h-3 w-line-lg" />
          <Skeleton className="h-3 w-line-md" />
        </li>
      ))}
    </ul>
  );
}
