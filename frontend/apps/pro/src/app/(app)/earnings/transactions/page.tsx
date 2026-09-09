"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Gift, ReceiptText } from "lucide-react";
import { getProEarnings } from "@cfc/mocks";
import { CFC_COMMISSION_BPS, type ProEarning } from "@cfc/types";
import {
  Badge,
  DataTable,
  EmptyState,
  cn,
  formatCurrency,
  type Column,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 23 — transaction history.
 *
 * "Per-job payout records with full settlement breakdown", which in practice
 * means one question: *for this job, what did the customer pay, what did CFC
 * take, and what did I get?* Three columns, and a pro should be able to check
 * any row against their bank statement without doing arithmetic.
 *
 * ## Why every row shows the fee, including the zero ones
 *
 * A commission-free job could render with a blank fee column. It does not — it
 * shows ₹0 with the reason attached. A blank cell is indistinguishable from
 * missing data, and the one thing a pro must never wonder about their own
 * settlement is whether the screen simply failed to load part of it.
 *
 * ## The table is the desktop view and the cards are not a lesser version
 *
 * Same three figures either way. A settlement screen that drops the fee column
 * on a phone would be hiding exactly the number a pro is checking.
 */

export default function ProTransactionsPage() {
  const proId = React.useMemo(() => currentProId(), []);
  const [rows, setRows] = React.useState<ProEarning[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setRows(null);
    let cancelled = false;
    void getProEarnings(proId)
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

  const columns = React.useMemo<Column<ProEarning>[]>(
    () => [
      {
        id: "job",
        header: "Job",
        cell: (row) => (
          <span className="block min-w-0">
            <span className="block truncate text-ink">
              {formatDay(row.completedAt)}
            </span>
            <span className="block truncate text-caption text-ink-muted">
              {row.bookingId}
            </span>
          </span>
        ),
      },
      {
        id: "gross",
        header: "Job value",
        align: "right",
        tabular: true,
        cell: (row) => formatCurrency(row.grossPaise),
      },
      {
        id: "fee",
        header: "CFC fee",
        align: "right",
        tabular: true,
        // Zero is shown as ₹0 with its reason, never as a blank. A blank cell
        // is indistinguishable from data that failed to load.
        cell: (row) =>
          row.commissionFree ? (
            <span className="inline-flex items-center gap-1 text-live-ink">
              <Gift className="size-4 shrink-0" aria-hidden="true" />
              {formatCurrency(0)}
            </span>
          ) : (
            <span className="text-ink-muted">
              − {formatCurrency(row.cfcFeePaise)}
            </span>
          ),
      },
      {
        id: "net",
        header: "You earned",
        align: "right",
        tabular: true,
        cell: (row) => (
          <span className="font-semibold text-ink">
            {formatCurrency(row.netPaise)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <Link
        href="/earnings"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Earnings
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        Transaction history
      </h1>
      <p className="mt-1 text-small text-ink-muted">
        Every completed job, with what CFC took and what reached you. The CFC
        fee is {CFC_COMMISSION_BPS / 100}% of the job value.
      </p>

      <DataTable
        className="mt-4"
        columns={columns}
        rows={rows ?? []}
        rowKey={(row) => row.bookingId}
        caption="Transaction history"
        loading={rows === null && !failed}
        error={failed ? "Could not load your transactions." : null}
        onRetry={load}
        empty={
          <EmptyState
            icon={<ReceiptText />}
            title="No transactions yet"
            description="Once you complete a job, its settlement appears here."
          />
        }
        card={{
          title: (row) => (
            <span className="block truncate font-semibold text-ink">
              {formatDay(row.completedAt)}
            </span>
          ),
          badge: (row) =>
            row.commissionFree ? (
              <Badge tone="live">No fee</Badge>
            ) : undefined,
          lines: [
            (row) => (
              <span className="tabular">
                Job value {formatCurrency(row.grossPaise)}
              </span>
            ),
            (row) => (
              <span
                className={cn(
                  "tabular",
                  row.commissionFree && "text-live-ink",
                )}
              >
                {row.commissionFree
                  ? "CFC fee waived — one of your first 20 jobs"
                  : `CFC fee − ${formatCurrency(row.cfcFeePaise)}`}
              </span>
            ),
          ],
          trailing: (row) => (
            <span className="block text-right">
              <span className="block tabular text-body font-semibold text-ink">
                {formatCurrency(row.netPaise)}
              </span>
              <span className="block text-caption text-ink-muted">
                you earned
              </span>
            </span>
          ),
        }}
      />

      {/* Stated once, at the foot, where a pro reconciling against their bank
          will look for it. GST is not a deduction from them. */}
      {rows !== null && rows.length > 0 && (
        <p className="mt-4 text-caption text-ink-muted">
          GST (CGST 9% + SGST 9%) is charged to the customer on the CFC platform
          fee. It is not deducted from your earnings.
        </p>
      )}
    </div>
  );
}

/** "Mon 8 Sep, 3:40 pm" — enough to find the job in memory. */
function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })}, ${d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
