import { Gift } from "lucide-react";
import { cn, formatCurrency } from "@cfc/ui";

/**
 * What the pro earns from a job, and nothing else.
 *
 * This replaces `MoneyBreakdown` from `@cfc/ui` everywhere in the Pro app. That
 * component shows the job value, CFC's fee and the rate charged — which is the
 * right breakdown for the admin app and exactly what the client asked to be
 * removed from this one, twice over:
 *
 *   Pro correction 2 — "Job value and CFC Platform fee should display for the
 *   Admin app only, not for the Pro app. Total earnings remain visible."
 *   Pro correction 6 — "Don't display Job Value and Platform Fee to Pro
 *   anywhere; display only 'You earn pro amount only'."
 *
 * `MoneyBreakdown` itself is left alone in `packages/ui`: it is shared, and the
 * admin app is where that breakdown belongs. Only the Pro app stops using it.
 *
 * The commission-free badge stays. It names no figure, and it is a benefit to
 * the pro rather than a deduction from them — a pro who was told "your first 20
 * jobs are commission-free" should still see which jobs those were.
 */
export function YouEarn({
  netPaise,
  commissionFree = false,
  payoutNote,
  emphasis = false,
  className,
}: {
  /** What reaches the pro. The only figure this component shows. */
  netPaise: number;
  /** True when the onboarding offer waived the commission on this job. */
  commissionFree?: boolean | undefined;
  /** When the money arrives. "Within 48 hours of completing." */
  payoutNote?: string | undefined;
  /** Larger type, for a screen where this is the headline. */
  emphasis?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-small text-ink-muted">You earn</span>
        <span
          className={cn(
            "tabular font-semibold text-ink",
            emphasis ? "text-title" : "text-body",
          )}
        >
          {formatCurrency(netPaise)}
        </span>
      </div>

      {commissionFree ? (
        <p className="mt-2 flex items-center gap-2 text-caption text-live-ink">
          <Gift className="size-4 shrink-0" aria-hidden="true" />
          No CFC fee — one of your first 20 jobs.
        </p>
      ) : null}

      {payoutNote ? (
        <p className="mt-2 text-caption text-ink-muted">{payoutNote}</p>
      ) : null}
    </div>
  );
}
