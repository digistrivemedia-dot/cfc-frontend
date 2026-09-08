"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Detail screen layout.
 *
 * Roughly a dozen admin screens are "one record, full information, some
 * actions" — booking detail, pro detail, customer detail, quotation detail. All
 * of them are a two-column split on desktop (main content, a narrow rail for
 * status/actions/metadata) collapsing to a single column on mobile, so this is
 * built once rather than seven times.
 */
export function DetailShell({
  main,
  rail,
  /** Keeps the rail in view while the main column scrolls past it. */
  stickyRail = false,
  className,
}: {
  main: React.ReactNode;
  rail?: React.ReactNode | undefined;
  stickyRail?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1fr_320px]", className)}>
      <div className="min-w-0 space-y-4">{main}</div>
      {rail && (
        <div
          className={cn(
            "space-y-4",
            stickyRail && "lg:sticky lg:top-4 lg:self-start",
          )}
        >
          {rail}
        </div>
      )}
    </div>
  );
}

/** A titled card, the base unit of a detail screen's main column and rail. */
export function DetailCard({
  title,
  action,
  children,
  /**
   * Turn off the inner padding when the card holds something that should reach
   * its edges — a table, an image grid, a timeline with its own rhythm.
   */
  padded = true,
  /** Renders the body inside a disclosure. Long secondary sections only. */
  collapsible = false,
  defaultOpen = true,
  className,
}: {
  title?: string | undefined;
  action?: React.ReactNode | undefined;
  children: React.ReactNode;
  padded?: boolean | undefined;
  collapsible?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = React.useId();
  const showBody = !collapsible || open;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        className,
      )}
    >
      {(title ?? action) && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 pt-4",
            showBody ? "pb-3" : "pb-4",
          )}
        >
          {title &&
            (collapsible ? (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={bodyId}
                className="flex items-center gap-2 rounded-pill text-heading font-semibold text-ink"
              >
                {title}
                <ChevronDown
                  className={cn(
                    "size-4 text-ink-faint transition-transform duration-fast",
                    !open && "-rotate-90",
                  )}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <h2 className="text-heading font-semibold text-ink">{title}</h2>
            ))}
          {action}
        </div>
      )}

      {showBody && (
        <div id={bodyId} className={cn(padded && "px-4 pb-4", !title && padded && "pt-4")}>
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Info list. A real description list — the label/value pairs on a detail screen
 * are exactly what `<dl>` is for, and a screen reader announces them as pairs
 * rather than as a stream of unrelated text.
 */
export function DetailList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return <dl className={cn("divide-y divide-border-soft", className)}>{children}</dl>;
}

/** Label/value pair, the row unit inside a DetailList. */
export function DetailRow({
  label,
  value,
  tabular,
  /** Stacks label above value. Use for anything longer than a few words. */
  stacked = false,
}: {
  label: string;
  value: React.ReactNode;
  tabular?: boolean | undefined;
  stacked?: boolean | undefined;
}) {
  return (
    <div
      className={cn(
        "py-2 text-small first:pt-0 last:pb-0",
        stacked ? "space-y-px" : "flex items-baseline justify-between gap-3",
      )}
    >
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "m-0 min-w-0 text-ink",
          tabular && "tabular",
          !stacked && "text-right",
          // A long value must wrap rather than overflow its card.
          "break-words",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Event history — a booking's status changes, a pro's warnings, an audit trail.
 *
 * The rail is drawn with a border on the list rather than per item, so it
 * connects continuously and stops cleanly at the last entry.
 */
export function Timeline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <ol className={cn("relative space-y-0", className)}>{children}</ol>
  );
}

export function TimelineItem({
  title,
  time,
  children,
  /**
   * `done` fills the marker, `current` rings it, `pending` leaves it hollow.
   * Colour is spent only on `current`, which is the one an operator is
   * looking for.
   */
  state = "done",
  last = false,
}: {
  title: React.ReactNode;
  time?: React.ReactNode | undefined;
  children?: React.ReactNode;
  state?: "done" | "current" | "pending" | undefined;
  last?: boolean | undefined;
}) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1 size-2 shrink-0 rounded-full border-2",
            state === "done" && "border-ink-faint bg-ink-faint",
            state === "current" && "border-live bg-live",
            state === "pending" && "border-border-strong bg-surface",
          )}
          aria-hidden="true"
        />
        {!last && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p
            className={cn(
              "text-small",
              state === "pending" ? "text-ink-faint" : "font-medium text-ink",
            )}
          >
            {title}
          </p>
          {time && (
            <span className="tabular text-caption text-ink-faint">{time}</span>
          )}
        </div>
        {children && (
          <div className="mt-px text-caption text-ink-muted">{children}</div>
        )}
      </div>
    </li>
  );
}
