"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldAlert } from "lucide-react";
import {
  PENALTY_AMOUNTS_NOT_SET,
  getGoldenRules,
  getPenaltyStructure,
  type GoldenRule,
  type PenaltyStep,
} from "@cfc/mocks";
import { Button, ErrorState, Skeleton } from "@cfc/ui";
import { GoldenRules, PenaltyStructure } from "@/components/conduct-rules";

/**
 * Pro 35 — the Partner Code of Conduct.
 *
 * "CFC 3 Golden Rules, penalty structure, sign-off confirmation."
 *
 * ## Why the three rules are what they are
 *
 * **The agreement names neither the three rules nor a single penalty amount.**
 * `PLATFORM-FACTS.md` carries the penalty mechanism — warnings, deductions,
 * auto-block below 2.5 — and no schedule of offences.
 *
 * Inventing three rules and a fine table would be putting words in the client's
 * mouth on a document a professional signs. So the rules are derived from what
 * the platform already enforces in code, and each cites the mechanism behind
 * it: the 30-second accept window, the 100 m GPS gate and the completion OTP,
 * and the rating that gates dispatch. The existing warning reasons in the
 * fixture — lateness, missing GPS proof, unprofessional conduct — map onto
 * exactly these three, which is a reasonable sign the derivation is right.
 *
 * This is the first item on the client-decisions list. PRO-OPEN-ITEMS 1.1.
 *
 * ## Sign-off is already recorded, so this screen shows it rather than asks
 *
 * A pro accepted these during onboarding (Pro 8). Asking again here would
 * either be meaningless or imply the earlier acceptance did not count. The
 * screen states that they accepted and offers the disciplinary route instead —
 * which is what a pro opening this screen is usually looking for.
 *
 * ## Word-for-word identical to Pro 8
 *
 * Same component, same source. A professional who signed one wording and later
 * read another would have a legitimate grievance, and two copies of a document
 * is precisely how that happens.
 */

export default function ProConductPage() {
  const [rules, setRules] = React.useState<GoldenRule[] | null>(null);
  const [penalties, setPenalties] = React.useState<PenaltyStep[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void Promise.all([getGoldenRules(), getPenaltyStructure()])
      .then(([r, p]) => {
        if (cancelled) return;
        setRules(r);
        setPenalties(p);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => load(), [load]);

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load the Code of Conduct"
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
        Partner Code of Conduct
      </h1>
      <p className="mt-1 text-small text-ink-muted">
        Three rules. They are what customers are promised, and what CFC holds
        every professional to.
      </p>

      {/* Already accepted. Stated, not re-asked. */}
      <p className="mt-4 flex items-center gap-2 rounded-card border border-live-line bg-live-subtle p-3 text-caption text-live-ink">
        <Check className="size-4 shrink-0" aria-hidden="true" />
        You accepted these when you joined CFC.
      </p>

      <div className="mt-6 space-y-4">
        {rules === null ? (
          <>
            <Skeleton className="h-block-md w-full rounded-card" />
            <Skeleton className="h-block-md w-full rounded-card" />
            <Skeleton className="h-block-md w-full rounded-card" />
          </>
        ) : (
          <GoldenRules rules={rules} tone="light" />
        )}

        {penalties === null ? (
          <Skeleton className="h-block-sm w-full rounded-card" />
        ) : (
          <PenaltyStructure
            steps={penalties}
            amountsNotSet={PENALTY_AMOUNTS_NOT_SET}
            tone="light"
          />
        )}
      </div>

      {/* Where a pro reading this usually wants to go next. */}
      <section className="mt-6 rounded-card border border-border bg-canvas p-4">
        <h2 className="text-small font-medium text-ink">Your record</h2>
        <p className="mt-1 text-caption text-ink-muted">
          Any warnings on your account, with the reason and any deduction, are
          on your warnings screen.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href="/warnings">
              <ShieldAlert />
              See your warnings
            </Link>
          </Button>
          <Button variant="secondary" className="min-w-0 flex-1" asChild>
            <Link href="/support">Ask the office a question</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
