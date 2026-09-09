"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  Clock,
  Gift,
  ReceiptText,
} from "lucide-react";
import {
  getCommissionFreeRemaining,
  getEarningsSeries,
  getEarningsSummary,
  getPayoutBalance,
  type EarningsPoint,
  type PayoutBalance,
} from "@cfc/mocks";
import {
  COMMISSION_FREE_JOBS,
  EARNINGS_PERIODS,
  EARNINGS_PERIOD_LABEL,
  type EarningsPeriod,
  type EarningsSummary,
} from "@cfc/types";
import {
  Button,
  ChartFrame,
  ErrorState,
  LineChart,
  MoneyBreakdown,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
  formatCurrency,
  formatCurrencyAxis,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 22 — earnings.
 *
 * Today / This week / This month, with the full breakdown and a chart. The
 * inventory asks for exactly that; the decisions worth stating are about which
 * number leads and what the chart is for.
 *
 * ## Net leads, always
 *
 * The headline is what reached the pro, not what the customer paid. Every other
 * pro screen does the same, and consistency here is not cosmetic: a pro who
 * sees ₹42,000 on this screen and ₹35,700 in their bank will believe one of the
 * two is lying, and they will be right.
 *
 * ## The chart plots net per day, not cumulative
 *
 * A cumulative line only ever goes up, which flatters and informs nobody. Per
 * day shows the thing a pro can act on: which days are worth working. Days with
 * no jobs are plotted as zero rather than skipped — a gap reads as missing
 * data, a zero reads as a day off, and only one of those is true.
 *
 * ## Desktop is two columns
 *
 * The trend and the breakdown on the left, the payout position docked right,
 * because "how much can I take out" is a different question from "how did the
 * month go" and a pro arrives wanting one or the other.
 */

export default function ProEarningsPage() {
  const proId = React.useMemo(() => currentProId(), []);
  const [period, setPeriod] = React.useState<EarningsPeriod>("week");

  const [summary, setSummary] = React.useState<EarningsSummary | null>(null);
  const [series, setSeries] = React.useState<EarningsPoint[] | null>(null);
  const [balance, setBalance] = React.useState<PayoutBalance | null>(null);
  const [freeLeft, setFreeLeft] = React.useState(0);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setSummary(null);
    setSeries(null);

    let cancelled = false;
    void Promise.all([
      getEarningsSummary(proId, period),
      getEarningsSeries(proId, period),
      getPayoutBalance(proId),
      getCommissionFreeRemaining(proId),
    ])
      .then(([s, ser, bal, free]) => {
        if (cancelled) return;
        setSummary(s);
        setSeries(ser);
        setBalance(bal);
        setFreeLeft(free);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [proId, period]);

  React.useEffect(() => load(), [load]);

  if (failed) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your earnings"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <h1 className="text-title font-semibold text-ink">Earnings</h1>

      <Tabs
        value={period}
        onValueChange={(next) => setPeriod(next as EarningsPeriod)}
        className="mt-4"
      >
        <TabsList>
          {EARNINGS_PERIODS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {EARNINGS_PERIOD_LABEL[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 lg:grid lg:grid-cols-action lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-4">
          <Headline summary={summary} period={period} />

          {freeLeft > 0 && <FreeJobsBanner remaining={freeLeft} />}

          <Trend series={series} period={period} />

          {/* The settlement, from the one component that renders it. */}
          {summary === null ? (
            <Skeleton className="h-block-sm w-full rounded-card" />
          ) : summary.jobCount === 0 ? null : (
            <MoneyBreakdown
              grossPaise={summary.grossPaise}
              cfcFeePaise={summary.cfcFeePaise}
              netPaise={summary.netPaise}
              // The period's effective rate rather than a flat 15%: a month
              // spanning the end of the free-jobs offer is genuinely a blend,
              // and stating 15% there would not match the arithmetic above it.
              cfcFeeBps={
                summary.grossPaise === 0
                  ? 0
                  : Math.round((summary.cfcFeePaise / summary.grossPaise) * 10_000)
              }
              commissionFree={summary.cfcFeePaise === 0}
              gstNote
            />
          )}
        </div>

        {/* Docked on desktop: the money position, and where to go next. */}
        <div className="mt-4 space-y-4 lg:mt-0">
          <PayoutCard balance={balance} />
          <MoneyLinks />
        </div>
      </div>
    </div>
  );
}

// -- The headline ------------------------------------------------------------

function Headline({
  summary,
  period,
}: {
  summary: EarningsSummary | null;
  period: EarningsPeriod;
}) {
  return (
    <section className="rounded-card bg-structure p-5 md:p-6">
      <p className="text-small text-on-structure-muted">
        {EARNINGS_PERIOD_LABEL[period]}, after CFC fee
      </p>

      {summary === null ? (
        <Skeleton className="mt-2 h-8 w-line-lg" />
      ) : (
        <p className="mt-1 tabular text-display font-semibold text-on-structure">
          {formatCurrency(summary.netPaise)}
        </p>
      )}

      {/* A total with no job count is not a figure a pro can read: ₹8,000
          across four jobs and across forty are different weeks. */}
      <p className="mt-1 text-caption text-on-structure-faint">
        {summary === null
          ? " "
          : summary.jobCount === 0
            ? "No jobs completed yet"
            : `${summary.jobCount} job${summary.jobCount === 1 ? "" : "s"} completed`}
      </p>
    </section>
  );
}

function FreeJobsBanner({ remaining }: { remaining: number }) {
  return (
    <section className="flex items-start gap-3 rounded-card border border-clock-line bg-clock-subtle p-4">
      <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-clock text-on-action">
        <Gift className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-small font-semibold text-clock-ink">
          {remaining === 1
            ? "1 commission-free job left"
            : `${remaining} commission-free jobs left`}
        </p>
        <p className="mt-px text-caption text-clock-ink">
          No CFC fee on your first {COMMISSION_FREE_JOBS} jobs — you keep the
          full amount on each.
        </p>
      </div>
    </section>
  );
}

// -- The trend ---------------------------------------------------------------

function Trend({
  series,
  period,
}: {
  series: EarningsPoint[] | null;
  period: EarningsPeriod;
}) {
  if (series === null) {
    return <Skeleton className="h-block-lg w-full rounded-card" />;
  }

  // A single day is not a trend. One point on a line chart is a dot, and a dot
  // conveys less than the headline figure already above it.
  if (period === "today" || series.length < 2) return null;

  const rupees = series.map((p) => ({
    day: p.day,
    net: p.netPaise,
    jobs: p.jobs,
  }));

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="text-small font-semibold text-ink">
        What you earned each day
      </h2>
      <div className="mt-3">
        <ChartFrame
          summary={`Net earnings per day for ${EARNINGS_PERIOD_LABEL[period].toLowerCase()}`}
          data={rupees}
          xKey="day"
          columns={[
            { key: "net", label: "Net earned" },
            { key: "jobs", label: "Jobs" },
          ]}
          formatValue={(v) => formatCurrency(v)}
        >
          <LineChart
            data={rupees}
            xKey="day"
            series={[{ key: "net", label: "Net earned" }]}
            formatValue={(v) => formatCurrency(v)}
            formatAxisValue={formatCurrencyAxis}
            height={240}
          />
        </ChartFrame>
      </div>
    </section>
  );
}

// -- The payout position -----------------------------------------------------

/**
 * What can actually be withdrawn.
 *
 * Two figures, kept apart on purpose. Everything earned is not everything
 * available: money inside the 48-hour settlement window has not cleared. A
 * single merged "balance" would show a pro an amount they cannot take, which is
 * worse than a smaller honest number.
 */
function PayoutCard({ balance }: { balance: PayoutBalance | null }) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
        Your money
      </h2>

      {balance === null ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-line-lg" />
        </div>
      ) : (
        <>
          <dl className="divide-y divide-border-soft">
            <div className="px-4 py-3">
              <dt className="text-small text-ink-muted">Available now</dt>
              <dd className="mt-px tabular text-title font-semibold text-ink">
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
              <dd className="mt-px text-caption text-ink-muted">
                Completed jobs settle within 48 hours.
              </dd>
            </div>
          </dl>

          <div className="border-t border-border p-4">
            <Button
              className="w-full"
              disabled={!balance.canWithdraw}
              asChild={balance.canWithdraw}
            >
              {balance.canWithdraw ? (
                <Link href="/earnings/payout">
                  <Banknote />
                  Withdraw
                </Link>
              ) : (
                <>
                  <Banknote />
                  Withdraw
                </>
              )}
            </Button>
            {!balance.canWithdraw && (
              <p className="mt-2 text-caption text-ink-muted">
                Nothing has cleared yet. Money from a completed job is available
                within 48 hours.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function MoneyLinks() {
  const links = [
    {
      href: "/earnings/transactions",
      label: "Transaction history",
      body: "Every job, with what CFC took and what you kept.",
      icon: <ReceiptText className="size-5" aria-hidden="true" />,
    },
    {
      href: "/earnings/pending",
      label: "Pending payments",
      body: "Jobs you have finished where the money is still on its way.",
      icon: <Clock className="size-5" aria-hidden="true" />,
    },
  ];

  return (
    <nav className="overflow-hidden rounded-card border border-border bg-surface">
      <ul className="divide-y divide-border-soft">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "flex min-h-touch items-center gap-3 p-4",
                "transition-colors duration-fast hover:bg-canvas",
              )}
            >
              <span className="shrink-0 text-ink-muted">{link.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-medium text-ink">
                  {link.label}
                </span>
                <span className="block text-caption text-ink-muted">
                  {link.body}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-ink-faint"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
