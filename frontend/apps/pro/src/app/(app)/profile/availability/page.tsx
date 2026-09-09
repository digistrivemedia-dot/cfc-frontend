"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Info, Plane, TriangleAlert } from "lucide-react";
import { getProAvailability, saveProAvailability } from "@cfc/mocks";
import {
  WEEKDAYS,
  WEEKDAY_LABEL,
  WEEKDAY_SHORT,
  type DayAvailability,
  type ProAvailability,
  type Weekday,
} from "@cfc/types";
import {
  Button,
  ErrorState,
  Skeleton,
  Switch,
  cn,
  toast,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 29 — availability.
 *
 * "Weekly grid, off-day blocking, holiday mode."
 *
 * The one screen in this app that is genuinely better on a desktop, and the
 * layout says so rather than pretending otherwise:
 *
 *   Mobile  — seven stacked rows, each a day with a switch and two time inputs.
 *             Scrollable, thumb-reachable, one thing at a time.
 *   Desktop — the same seven days as a row of columns, so a pro can see the
 *             shape of their week at once. That is the whole point of a "weekly
 *             grid": comparing Tuesday to Saturday without scrolling.
 *
 * ## Holiday mode is not "all seven days off"
 *
 * They are different states and conflating them would cost a pro their
 * schedule. A pro away for a week who cleared all seven days would have to
 * rebuild the week from memory on return. Holiday mode suspends the schedule
 * without destroying it — the week is still there underneath, greyed out, and
 * comes back untouched.
 *
 * ## "Copy to all days" exists because the alternative is fourteen inputs
 *
 * Most pros work the same hours every working day. Setting that once and
 * copying it is the difference between a screen a pro keeps accurate and one
 * they abandon after the first week.
 */

export default function ProAvailabilityPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [state, setState] = React.useState<ProAvailability | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void getProAvailability(proId)
      .then((a) => {
        if (!cancelled) {
          setState(a);
          setDirty(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  const update = (next: ProAvailability) => {
    setState(next);
    setDirty(true);
  };

  const setDay = (day: Weekday, patch: Partial<DayAvailability>) => {
    if (state === null) return;
    update({
      ...state,
      days: state.days.map((d) => (d.day === day ? { ...d, ...patch } : d)),
    });
  };

  /** Apply the first working day's hours to every other working day. */
  const copyToAll = () => {
    if (state === null) return;
    const source = state.days.find((d) => d.working);
    if (source === undefined) {
      toast.error("Switch on at least one day first.");
      return;
    }
    update({
      ...state,
      days: state.days.map((d) =>
        d.working ? { ...d, from: source.from, to: source.to } : d,
      ),
    });
    toast.success(
      `All working days set to ${formatTime(source.from)} – ${formatTime(source.to)}.`,
    );
  };

  const save = async () => {
    if (state === null) return;
    setSaving(true);
    try {
      await saveProAvailability(proId, state);
      setDirty(false);
      toast.success("Availability saved.");
    } catch {
      toast.error("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your availability"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  if (state === null) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 lg:px-8">
        <Skeleton className="h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      </div>
    );
  }

  const workingDays = state.days.filter((d) => d.working).length;
  const invalid = state.days.some((d) => d.working && d.from >= d.to);

  return (
    <ProActionLayout
      action={
        <ProAction>
          <div className="border-b border-border pb-3">
            <p className="text-small font-medium text-ink">
              {state.holidayMode
                ? "On holiday"
                : workingDays === 0
                  ? "No working days set"
                  : `${workingDays} working day${workingDays === 1 ? "" : "s"} a week`}
            </p>
            <p className="mt-px text-caption text-ink-muted">
              {state.holidayMode
                ? "You will not receive job alerts until holiday mode is off."
                : workingDays === 0
                  ? "You will not be sent any jobs."
                  : "Jobs are only offered inside these hours."}
            </p>
          </div>

          {invalid && (
            <p className="mt-3 flex items-start gap-2 text-caption text-critical-ink">
              <TriangleAlert
                className="mt-px size-4 shrink-0"
                aria-hidden="true"
              />
              A day’s finish time must be after its start time.
            </p>
          )}

          <Button
            size="pro"
            className="mt-3 w-full"
            disabled={saving || invalid || !dirty}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : dirty ? "Save availability" : "Saved"}
          </Button>

          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={copyToAll}
          >
            <Copy />
            Copy hours to all days
          </Button>
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Profile
        </Link>

        <h1 className="mt-3 text-title font-semibold text-ink">Availability</h1>
        <p className="mt-1 text-small text-ink-muted">
          The hours you are willing to take jobs. You still have to be online to
          receive an alert — this is when the platform will bother trying.
        </p>

        {/* Holiday mode, above the week, because it overrides it. */}
        <HolidayCard
          on={state.holidayMode}
          onChange={(on) =>
            update({ ...state, holidayMode: on, holidayUntil: null })
          }
        />

        {/* The week. Rows on mobile, columns at lg. */}
        <section
          className={cn(
            "mt-4 overflow-hidden rounded-card border border-border bg-surface",
            state.holidayMode && "opacity-60",
          )}
        >
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            Your week
          </h2>

          {/* Mobile and tablet: one row per day. */}
          <ul className="divide-y divide-border-soft lg:hidden">
            {WEEKDAYS.map((day) => {
              const entry = state.days.find((d) => d.day === day);
              if (entry === undefined) return null;
              return (
                <li key={day} className="p-4">
                  <DayRow
                    entry={entry}
                    disabled={state.holidayMode}
                    onChange={(patch) => setDay(day, patch)}
                  />
                </li>
              );
            })}
          </ul>

          {/* Desktop: the actual grid. Seven columns, so the whole week is
              legible at a glance — which is the only reason to call this a
              "weekly grid" rather than a list. */}
          <div className="hidden overflow-x-auto lg:block">
            <div className="grid grid-cols-7 divide-x divide-border-soft">
              {WEEKDAYS.map((day) => {
                const entry = state.days.find((d) => d.day === day);
                if (entry === undefined) return null;
                return (
                  <DayColumn
                    key={day}
                    entry={entry}
                    disabled={state.holidayMode}
                    onChange={(patch) => setDay(day, patch)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <p className="mt-4 flex items-start gap-2 rounded-card border border-border bg-canvas p-3 text-caption text-ink-muted">
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          A job already accepted stays yours even if it runs past your finish
          time. These hours decide what you are offered, not when you stop.
        </p>
      </div>
    </ProActionLayout>
  );
}

// -- Holiday mode ------------------------------------------------------------

function HolidayCard({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <section
      className={cn(
        "mt-4 rounded-card border p-4",
        on ? "border-clock-line bg-clock-subtle" : "border-border bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "flex size-tile shrink-0 items-center justify-center rounded-control",
              on ? "bg-clock text-on-action" : "bg-canvas text-ink-muted",
            )}
          >
            <Plane className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-small font-semibold",
                on ? "text-clock-ink" : "text-ink",
              )}
            >
              Holiday mode
            </p>
            <p
              className={cn(
                "mt-px text-caption",
                on ? "text-clock-ink" : "text-ink-muted",
              )}
            >
              {on
                ? "You are not being sent jobs. Your week below is kept exactly as it is."
                : "Pause all job alerts without clearing your week. Switch it off when you are back."}
            </p>
          </div>
        </div>

        <Switch
          checked={on}
          onCheckedChange={onChange}
          aria-label="Holiday mode"
        />
      </div>
    </section>
  );
}

// -- One day, two layouts ----------------------------------------------------

function DayRow({
  entry,
  disabled,
  onChange,
}: {
  entry: DayAvailability;
  disabled: boolean;
  onChange: (patch: Partial<DayAvailability>) => void;
}) {
  const bad = entry.working && entry.from >= entry.to;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span
          className={cn(
            "text-small font-medium",
            entry.working ? "text-ink" : "text-ink-muted",
          )}
        >
          {WEEKDAY_LABEL[entry.day]}
        </span>
        <Switch
          checked={entry.working}
          disabled={disabled}
          onCheckedChange={(working) => onChange({ working })}
          aria-label={`Work on ${WEEKDAY_LABEL[entry.day]}`}
        />
      </div>

      {entry.working ? (
        <div className="mt-3 flex items-center gap-2">
          <TimeInput
            label={`${WEEKDAY_LABEL[entry.day]} start`}
            value={entry.from}
            disabled={disabled}
            invalid={bad}
            onChange={(from) => onChange({ from })}
          />
          <span className="text-small text-ink-muted">to</span>
          <TimeInput
            label={`${WEEKDAY_LABEL[entry.day]} finish`}
            value={entry.to}
            disabled={disabled}
            invalid={bad}
            onChange={(to) => onChange({ to })}
          />
        </div>
      ) : (
        <p className="mt-2 text-caption text-ink-muted">Day off</p>
      )}

      {bad && (
        <p className="mt-2 text-caption text-critical-ink">
          Finish time must be after the start time.
        </p>
      )}
    </>
  );
}

function DayColumn({
  entry,
  disabled,
  onChange,
}: {
  entry: DayAvailability;
  disabled: boolean;
  onChange: (patch: Partial<DayAvailability>) => void;
}) {
  const bad = entry.working && entry.from >= entry.to;

  return (
    <div
      className={cn(
        "min-w-0 p-3 text-center",
        !entry.working && "bg-canvas",
      )}
    >
      <p
        className={cn(
          "text-caption font-semibold",
          entry.working ? "text-ink" : "text-ink-muted",
        )}
      >
        {WEEKDAY_SHORT[entry.day]}
      </p>

      <div className="mt-2 flex justify-center">
        <Switch
          checked={entry.working}
          disabled={disabled}
          onCheckedChange={(working) => onChange({ working })}
          aria-label={`Work on ${WEEKDAY_LABEL[entry.day]}`}
        />
      </div>

      {entry.working ? (
        <div className="mt-3 space-y-1">
          <TimeInput
            label={`${WEEKDAY_LABEL[entry.day]} start`}
            value={entry.from}
            disabled={disabled}
            invalid={bad}
            onChange={(from) => onChange({ from })}
            compact
          />
          <TimeInput
            label={`${WEEKDAY_LABEL[entry.day]} finish`}
            value={entry.to}
            disabled={disabled}
            invalid={bad}
            onChange={(to) => onChange({ to })}
            compact
          />
        </div>
      ) : (
        <p className="mt-3 text-caption text-ink-faint">Off</p>
      )}
    </div>
  );
}

/**
 * A time, using the browser's own picker.
 *
 * `type="time"` rather than a custom control: the native picker is
 * keyboard-accessible, localised, and on a phone gives a proper wheel or clock
 * that no hand-rolled dropdown will match. `step={1800}` snaps to half hours,
 * which is the granularity a working day is actually planned in — offering
 * 09:07 would be precision nobody wants.
 */
function TimeInput({
  label,
  value,
  disabled,
  invalid,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (next: string) => void;
  compact?: boolean;
}) {
  return (
    <input
      type="time"
      step={1800}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-control border bg-surface tabular text-ink",
        "focus:border-action focus:outline-none focus:ring-2 focus:ring-focus",
        "disabled:bg-disabled disabled:text-disabled-ink",
        invalid ? "border-critical" : "border-border",
        compact
          ? "h-8 w-full min-w-0 px-1 text-center text-caption"
          : "h-touch min-w-0 flex-1 px-3 text-small",
      )}
    />
  );
}

/** "09:00" as "9:00 am", for a toast rather than an input. */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === undefined || m === undefined) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
