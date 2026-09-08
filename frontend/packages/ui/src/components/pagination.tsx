"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../primitives/button";
import { cn } from "../lib/cn";

const PAGE_SIZES = [20, 50, 100] as const;

/**
 * Pagination.
 *
 * Shows the range rather than only page numbers — "21–40 of 60" answers the
 * question an operator actually has, which is how much is left.
 *
 * The page size is adjustable because 20 rows is right for reviewing and wrong
 * for reconciling; an operator checking a month of settlements against a bank
 * statement should not paginate forty times. First/last jumps exist for the
 * same reason.
 *
 * The range is announced politely, so a keyboard user who pages forward is told
 * where they landed instead of hearing nothing at all.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Omit to render a fixed page size with no selector. */
  onPageSizeChange?: ((size: number) => void) | undefined;
  className?: string | undefined;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const rangeLabel = `${first}–${last} of ${total}`;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-small text-ink-muted">
          <span className="tabular">
            {first}–{last}
          </span>{" "}
          of <span className="tabular">{total}</span>
        </p>

        {onPageSizeChange && total > PAGE_SIZES[0] && (
          <label className="flex items-center gap-2 text-small text-ink-muted">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                // Changing the size mid-list would otherwise strand the
                // operator past the new last page.
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label="Rows per page"
              className={cn(
                "tabular h-8 rounded-control border border-border-strong bg-surface",
                "px-2 text-small text-ink transition-colors duration-fast",
              )}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
          <span className="sr-only sm:not-sr-only">Previous</span>
        </Button>
        <span className="tabular px-2 text-small text-ink-muted">
          {page} / {pageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          aria-label="Last page"
        >
          <ChevronsRight />
        </Button>
      </div>

      <span className="sr-only" aria-live="polite">
        Showing {rangeLabel}
      </span>
    </nav>
  );
}
