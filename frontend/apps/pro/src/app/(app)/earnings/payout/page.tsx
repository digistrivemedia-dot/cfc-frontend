"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Landmark,
  Smartphone,
} from "lucide-react";
import {
  getPayoutBalance,
  getPayoutDestinations,
  requestPayout,
  type PayoutBalance,
  type PayoutDestination,
} from "@cfc/mocks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  EmptyState,
  ErrorState,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 24 — withdraw.
 *
 * The agreement offers a **daily payout** with auto-transfer to bank or UPI
 * **within 48 hours** of completion. So this screen requests a transfer against
 * a settled balance; it does not move money instantly, and it does not claim to.
 *
 * ## Available is not the same as earned
 *
 * Money from a job completed an hour ago has not settled. Showing one merged
 * "balance" would offer a pro an amount they cannot take — so the two figures
 * are separate and the pending one says when it clears.
 *
 * ## The minimum threshold has no source
 *
 * The inventory asks for a "minimum threshold" and **the agreement never states
 * one.** Rather than invent ₹500 — a commitment a developer is not entitled to
 * make on the client's behalf — the value comes from config, currently zero, so
 * no threshold is shown at all. The moment the client gives a figure it appears
 * here with no code change. PRO-OPEN-ITEMS 1.2.
 *
 * ## Why it confirms
 *
 * A payout is a real money movement to a real account. It confirms, and the
 * confirmation names the destination — a pro with both a bank account and a UPI
 * handle on file should not have to guess which one it went to.
 */

