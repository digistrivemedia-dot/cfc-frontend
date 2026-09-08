"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "../primitives/button";
import { Calendar } from "../primitives/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../primitives/popover";
import { formatDate } from "../lib/format";
import { cn } from "../lib/cn";

export type { DateRange };

/**
 * Date range filter.
 *
 * Presets first, calendar second. An operator filtering a booking queue wants
 * "last 7 days" far more often than a hand-picked span, and making them click
 * through two months to express it is the common failure of this control.
 *
 * The range is held in DRAFT while the popover is open and only committed on
 * Apply. Publishing every click meant that picking a start date immediately
 * filtered the list to a single day and showed "no bookings" — the operator was
 * looking at an empty result for a range they had not finished expressing.
 *
 * Both ends are snapped to local day boundaries. A range picked at 01:25 IST
 * whose `to` is the raw Date from the calendar is midnight local, which is the
 * PREVIOUS day in UTC once the query serialises it — so the label said one date
 * and the filter used another. `endOfDay` on the closing bound is what keeps the
 * two in agreement.
 */

/**
 * Shortcuts, in two directions.
 *
 * A filter looks BACK — "last 7 days" of transactions. A schedule looks
 * FORWARD — a banner that runs for the next fortnight. Offering "Last 30 days"
 * when someone is scheduling a Diwali banner is offering a range that has
 * already passed, so the caller says which way time runs here.
 */
const PAST_PRESETS = [
  { id: "today", label: "Today", days: 0 },
  { id: "7d", label: "Last 7 days", days: 6 },
  { id: "30d", label: "Last 30 days", days: 29 },
] as const;

const FUTURE_PRESETS = [
  { id: "today-f", label: "Today only", days: 0 },
  { id: "7d-f", label: "Next 7 days", days: 6 },
  { id: "30d-f", label: "Next 30 days", days: 29 },
] as const;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Snap whatever the calendar produced onto whole local days. */
function normalise(range: DateRange | undefined): DateRange | undefined {
  if (!range?.from) return undefined;
  return {
    from: startOfDay(range.from),
    // A single-day pick has no `to` yet; treat it as that day, not as an open
    // end that silently matches nothing.
    to: endOfDay(range.to ?? range.from),
  };
}

function labelFor(
  range: DateRange | undefined,
  placeholder: string,
): string {
  if (!range?.from) return placeholder;
  const from = formatDate(range.from.toISOString());
  if (!range.to) return from;
  const to = formatDate(range.to.toISOString());
  return from === to ? from : `${from} – ${to}`;
}

export function DateRangePicker({
  value,
  onChange,
  direction = "past",
  placeholder = "Any date",
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  /**
   * Which way the shortcuts run. `past` for filtering records that exist,
   * `future` for scheduling something that has not happened yet.
   */
  direction?: "past" | "future";
  /** Trigger label when nothing is chosen. */
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);

  // Opening should always start from what is actually applied, not from a
  // draft abandoned last time.
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const presets = direction === "future" ? FUTURE_PRESETS : PAST_PRESETS;

  const applyPreset = (days: number) => {
    const now = Date.now();
    const range =
      direction === "future"
        ? {
            from: startOfDay(new Date(now)),
            to: endOfDay(new Date(now + days * 86_400_000)),
          }
        : {
            from: startOfDay(new Date(now - days * 86_400_000)),
            to: endOfDay(new Date(now)),
          };
    onChange(range);
    setOpen(false);
  };

  const commit = () => {
    onChange(normalise(draft));
    setOpen(false);
  };

  const complete = draft?.from !== undefined;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className={cn(value?.from && "border-action text-action")}
          >
            <CalendarDays />
            <span className="tabular">{labelFor(value, placeholder)}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          {/* Stacked, not in a row. The calendar grid is 7 columns of 32px
              plus padding, which leaves each of three side-by-side presets
              about 80px — narrower than "Last 30 days", so the label clipped.
              A short vertical list has room for every label and reads as the
              shortcut it is. */}
          <div className="flex flex-col border-b border-border p-2">
            {presets.map((p) => (
              <Button
                key={p.id}
                variant="ghost"
                size="sm"
                onClick={() => applyPreset(p.days)}
                className="justify-start"
              >
                {p.label}
              </Button>
            ))}
          </div>

          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={1}
            // Spread rather than pass `undefined`: react-day-picker's
            // `defaultMonth` does not accept it, and with no range chosen the
            // calendar should simply open on the current month.
            {...(draft?.from ? { defaultMonth: draft.from } : {})}
          />

          <div className="space-y-2 border-t border-border p-2">
            <p className="tabular px-1 text-caption text-ink-muted">
              {complete ? labelFor(normalise(draft), placeholder) : "Pick a start date"}
            </p>
            <span className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(undefined);
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={commit}
                disabled={!complete}
              >
                Apply
              </Button>
            </span>
          </div>
        </PopoverContent>
      </Popover>

      {value?.from && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(undefined)}
          aria-label="Clear date filter"
        >
          <X />
        </Button>
      )}
    </div>
  );
}
