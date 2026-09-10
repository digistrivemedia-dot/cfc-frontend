"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Plus,
  RotateCcw,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  addMoney,
  getWalletBalance,
  getWalletTransactions,
} from "@cfc/mocks";
import type { WalletFilter } from "@cfc/mocks";
import type { WalletTransaction } from "@cfc/types";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  InlineAlert,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  cn,
  formatCurrency,
  formatSchedule,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 36 and 37 — the wallet, and its full statement.
 *
 * One route. 37 is "all payments, refunds, wallet credits", which is the same
 * list 36 shows unfiltered — so it is a filter on this screen rather than a
 * second page a customer has to find.
 *
 * Every line carries the balance immediately after it, because that is how
 * somebody checks a statement: they find the line they remember and verify the
 * number moved the way they expect.
 */

const FILTERS: { id: WalletFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "topup", label: "Added" },
  { id: "booking", label: "Spent" },
  { id: "refund", label: "Credits" },
];

const KIND_META: Record<
  WalletTransaction["kind"],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  topup: { icon: Plus, label: "Added money" },
  booking: { icon: ArrowUpRight, label: "Booking" },
  refund: { icon: RotateCcw, label: "Refund" },
  cashback: { icon: Gift, label: "Cashback" },
  referral: { icon: Gift, label: "Referral" },
};