export default function ProPayoutPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [balance, setBalance] = React.useState<PayoutBalance | null>(null);
  const [destinations, setDestinations] = React.useState<
    PayoutDestination[] | null
  >(null);
  const [chosen, setChosen] = React.useState<string>("");
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [done, setDone] = React.useState<{
    amountPaise: number;
    destination: PayoutDestination;
    expectedBy: string;
  } | null>(null);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void Promise.all([getPayoutBalance(proId), getPayoutDestinations(proId)])
      .then(([bal, dests]) => {
        if (cancelled) return;
        setBalance(bal);
        setDestinations(dests);
        // Bank first if present: it is the default every pro has, and a
        // pre-selected destination saves a tap on the common path.
        setChosen(dests[0]?.kind ?? "");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  const destination =
    destinations?.find((d) => d.kind === chosen) ?? destinations?.[0];

  const submit = async () => {
    if (destination === undefined) return;
    setBusy(true);
    try {
      const result = await requestPayout(proId, destination);
      if (!result.ok) {
        toast.error(
          result.reason === "nothing-available"
            ? "Nothing has cleared yet. Money from a completed job is available within 48 hours."
            : "Your balance is below the minimum for a payout.",
        );
        return;
      }
      setDone({
        amountPaise: result.amountPaise,
        destination: result.destination,
        expectedBy: result.expectedBy,
      });
    } catch {
      toast.error("Could not request the payout. Check your connection.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your balance"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  if (done !== null) return <PayoutRequested {...done} />;

  if (balance === null || destinations === null) {
    return (
      <div className="mx-auto max-w-detail px-4 py-4 md:px-6">
        <Skeleton className="h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-sm w-full rounded-card" />
      </div>
    );
  }

  return (
    <ProActionLayout
      action={
        <ProAction>
          <div className="border-b border-border pb-3">
            <p className="text-small text-ink-muted">Withdrawing</p>
            <p className="mt-px tabular text-title font-semibold text-ink">
              {formatCurrency(balance.availablePaise)}
            </p>
          </div>

          {/* Only rendered when a threshold actually exists. A "minimum ₹0"
              line would be noise standing in for an answer we do not have. */}
          {balance.minimumPaise > 0 && (
            <p className="mt-3 text-caption text-ink-muted">
              Minimum payout {formatCurrency(balance.minimumPaise)}.
            </p>
          )}

          <Button
            size="pro"
            className="mt-3 w-full"
            disabled={!balance.canWithdraw || busy || destination === undefined}
            onClick={() => setConfirming(true)}
          >
            {busy ? "Requesting…" : "Request payout"}
          </Button>

          {!balance.canWithdraw && (
            <p className="mt-2 text-caption text-clock-ink">
              {balance.pendingPaise > 0
                ? `${formatCurrency(balance.pendingPaise)} is still clearing. It will be available within 48 hours of each job.`
                : "You have nothing available to withdraw yet."}
            </p>
          )}
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href="/earnings"
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Earnings
        </Link>

        <h1 className="mt-3 text-title font-semibold text-ink">Withdraw</h1>
        <p className="mt-1 text-small text-ink-muted">
          Money from a completed job clears within 48 hours. You can request a
          payout of the cleared balance any day.
        </p>

        {/* The two figures, kept apart. */}
        <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          <dl className="divide-y divide-border-soft">
            <div className="px-4 py-4">
              <dt className="text-small text-ink-muted">Available to withdraw</dt>
              <dd className="mt-px tabular text-display font-semibold text-ink">
                {formatCurrency(balance.availablePaise)}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="flex items-center gap-2 text-small text-ink-muted">
                <Clock className="size-4 shrink-0" aria-hidden="true" />
                Still clearing
              </dt>
              <dd className="mt-px tabular text-body font-medium text-ink">
                {formatCurrency(balance.pendingPaise)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Where it goes. */}
        <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            Send it to
          </h2>

          {destinations.length === 0 ? (
            <EmptyState
              icon={<Landmark />}
              title="No payout account on file"
              description="Add your bank account or UPI ID before requesting a payout."
            />
          ) : (
            <div className="p-4">
              <RadioGroup value={chosen} onValueChange={setChosen}>
                <div className="space-y-2">
                  {destinations.map((d) => (
                    <label
                      key={d.kind}
                      className={cn(
                        "flex min-h-touch cursor-pointer items-center gap-3 rounded-control border p-3",
                        "transition-colors duration-fast",
                        chosen === d.kind
                          ? "border-action bg-action-subtle"
                          : "border-border hover:border-action-line",
                      )}
                    >
                      <RadioGroupItem value={d.kind} />
                      <span className="shrink-0 text-ink-muted">
                        {d.kind === "bank" ? (
                          <Landmark className="size-5" aria-hidden="true" />
                        ) : (
                          <Smartphone className="size-5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-small font-medium text-ink">
                          {d.label}
                        </span>
                        <span className="block truncate text-caption text-ink-muted">
                          {d.detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </RadioGroup>

              <p className="mt-3 text-caption text-ink-muted">
                Wrong details?{" "}
                <Link
                  href="/profile/edit"
                  className="font-medium text-action hover:underline"
                >
                  Update them in your profile
                </Link>
                .
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Real money to a real account. It confirms, and it names where. */}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Withdraw {formatCurrency(balance.availablePaise)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will be transferred to your{" "}
              {destination?.kind === "upi" ? "UPI" : "bank account"} (
              {destination?.detail}). Transfers usually arrive within a day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>
              Yes, withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProActionLayout>
  );
}

/**
 * Requested, not paid.
 *
 * The wording matters: a screen saying "paid" when a bank transfer has been
 * *initiated* is the sort of small lie that produces a support call the moment
 * the pro checks their account and finds nothing.
 */
function PayoutRequested({
  amountPaise,
  destination,
  expectedBy,
}: {
  amountPaise: number;
  destination: PayoutDestination;
  expectedBy: string;
}) {
  return (
    <div className="mx-auto max-w-detail px-4 py-6 md:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-emblem items-center justify-center rounded-full bg-live-subtle text-live-ink">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-title font-semibold text-ink">
          Payout requested
        </h1>
        <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">
          {formatCurrency(amountPaise)} is on its way to your{" "}
          {destination.kind === "upi" ? "UPI" : "bank account"}.
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-card border border-border bg-surface">
        <dl className="divide-y divide-border-soft">
          <Row label="Amount" value={formatCurrency(amountPaise)} bold />
          <Row label={destination.label} value={destination.detail} />
          <Row
            label="Expected by"
            value={new Date(expectedBy).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          />
        </dl>
      </section>

      <p className="mt-4 flex items-start gap-2 rounded-card border border-border bg-canvas p-3 text-caption text-ink-muted">
        <Banknote className="mt-px size-4 shrink-0" aria-hidden="true" />
        If it has not arrived by then, contact CFC support with the date and
        amount and they can trace it.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button size="pro" className="min-w-0 flex-1" asChild>
          <Link href="/earnings">Back to earnings</Link>
        </Button>
        <Button variant="secondary" className="min-w-0 flex-1" asChild>
          <Link href="/earnings/transactions">See all transactions</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 shrink truncate text-right tabular text-body",
          bold ? "font-semibold text-ink" : "font-medium text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
