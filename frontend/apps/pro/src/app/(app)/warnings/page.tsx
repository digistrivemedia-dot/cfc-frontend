"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { getPro, getProWarnings } from "@cfc/mocks";
import type { ProDetail, ProWarning } from "@cfc/types";
import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  StarRating,
  cn,
  formatCurrency,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 34 — warnings and penalties.
 *
 * "Shows active warnings, penalty deductions, reason, and escalation path."
 *
 * ## Every warning carries its reason and who issued it
 *
 * A deduction with no explanation is money taken from someone with no way to
 * question it. The fixture already carries both — a reason and the admin's
 * name — and both are shown, because the escalation path the inventory asks for
 * is meaningless without knowing who to escalate to and about what.
 *
 * ## A ₹0 penalty is shown as ₹0, not omitted
 *
 * Some warnings carry no deduction. Rendering nothing there would leave a pro
 * unsure whether money was taken, which is worse than a plain zero.
 *
 * ## The rating sits on this screen too
 *
 * Warnings and the 2.5 auto-block threshold are the same subject: what could
 * cost a pro their account. Splitting them across two screens means a pro
 * reading their warnings does not see how close they are to the line.
 *
 * ## A clean record is stated as such
 *
 * "No warnings" is worth saying out loud rather than rendering an empty list. A
 * pro who has done nothing wrong should be told so, and it makes the screen
 * safe to open.
 */

/** From the agreement. */
const AUTO_BLOCK_RATING = 2.5;

export default function ProWarningsPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [pro, setPro] = React.useState<ProDetail | null>(null);
  const [warnings, setWarnings] = React.useState<ProWarning[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void Promise.all([getPro(proId), getProWarnings(proId)])
      .then(([p, w]) => {
        if (cancelled) return;
        setPro(p);
        setWarnings(w);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  // Above every early return. This memo previously sat below the `failed`
  // branch, so a failed fetch changed the hook count between renders and React
  // threw "Rendered fewer hooks than expected" — taking the screen down at
  // exactly the moment the pro was already looking at an error.
  const sorted = React.useMemo(
    () =>
      warnings === null
        ? null
        : [...warnings].sort(
            (a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt),
          ),
    [warnings],
  );

  const totalPenalty = (sorted ?? []).reduce((t, w) => t + w.penaltyPaise, 0);

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your warnings"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Profile
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        Warnings and penalties
      </h1>

      {/* Blocked is the headline if it applies. */}
      {pro?.blocked === true && (
        <section className="mt-4 rounded-card border border-critical-line bg-critical-subtle p-4">
          <p className="flex items-start gap-2 text-small font-semibold text-critical-ink">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            Your account is blocked
          </p>
          <p className="mt-1 text-caption text-critical-ink">
            You are not receiving job alerts. Call the office to find out what is
            needed to restore your account.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" asChild>
            <Link href="/support">
              <Phone />
              Call the office
            </Link>
          </Button>
        </section>
      )}

      {/* The rating, because it is the other thing that can end an account. */}
      {pro !== null && pro.rating > 0 && <RatingLine rating={pro.rating} />}

      {/* The warnings. */}
      {sorted === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-4 rounded-card border border-live-line bg-live-subtle">
          <EmptyState
            icon={<ShieldCheck />}
            title="No warnings on your account"
            description="Nothing has been recorded against you. Keep turning up on time, taking your photos, and closing jobs with the customer's code."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-small text-ink-muted">
              {sorted.length} warning{sorted.length === 1 ? "" : "s"} on your
              account
            </p>
            {totalPenalty > 0 && (
              <p className="tabular text-small font-medium text-ink">
                {formatCurrency(totalPenalty)} deducted in total
              </p>
            )}
          </div>

          <ul className="mt-3 space-y-3">
            {sorted.map((warning) => (
              <li key={warning.id}>
                <WarningCard warning={warning} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The escalation path the inventory asks for. */}
      <section className="mt-6 rounded-card border border-border bg-canvas p-4">
        <h2 className="text-small font-medium text-ink">
          If you think a warning is wrong
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Raise it with the CFC office within a few days, with the job reference
          and what happened. A warning issued in error is removed and any
          deduction is returned to your wallet.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href="/support">Dispute a warning</Link>
          </Button>
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href="/conduct">
              <ScrollText />
              Read the Code of Conduct
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function RatingLine({ rating }: { rating: number }) {
  const atRisk = rating < AUTO_BLOCK_RATING + 0.5;

  return (
    <section
      className={cn(
        "mt-4 flex items-center justify-between gap-4 rounded-card border p-4",
        atRisk
          ? "border-critical-line bg-critical-subtle"
          : "border-border bg-surface",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-small font-medium",
            atRisk ? "text-critical-ink" : "text-ink",
          )}
        >
          Your rating
        </p>
        <p
          className={cn(
            "mt-px text-caption",
            atRisk ? "text-critical-ink" : "text-ink-muted",
          )}
        >
          Accounts below {AUTO_BLOCK_RATING} are blocked automatically.
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "tabular text-title font-semibold",
            atRisk ? "text-critical-ink" : "text-ink",
          )}
        >
          {rating.toFixed(1)}
        </p>
        <StarRating value={rating} className="justify-end" />
      </div>
    </section>
  );
}

function WarningCard({ warning }: { warning: ProWarning }) {
  return (
    <article className="rounded-card border border-clock-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-clock-subtle text-clock-ink">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-ink">{warning.reason}</p>
          <p className="mt-px text-caption text-ink-muted">
            {new Date(warning.issuedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · issued by "}
            {warning.issuedBy}
          </p>
        </div>
      </div>

      {/* The deduction. Zero is shown as ₹0, never omitted — a pro should not
          have to guess whether money was taken. */}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <span className="text-caption text-ink-muted">Deduction</span>
        <span
          className={cn(
            "tabular text-small font-semibold",
            warning.penaltyPaise > 0 ? "text-critical-ink" : "text-ink",
          )}
        >
          {warning.penaltyPaise > 0
            ? `− ${formatCurrency(warning.penaltyPaise)}`
            : formatCurrency(0)}
        </span>
      </div>
    </article>
  );
}
