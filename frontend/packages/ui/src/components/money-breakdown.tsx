"use client";

import * as React from "react";
import { Gift, Info } from "lucide-react";
import { cn } from "../lib/cn";
import { formatCurrency } from "../lib/format";

/**
 * A pro's settlement: gross → CFC fee → net.
 *
 * One component for the three screens that show it — job completed (Pro 19),
 * earnings (Pro 22) and transaction history (Pro 23) — because a pro's income
 * rendered three times is a pro's income that will eventually be rendered three
 * different ways, and the one they trust will be whichever is largest.
 *
 * ## The GST line is a note, never a deduction
 *
 * This is the rule most likely to be got wrong, so it is enforced by the
 * component's shape rather than left to each caller: there is no prop for a GST
 * deduction, because **GST is not deducted from the pro.**
 *
 * CGST 9% + SGST 9% apply to the *platform fee charged to the customer*, which
 * is a different number from the commission taken from the pro. Subtracting it
 * here as well would understate a pro's earnings by 18% of their gross — on a
 * ₹1,500 job that is ₹270 they never see an explanation for. `gstNote` exists
 * so a screen can say where GST actually goes, and it cannot alter the
 * arithmetic.
 *
 * ## Net is passed in, not computed
 *
 * The caller gets `netPaise` from the same function that produced the fee, so
 * the three figures always reconcile. Recomputing it here would create a second
 * source of truth for the number that matters most.
 */

export interface MoneyBreakdownProps {
  /** What the customer paid for the pro's work, before commission. */
  grossPaise: number;
  /** CFC's commission. Zero while the first-20-jobs offer applies. */
  cfcFeePaise: number;
  /** What reaches the pro. Derived by the caller, never here. */
  netPaise: number;
  /** The rate charged, in basis points. 1500 = 15%, 0 = free. */
  cfcFeeBps: number;
  /** True when the onboarding offer waived the commission. */
  commissionFree?: boolean | undefined;
  /** When the money arrives. "Within 48 hours of completing." */
  payoutNote?: string | undefined;
  /** Explains where GST goes. Cannot change any figure. */
  gstNote?: boolean | undefined;
  /** Larger type for the net figure, on a screen where it is the headline. */
  emphasis?: boolean | undefined;
  className?: string | undefined;
}

export function MoneyBreakdown({
  grossPaise,
  cfcFeePaise,
  netPaise,
  cfcFeeBps,
  commissionFree = false,
  payoutNote,
  gstNote = false,
  emphasis = false,
  className,
}: MoneyBreakdownProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        className,
      )}
    >
      <dl className="divide-y divide-border-soft">
        <Row label="Job value" value={formatCurrency(grossPaise)} />

        {/* The fee. Named with its rate, because "CFC fee ₹225" invites the
            question this line should already have answered. */}
        <Row
          label={
            commissionFree
              ? "CFC platform fee"
              : `CFC platform fee (${(cfcFeeBps / 100).toFixed(0)}%)`
          }
          value={
            commissionFree ? "₹0" : `− ${formatCurrency(cfcFeePaise)}`
          }
          tone={commissionFree ? "free" : "deduction"}
          note={
            commissionFree
              ? "Waived — this is one of your first 20 jobs"
              : undefined
          }
        />
      </dl>

      {/* Net, separated by a heavier rule. This is the figure a pro reads. */}
      <div className="border-t border-border bg-canvas px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "text-small font-semibold text-ink",
              emphasis && "text-body",
            )}
          >
            You earn
          </span>
          <span
            className={cn(
              "shrink-0 tabular font-semibold text-ink",
              emphasis ? "text-display" : "text-title",
            )}
          >
            {formatCurrency(netPaise)}
          </span>
        </div>

        {payoutNote !== undefined && (
          <p className="mt-1 text-caption text-ink-muted">{payoutNote}</p>
        )}

        {/* Where GST goes. Deliberately BELOW the net figure and outside the
            deduction list, so it can never be read as money coming off. */}
        {gstNote && (
          <p className="mt-2 flex items-start gap-2 border-t border-border pt-2 text-caption text-ink-muted">
            <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
            <span>
              GST (CGST 9% + SGST 9%) is charged to the customer on the platform
              fee. It is not deducted from your earning.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "plain",
  note,
}: {
  label: string;
  value: string;
  tone?: "plain" | "deduction" | "free";
  note?: string | undefined;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <dt
          className={cn(
            "flex min-w-0 items-center gap-2 text-small",
            tone === "free" ? "text-live-ink" : "text-ink-muted",
          )}
        >
          {tone === "free" && (
            <Gift className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{label}</span>
        </dt>
        <dd
          className={cn(
            "shrink-0 tabular text-body font-medium",
            tone === "deduction"
              ? "text-ink"
              : tone === "free"
                ? "text-live-ink"
                : "text-ink",
          )}
        >
          {value}
        </dd>
      </div>
      {note !== undefined && (
        <p className="mt-px text-caption text-live-ink">{note}</p>
      )}
    </div>
  );
}