function WalletInner() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (params.get("show") as WalletFilter | null) ?? "all";

  const [balance, setBalance] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<WalletTransaction[] | null>(null);
  const [error, setError] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    setRows(null);
    Promise.all([getWalletBalance(), getWalletTransactions(filter)])
      .then(([b, t]) => {
        setBalance(b);
        setRows(t);
      })
      .catch(() => setError(true));
  }, [filter]);

  React.useEffect(() => load(), [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not load your wallet"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <h1 className="text-title font-semibold text-ink">Wallet</h1>

      {/* Balance. The one number this screen exists for, so it gets the room. */}
      <section className="mt-3 rounded-card border border-action-line bg-action-subtle p-4">
        <p className="text-caption text-ink-muted">Available balance</p>
        {balance === null ? (
          <Skeleton className="mt-1 h-8 w-line-md" />
        ) : (
          <p className="tabular text-display font-semibold text-ink">
            {formatCurrency(balance)}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus />
            Add money
          </Button>
          <Button variant="secondary" className="flex-1" asChild>
            <Link href="/refer">
              <Gift />
              Earn by referring
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between gap-2">
        <h2 className="text-heading font-semibold text-ink">Transactions</h2>
      </div>

      {/* Customer 37 as a filter, not a second screen. */}
      <div
        role="tablist"
        aria-label="Filter transactions"
        className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0"
      >
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                router.push(f.id === "all" ? "/wallet" : `/wallet?show=${f.id}`)
              }
              className={cn(
                "flex h-touch shrink-0 items-center rounded-pill border px-3 text-small",
                "transition-colors duration-fast",
                active
                  ? "border-action bg-action text-on-action"
                  : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {rows === null ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-block-xs rounded-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-3 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<WalletIcon />}
            title="Nothing here yet"
            description={
              filter === "all"
                ? "Add money or complete a booking and it will show up here."
                : "No transactions of this kind."
            }
          />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border-soft overflow-hidden rounded-card border border-border bg-surface">
          {rows.map((t) => (
            <li key={t.id}>
              <TransactionRow transaction={t} />
            </li>
          ))}
        </ul>
      )}

      <AddMoneySheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={load}
      />
    </div>
  );
}

/**
 * One ledger line.
 *
 * A failed transaction is shown greyed with its status named, and its amount
 * is **not** signed — it never moved, and showing "+₹500" struck through still
 * reads as money that arrived.
 */
function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const meta = KIND_META[transaction.kind];
  const Icon = meta.icon;
  const failed = transaction.status === "failed";
  const credit = transaction.amountPaise > 0;

  return (
    <div className={cn("flex items-start gap-3 p-4", failed && "bg-canvas")}>
      <span
        className={cn(
          "flex size-tile shrink-0 items-center justify-center rounded-control",
          failed
            ? "bg-neutral-subtle text-ink-faint"
            : credit
              ? "bg-live-subtle text-live-ink"
              : "bg-neutral-subtle text-ink-muted",
        )}
      >
        {failed ? (
          <Icon className="size-4" aria-hidden="true" />
        ) : credit ? (
          <ArrowDownLeft className="size-4" aria-hidden="true" />
        ) : (
          <ArrowUpRight className="size-4" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "text-small font-medium",
              failed ? "text-ink-muted" : "text-ink",
            )}
          >
            {transaction.label}
          </p>
          {failed && <Badge tone="critical">Failed</Badge>}
          {transaction.status === "pending" && (
            <Badge tone="clock" dot>
              Pending
            </Badge>
          )}
        </div>

        <p className="tabular text-caption text-ink-muted">
          {formatSchedule(transaction.at)}
          {transaction.bookingReference !== undefined && (
            <>
              {" · "}
              <Link
                href={`/bookings`}
                className="hover:text-action hover:underline"
              >
                {transaction.bookingReference}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "tabular text-small font-semibold",
            failed ? "text-ink-faint" : credit ? "text-live-ink" : "text-ink",
          )}
        >
          {/* No sign on a failed line: nothing moved. */}
          {failed
            ? formatCurrency(Math.abs(transaction.amountPaise))
            : `${credit ? "+" : "−"} ${formatCurrency(Math.abs(transaction.amountPaise))}`}
        </p>
        {!failed && (
          <p className="tabular text-caption text-ink-faint">
            Bal {formatCurrency(transaction.balanceAfterPaise)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Customer 36 — "add money".
 *
 * There is no payment gateway, and this says so rather than showing a card
 * form that leads nowhere. The amount buttons are the useful part to build and
 * review now; the gateway swaps in behind them.
 */
function AddMoneySheet({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const PRESETS = [10_000, 25_000, 50_000, 100_000];
  const [amountPaise, setAmountPaise] = React.useState(PRESETS[1] ?? 25_000);
  const [busy, setBusy] = React.useState(false);

  const submit = () => {
    setBusy(true);
    addMoney(amountPaise)
      .then((result) => {
        if (result.ok) {
          toast.success(
            `${formatCurrency(amountPaise)} will be added once the payment gateway is connected.`,
          );
          onOpenChange(false);
          onAdded();
          return;
        }
        toast.error("We could not start that. Try again.");
      })
      .catch(() => toast.error("We could not start that. Try again."))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add money</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-small font-medium text-ink">
              How much?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const on = p === amountPaise;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAmountPaise(p)}
                    className={cn(
                      "tabular flex h-touch items-center justify-center rounded-control border text-small",
                      "transition-colors duration-fast",
                      on
                        ? "border-action bg-action font-medium text-on-action"
                        : "border-border bg-surface text-ink hover:border-action-line",
                    )}
                  >
                    {formatCurrency(p)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <InlineAlert tone="info" title="Payment gateway pending">
            Adding money needs the payment integration, which is not connected
            yet. Nothing will be charged.
          </InlineAlert>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="primary"
            className="w-full"
            loading={busy}
            onClick={submit}
          >
            Continue with {formatCurrency(amountPaise)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function WalletPageInner() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
          <Skeleton className="h-block-md rounded-card" />
        </div>
      }
    >
      <WalletInner />
    </Suspense>
  );
}

/**
 * Everything on this screen is the signed-in customer's own. A visitor without
 * an account is offered one rather than being shown somebody else's.
 */
export default function WalletPage() {
  return (
    <RequireAccount
      title="Sign in to see your wallet"
      description="Your balance, refunds and transaction history are tied to your account."
    >
      <WalletPageInner />
    </RequireAccount>
  );
}
