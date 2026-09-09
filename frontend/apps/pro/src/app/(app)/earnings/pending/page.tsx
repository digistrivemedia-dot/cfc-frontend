"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import {
  PAYOUT_WINDOW_HOURS,
  getPendingSettlements,
  type PendingSettlement,
} from "@cfc/mocks";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  formatCurrency,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 25 — pending payments.
 *
 * "Jobs completed but payment pending. Status tracking."
 *
 * The screen exists to answer one question and it should answer it in the first
 * line: **do I wait, or do I raise a ticket?** A pro who has finished five jobs
 * and been paid for two needs to know whether that is the system working
 * normally or something going wrong.
 *
 * So every row carries a clock rather than a status word. "Pending" tells a pro
 * nothing; "clears in 9 hours" tells them to wait, and "overdue by 3 hours"
 * tells them to call. The 48-hour window from the agreement is what makes the
 * difference computable at all.
 *
 * ## Overdue is treated as a real state
 *
 * A settlement past 48 hours is not a rounding error — it is the platform
 * failing its own stated commitment, and the pro is owed money. It is coloured
 * `critical`, sorted to the top, and given the support route directly. Burying
 * it in a list ordered by date would hide exactly the row that needs acting on.
 */

export default function ProPendingPage() {
  const proId = React.useMemo(() => currentProId(), []);
  const [rows, setRows] = React.useState<PendingSettlement[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setRows(null);
    let cancelled = false;
    void getPendingSettlements(proId)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  // Overdue first, then whatever clears soonest. A pro scanning this list is
  // looking for a problem, so the problems go at the top.
  const sorted = React.useMemo(
    () =>
      rows === null
        ? null
        : [...rows].sort((a, b) => a.hoursRemaining - b.hoursRemaining),
    [rows],
  );

  const total = (sorted ?? []).reduce((t, r) => t + r.earning.netPaise, 0);
  const overdue = (sorted ?? []).filter((r) => r.hoursRemaining < 0);

  return (
    <div className="mx-auto max-w-detail px-4 py-4 md:px-6 md:py-6">
      <Link
        href="/earnings"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Earnings
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        Pending payments
      </h1>
      <p className="mt-1 text-small text-ink-muted">
        Money from a completed job reaches your account within{" "}
        {PAYOUT_WINDOW_HOURS} hours. Anything still inside that window is here.
      </p>

      {failed ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load pending payments"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      ) : sorted === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<CheckCircle2 />}
            title="Nothing pending"
            description="Every job you have completed has been settled. Anything you finish today appears here until it clears."
          />
        </div>
      ) : (
        <>
          {/* The total, so a pro knows what is owed without adding up rows. */}
          <section className="mt-4 rounded-card bg-structure p-5">
            <p className="text-small text-on-structure-muted">
              On its way to you
            </p>
            <p className="mt-1 tabular text-display font-semibold text-on-structure">
              {formatCurrency(total)}
            </p>
            <p className="mt-1 text-caption text-on-structure-faint">
              across {sorted.length} completed job
              {sorted.length === 1 ? "" : "s"}
            </p>
          </section>

          {/* Overdue is the platform's failure, not the pro's, and it gets the
              support route rather than a warning to be scrolled past. */}
          {overdue.length > 0 && (
            <section className="mt-4 rounded-card border border-critical-line bg-critical-subtle p-4">
              <p className="flex items-start gap-2 text-small font-semibold text-critical-ink">
                <TriangleAlert
                  className="mt-px size-4 shrink-0"
                  aria-hidden="true"
                />
                {overdue.length === 1
                  ? "1 payment is past the 48-hour window"
                  : `${overdue.length} payments are past the 48-hour window`}
              </p>
              <p className="mt-1 text-caption text-critical-ink">
                This should have reached you by now. Contact support with the
                job date and amount and they can trace it.
              </p>
              <Button variant="secondary" className="mt-3" asChild>
                <Link href="/support">Contact support</Link>
              </Button>
            </section>
          )}

          <ul className="mt-4 space-y-3">
            {sorted.map((row) => (
              <li key={row.earning.bookingId}>
                <PendingRow row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PendingRow({ row }: { row: PendingSettlement }) {
  const late = row.hoursRemaining < 0;

  return (
    <article
      className={cn(
        "rounded-card border bg-surface p-4",
        late ? "border-critical-line" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-small font-medium text-ink">
            {new Date(row.earning.completedAt).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {", "}
            {new Date(row.earning.completedAt).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-px truncate text-caption text-ink-muted">
            {row.earning.bookingId}
          </p>
        </div>
        <p className="shrink-0 tabular text-body font-semibold text-ink">
          {formatCurrency(row.earning.netPaise)}
        </p>
      </div>

      {/* A clock, not a status word. "Pending" says nothing a pro can act on. */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        {late ? (
          <Badge tone="critical">
            Overdue by {formatHours(-row.hoursRemaining)}
          </Badge>
        ) : (
          <Badge tone="clock">
            <Clock className="size-3" aria-hidden="true" />
            Clears in {formatHours(row.hoursRemaining)}
          </Badge>
        )}
      </div>
    </article>
  );
}

/** Hours under a day, then days. "in 32 hours" is harder to read than "1 day". */
function formatHours(hours: number): string {
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} min`;
  }
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} hour${h === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
