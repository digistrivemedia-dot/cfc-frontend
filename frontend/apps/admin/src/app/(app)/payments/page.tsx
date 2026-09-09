"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  CreditCard,
  Download,
  Receipt,
  Scale,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import {
  getGstReport,
  getRefunds,
  getRevenueSeries,
  getSettlements,
  getTransactions,
} from "@cfc/mocks";
import {
  REFUND_STATUSES,
  TRANSACTION_METHODS,
  TRANSACTION_METHOD_LABEL,
  TRANSACTION_STATUSES,
  type GstReportRow,
  type RefundStatus,
  type TransactionMethod,
  type RefundRequest,
  type RevenuePoint,
  type Settlement,
  type TransactionListItem,
  type TransactionStatus,
} from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  BarChart,
  Button,
  DataTable,
  DateRangePicker,
  DetailList,
  DetailRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FormField,
  InlineAlert,
  NoResultsState,
  PageHeader,
  Pagination,
  RefundStatusBadge,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TransactionStatusBadge,
  cn,
  downloadCsv,
  formatCurrency,
  formatCurrencyAxis,
  formatDate,
  formatSchedule,
  toCsv,
  toast,
  type CardLayout,
  type Column,
  type DateRange,
} from "@cfc/ui";

/**
 * Admin 30–34 — Payments & Finance.
 *
 * Nav restructure (approved plan, corrected during build): one sidebar item,
 * five tabs — Revenue is the landing tab, since the money question an operator
 * opens this section with is "how are we doing", not "show me row 4,812".
 *
 *  - Revenue (31)      — headline figures + trend chart.
 *  - Transactions (30) — every payment record, filterable.
 *  - Settlement (32)   — corrected from the plan: this was to be a drill-in
 *                        from a transaction row, but the actual built screen is
 *                        a cross-booking ledger (all settlements in one table,
 *                        no per-record detail view exists to drill into). Making
 *                        it a drill-in would mean inventing a detail screen the
 *                        doc never listed, so it keeps its own tab — the same
 *                        resolution already applied to Pro Management's Wallet
 *                        and Documents queues.
 *  - Refunds (33)      — requests awaiting a decision, 1-click refund.
 *  - GST Reports (34)  — monthly CGST/SGST totals, export for filing.
 */

const TAB_PARAM = "tab";
type PaymentsTab = "revenue" | "transactions" | "settlement" | "refunds" | "gst";

function PaymentsAndFinanceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get(TAB_PARAM) as PaymentsTab | null) ?? "revenue";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    router.push(`/payments?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments & finance"
        description="Revenue, payment records, settlements, refunds, and GST."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settlement">Settlement</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="gst">GST reports</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueTab />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
        <TabsContent value="settlement">
          <SettlementTab />
        </TabsContent>
        <TabsContent value="refunds">
          <RefundsTab />
        </TabsContent>
        <TabsContent value="gst">
          <GstTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Admin 31 — Revenue dashboard.
 *
 * Inventory: "Today / Weekly / Monthly revenue. Platform fee collected. GST
 * collected. Charts."
 *
 * Three figures, and only one of them is CFC's money. Gross revenue is what
 * passed through the platform; the platform fee is what CFC actually earned;
 * GST is money held on behalf of the government and owed out. Presenting them
 * as three equal tiles is how a founder reads gross as income, so the tiles
 * say which is which.
 */
function RevenueTab() {
  const [series, setSeries] = React.useState<RevenuePoint[] | null>(null);
  const [range, setRange] = React.useState<"today" | "7d" | "30d" | "all">("30d");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getRevenueSeries()
      .then(setSeries)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const points = React.useMemo(() => {
    if (!series) return [];
    if (range === "all") return series;
    // The series is one point per day, so "today" is simply its last entry.
    if (range === "today") return series.slice(-1);
    return series.slice(range === "7d" ? -7 : -30);
  }, [series, range]);

  const gross = points.reduce((s, p) => s + p.revenuePaise, 0);
  const fee = points.reduce((s, p) => s + p.platformFeePaise, 0);
  const gst = points.reduce((s, p) => s + p.gstPaise, 0);
  const proShare = gross - fee;

  // Trailing half against the leading half, so the delta is a real comparison
  // rather than one day against another.
  const half = Math.floor(points.length / 2);
  const recent = points.slice(half).reduce((s, p) => s + p.revenuePaise, 0);
  const earlier = points.slice(0, half).reduce((s, p) => s + p.revenuePaise, 0);
  // One data point has no earlier half to compare against.
  const trend =
    points.length > 1 && earlier > 0
      ? Math.round(((recent - earlier) / earlier) * 100)
      : 0;
  const showSpark = points.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Money that moved through the platform, and the part of it CFC keeps.
        </p>
        <div
          role="radiogroup"
          aria-label="Date range"
          className="grid grid-cols-4 gap-1 rounded-control bg-neutral-subtle p-1"
        >
          {(
            [
              ["today", "Today"],
              ["7d", "7 days"],
              ["30d", "30 days"],
              ["all", "All time"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={range === v}
              onClick={() => setRange(v)}
              className={cn(
                "rounded-pill px-3 py-1 text-caption transition-colors duration-fast",
                range === v
                  ? "bg-surface font-semibold text-ink shadow-sm"
                  : "font-medium text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross booking value"
          value={formatCurrency(gross)}
          loading={series === null}
          hint="everything customers paid"
          {...(trend !== 0
            ? {
                delta: {
                  value: `${Math.abs(trend)}%`,
                  direction: trend > 0 ? ("up" as const) : ("down" as const),
                  period: "vs. earlier in the period",
                },
                goodWhen: "up" as const,
              }
            : {})}
          {...(showSpark
            ? { series: points.map((p) => p.revenuePaise) }
            : {})}
        />
        <StatCard
          label="CFC earned"
          value={formatCurrency(fee)}
          loading={series === null}
          hint="platform fee — the actual revenue"
          {...(showSpark
            ? { series: points.map((p) => p.platformFeePaise) }
            : {})}
        />
        <StatCard
          label="GST collected"
          value={formatCurrency(gst)}
          loading={series === null}
          hint="held, owed to the government"
        />
        <StatCard
          label="Paid to pros"
          value={formatCurrency(proShare)}
          loading={series === null}
          hint="gross less the platform fee"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <header className="border-b border-border p-4">
          <h2 className="text-heading font-semibold text-ink">
            Revenue over time
          </h2>
          <p className="text-caption text-ink-muted">
            Gross booking value against the platform fee earned on it.
          </p>
        </header>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The revenue data could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !series ? (
          <div className="p-4">
            <Skeleton className="h-panel rounded-card" />
          </div>
        ) : (
          <div className="p-4">
            <BarChart
              data={points}
              xKey="label"
              series={[
                { key: "revenuePaise", label: "Gross booking value" },
                { key: "platformFeePaise", label: "CFC fee" },
              ]}
              formatValue={formatCurrency}
              formatAxisValue={formatCurrencyAxis}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Admin 30 — Transactions.
 *
 * Inventory: "All payment records, filters by method/status/date."
 *
 * Failures lead. A successful payment needs no attention; a failed one is a
 * customer who thinks they have booked and a pro who may already be travelling,
 * so the count sits at the top and the filter is one tap away.
 */
function TransactionsTab() {
  const [rows, setRows] = React.useState<TransactionListItem[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [status, setStatus] = React.useState<TransactionStatus | null>(null);
  const [method, setMethod] = React.useState<TransactionMethod | null>(null);
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => setPage(1), [status, method, range, search]);

  const load = React.useCallback(() => {
    setError(null);
    getTransactions({ status: status ?? "all", page, pageSize })
      .then((r) => {
        setRows(r.items);
        setTotal(r.total);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, [status, page, pageSize]);

  React.useEffect(() => load(), [load]);

  // Method, date and search are not server filters in the mock query yet.
  const visible = React.useMemo(() => {
    let items = rows ?? [];
    if (method) items = items.filter((t) => t.method === method);

    if (range?.from) {
      // The picker hands back whole local days, so a transaction at 11pm on the
      // closing day still falls inside the range.
      const from = range.from.getTime();
      const to = (range.to ?? range.from).getTime();
      items = items.filter((t) => {
        const at = new Date(t.createdAt).getTime();
        return at >= from && at <= to;
      });
    }

    const q = search.trim().toLowerCase();
    if (q)
      items = items.filter(
        (t) =>
          t.bookingRef.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q),
      );
    return items;
  }, [rows, method, range, search]);

  const failed = (rows ?? []).filter((t) => t.status === "failed");
  const activeFilters =
    (status ? 1 : 0) + (method ? 1 : 0) + (range?.from ? 1 : 0);
  const clearAll = () => {
    setStatus(null);
    setMethod(null);
    setRange(undefined);
    setSearch("");
  };

  const exportCsv = () => {
    setExporting(true);
    const csv = toCsv(visible, [
      { header: "Booking", value: (t) => t.bookingRef },
      { header: "Customer", value: (t) => t.customerName },
      { header: "Method", value: (t) => TRANSACTION_METHOD_LABEL[t.method] },
      { header: "Status", value: (t) => t.status },
      { header: "Amount (INR)", value: (t) => (t.amountPaise / 100).toFixed(2) },
      { header: "When", value: (t) => t.createdAt },
    ]);
    downloadCsv(
      `cfc-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
    );
    setExporting(false);
  };

  const columns: Column<TransactionListItem>[] = [
    {
      id: "ref",
      header: "Booking",
      tabular: true,
      skeletonWidth: "w-line-md",
      cell: (t) => <span className="font-medium text-ink">{t.bookingRef}</span>,
    },
    {
      id: "customer",
      header: "Customer",
      skeletonWidth: "w-line-lg",
      cell: (t) => <span className="text-ink">{t.customerName}</span>,
    },
    {
      id: "method",
      header: "Method",
      hideBelow: 780,
      skeletonWidth: "w-line-xs",
      cell: (t) => (
        <span className="text-ink-muted">
          {TRANSACTION_METHOD_LABEL[t.method]}
        </span>
      ),
    },
    {
      id: "when",
      header: "When",
      hideBelow: 1000,
      tabular: true,
      skeletonWidth: "w-line-md",
      cell: (t) => (
        <span className="text-ink-muted">{formatSchedule(t.createdAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: "w-line-sm",
      cell: (t) => <TransactionStatusBadge status={t.status} />,
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      tabular: true,
      skeletonWidth: "w-line-xs",
      cell: (t) => (
        <span className="font-medium text-ink">
          {formatCurrency(t.amountPaise)}
        </span>
      ),
    },
  ];

  const card: CardLayout<TransactionListItem> = {
    title: (t) => <span className="tabular">{t.bookingRef}</span>,
    badge: (t) => <TransactionStatusBadge status={t.status} />,
    lines: [
      (t) => t.customerName,
      (t) =>
        `${TRANSACTION_METHOD_LABEL[t.method]} · ${formatSchedule(t.createdAt)}`,
    ],
    trailing: (t) => (
      <span className="tabular">{formatCurrency(t.amountPaise)}</span>
    ),
  };

  return (
    <div className="space-y-4">
      {failed.length > 0 && status !== "failed" && (
        <InlineAlert
          tone="critical"
          title={`${failed.length} payment${failed.length === 1 ? "" : "s"} failed on this page`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatus("failed")}
            >
              Show only these
            </Button>
          }
        >
          The customer believes the booking is placed. Check before a pro
          travels.
        </InlineAlert>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by booking ID or customer"
          searchLabel="Search transactions"
          activeCount={activeFilters}
          onClearAll={clearAll}
          resultLabel={rows ? `${visible.length} of ${total}` : undefined}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCsv}
              loading={exporting}
              disabled={visible.length === 0}
            >
              <Download />
              Export
            </Button>
          }
        >
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as TransactionStatus | null)}
            allLabel="Any status"
            options={TRANSACTION_STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
          <FilterSelect
            label="Method"
            value={method}
            onChange={(v) => setMethod(v as TransactionMethod | null)}
            allLabel="Any method"
            options={TRANSACTION_METHODS.map((m) => ({
              value: m,
              label: TRANSACTION_METHOD_LABEL[m],
            }))}
          />
          <DateRangePicker value={range} onChange={setRange} />
        </FilterBar>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(t) => t.id}
          card={card}
          loading={rows === null}
          error={error}
          onRetry={load}
          caption="Payment records"
          selectionNoun="transaction"
          empty={
            activeFilters > 0 || search ? (
              <NoResultsState onClearFilters={clearAll} />
            ) : (
              <EmptyState
                icon={<CreditCard />}
                title="No payments yet"
                description="Every payment a customer makes appears here."
              />
            )
          }
        />

        {rows && total > pageSize && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="border-t border-border"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Admin 32 — Settlement.
 *
 * Inventory: "Per-booking internal settlement: Customer paid, Pro share, CFC
 * fee, GST breakdown."
 *
 * This is the only screen where the whole split is visible in one place, and it
 * is the one a finance person reconciles against a bank statement — so each row
 * expands to show the arithmetic rather than making them trust four columns
 * that happen to add up.
 *
 * GST arrives as basis points on the record, never as a literal here: the rate
 * is admin-editable and a hardcoded 9% would silently disagree with the
 * settlement the moment it changed.
 */
function SettlementTab() {
  const [rows, setRows] = React.useState<Settlement[] | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getSettlements()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const visible = React.useMemo(() => {
    const items = rows ?? [];
    const q = search.trim().toLowerCase();
    return q
      ? items.filter(
          (s) =>
            s.bookingRef.toLowerCase().includes(q) ||
            s.customerName.toLowerCase().includes(q) ||
            s.proName.toLowerCase().includes(q),
        )
      : items;
  }, [rows, search]);

  const totals = (rows ?? []).reduce(
    (acc, s) => ({
      paid: acc.paid + s.customerPaidPaise,
      fee: acc.fee + s.platformFeePaise,
      gst: acc.gst + s.gstPaise,
      pro: acc.pro + s.netToProPaise,
    }),
    { paid: 0, fee: 0, gst: 0, pro: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customers paid"
          value={formatCurrency(totals.paid)}
          loading={rows === null}
          hint={`${rows?.length ?? 0} settled bookings`}
        />
        <StatCard
          label="CFC fee"
          value={formatCurrency(totals.fee)}
          loading={rows === null}
          hint="before GST"
        />
        <StatCard
          label="GST on the fee"
          value={formatCurrency(totals.gst)}
          loading={rows === null}
          hint="CGST + SGST"
        />
        <StatCard
          label="Net to pros"
          value={formatCurrency(totals.pro)}
          loading={rows === null}
          hint="after the fee"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by booking, customer or pro"
          searchLabel="Search settlements"
          resultLabel={rows ? `${visible.length} of ${rows.length}` : undefined}
        />

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The settlements could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <CatalogueSkeleton />
        ) : visible.length === 0 ? (
          search ? (
            <NoResultsState onClearFilters={() => setSearch("")} />
          ) : (
            <EmptyState
              icon={<Scale />}
              title="Nothing settled yet"
              description="A booking settles once it is completed and paid."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {visible.map((s) => {
              const open = openId === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : s.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-ink-faint transition-transform duration-fast",
                        !open && "-rotate-90",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="tabular block text-small font-medium text-ink">
                        {s.bookingRef}
                      </span>
                      <span className="block truncate text-caption text-ink-muted">
                        {s.customerName} → {s.proName} ·{" "}
                        <span className="tabular">
                          {formatDate(s.settledAt)}
                        </span>
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-right">
                      <span className="block text-small font-semibold text-ink">
                        {formatCurrency(s.customerPaidPaise)}
                      </span>
                      <span className="block text-caption text-ink-faint">
                        paid
                      </span>
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-border-soft bg-canvas px-4 py-3">
                      <DetailList>
                        <DetailRow
                          label="Customer paid"
                          value={formatCurrency(s.customerPaidPaise)}
                          tabular
                        />
                        <DetailRow
                          label="CFC platform fee"
                          value={`− ${formatCurrency(s.platformFeePaise)}`}
                          tabular
                        />
                        <DetailRow
                          label={`CGST ${s.cgstBps / 100}%`}
                          value={formatCurrency(
                            Math.round(
                              (s.gstPaise * s.cgstBps) / (s.cgstBps + s.sgstBps),
                            ),
                          )}
                          tabular
                        />
                        <DetailRow
                          label={`SGST ${s.sgstBps / 100}%`}
                          value={formatCurrency(
                            Math.round(
                              (s.gstPaise * s.sgstBps) / (s.cgstBps + s.sgstBps),
                            ),
                          )}
                          tabular
                        />
                        <DetailRow
                          label="Pro share"
                          value={formatCurrency(s.proSharePaise)}
                          tabular
                        />
                      </DetailList>
                      <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                        <span className="text-small font-semibold text-ink">
                          Net credited to {s.proName}
                        </span>
                        <span className="tabular text-heading font-semibold text-ink">
                          {formatCurrency(s.netToProPaise)}
                        </span>
                      </div>
                      <p className="mt-2 text-caption text-ink-muted">
                        GST applies to the platform fee only, never to the
                        pro&apos;s professional fee.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Admin 33 — Refund management.
 *
 * Inventory: "Refund requests, approve/reject, 1-click Razorpay refund."
 *
 * Approving a refund moves real money out, so the confirmation names the amount
 * and the customer rather than asking "are you sure". Rejecting needs a reason
 * because the customer is told one.
 */
const REJECT_REASONS = [
  "Work was completed as described and verified with photos.",
  "Request received outside the refund window.",
  "Customer was not present at the scheduled time.",
  "Dispute resolved by rework rather than a refund.",
];

function RefundsTab() {
  const [rows, setRows] = React.useState<RefundRequest[] | null>(null);
  const [status, setStatus] = React.useState<RefundStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getRefunds()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const decide = (r: RefundRequest, next: RefundStatus) => {
    setRows(
      (rs) => rs?.map((x) => (x.id === r.id ? { ...x, status: next } : x)) ?? rs,
    );
    toast.success(
      next === "approved"
        ? `${formatCurrency(r.amountPaise)} refunded to ${r.customerName}`
        : `Refund for ${r.bookingRef} rejected`,
    );
  };

  const visible = status
    ? (rows ?? []).filter((r) => r.status === status)
    : (rows ?? []);
  const requested = (rows ?? []).filter((r) => r.status === "requested");
  const owed = requested.reduce((s, r) => s + r.amountPaise, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Awaiting a decision"
          value={requested.length}
          loading={rows === null}
          hint={formatCurrency(owed)}
        />
        <StatCard
          label="Refunded"
          value={(rows ?? []).filter((r) => r.status === "paid").length}
          loading={rows === null}
          hint="money returned"
        />
        <StatCard
          label="Rejected"
          value={(rows ?? []).filter((r) => r.status === "rejected").length}
          loading={rows === null}
          hint="with a reason given"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          activeCount={status ? 1 : 0}
          onClearAll={() => setStatus(null)}
          resultLabel={rows ? `${visible.length} of ${rows.length}` : undefined}
        >
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as RefundStatus | null)}
            allLabel="All requests"
            options={REFUND_STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
        </FilterBar>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The refunds could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <CatalogueSkeleton />
        ) : visible.length === 0 ? (
          status ? (
            <NoResultsState onClearFilters={() => setStatus(null)} />
          ) : (
            <EmptyState
              icon={<Undo2 />}
              title="No refund requests"
              description="Customers raise these from a completed booking in the app."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {visible.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start gap-3 p-4 transition-colors duration-fast hover:bg-canvas"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="tabular text-small font-medium text-ink">
                      {r.bookingRef}
                    </span>
                    <RefundStatusBadge status={r.status} />
                  </span>
                  <span className="mt-px block text-small text-ink">
                    {r.reason}
                  </span>
                  <span className="tabular mt-px block text-caption text-ink-muted">
                    {r.customerName} · {formatDate(r.requestedAt)}
                  </span>
                </span>

                <span className="tabular w-amount shrink-0 text-right text-body font-semibold text-ink">
                  {formatCurrency(r.amountPaise)}
                </span>

                {r.status === "requested" && (
                  <span className="flex w-full gap-2 sm:w-auto">
                    <RejectRefundDialog refund={r} onDecide={decide} />
                    <ApproveRefundDialog refund={r} onDecide={decide} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ApproveRefundDialog({
  refund,
  onDecide,
}: {
  refund: RefundRequest;
  onDecide: (r: RefundRequest, next: RefundStatus) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
          <Check />
          Refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Refund {formatCurrency(refund.amountPaise)} to{" "}
            {refund.customerName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The money goes back to the original payment method through Razorpay
            and usually lands within five working days. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="primary"
            onClick={() => onDecide(refund, "paid")}
          >
            Refund {formatCurrency(refund.amountPaise)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RejectRefundDialog({
  refund,
  onDecide,
}: {
  refund: RefundRequest;
  onDecide: (r: RefundRequest, next: RefundStatus) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
          <X />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this refund?</DialogTitle>
          <DialogDescription>
            {refund.customerName} is told the reason, so it has to make sense to
            them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-left text-caption",
                  "transition-colors duration-fast",
                  reason === r
                    ? "border-action bg-action-subtle text-action-press"
                    : "border-border-strong text-ink-muted hover:bg-canvas",
                )}
              >
                {r.replace(/\.$/, "")}
              </button>
            ))}
          </div>
          <FormField label="Reason" required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was checked, and why the refund is refused"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            variant="critical"
            disabled={reason.trim() === ""}
            onClick={() => {
              onDecide(refund, "rejected");
              setOpen(false);
            }}
          >
            Reject the refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin 34 — GST reports.
 *
 * Inventory: "Monthly GST collected — CGST, SGST, total. Export for filing."
 *
 * Built for one job: filing a return. The export is the primary action, the
 * months read newest first, and the total row is what goes on the form — so
 * everything is arranged around getting a number onto a government portal
 * without retyping it.
 */
function GstTab() {
  const [rows, setRows] = React.useState<GstReportRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const load = React.useCallback(() => {
    setError(null);
    getGstReport()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const totals = (rows ?? []).reduce(
    (a, r) => ({
      cgst: a.cgst + r.cgstPaise,
      sgst: a.sgst + r.sgstPaise,
      total: a.total + r.totalPaise,
      bookings: a.bookings + r.bookingCount,
    }),
    { cgst: 0, sgst: 0, total: 0, bookings: 0 },
  );

  const exportCsv = () => {
    if (!rows) return;
    setExporting(true);
    const csv = toCsv(rows, [
      { header: "Month", value: (r) => r.month },
      { header: "Bookings", value: (r) => String(r.bookingCount) },
      { header: "CGST (INR)", value: (r) => (r.cgstPaise / 100).toFixed(2) },
      { header: "SGST (INR)", value: (r) => (r.sgstPaise / 100).toFixed(2) },
      { header: "Total GST (INR)", value: (r) => (r.totalPaise / 100).toFixed(2) },
    ]);
    downloadCsv(`cfc-gst-${new Date().toISOString().slice(0, 7)}.csv`, csv);
    setExporting(false);
  };

  const latest = rows?.[0];

  return (
    <div className="space-y-4">
      <InlineAlert title="GST is charged on the platform fee only">
        CGST 9% and SGST 9% apply to CFC&apos;s fee, never to the pro&apos;s
        professional fee. These figures are what goes on the monthly return.
      </InlineAlert>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={latest ? `${latest.month} — CGST` : "CGST"}
          value={formatCurrency(latest?.cgstPaise ?? 0)}
          loading={rows === null}
          hint="central"
        />
        <StatCard
          label={latest ? `${latest.month} — SGST` : "SGST"}
          value={formatCurrency(latest?.sgstPaise ?? 0)}
          loading={rows === null}
          hint="state"
        />
        <StatCard
          label={latest ? `${latest.month} — total` : "Total"}
          value={formatCurrency(latest?.totalPaise ?? 0)}
          loading={rows === null}
          hint={`across ${latest?.bookingCount ?? 0} bookings`}
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-heading font-semibold text-ink">
              Month by month
            </h2>
            <p className="text-caption text-ink-muted">
              Newest first. Export for the return.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={exportCsv}
            loading={exporting}
            disabled={!rows || rows.length === 0}
          >
            <Download />
            Export for filing
          </Button>
        </header>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The GST report could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <CatalogueSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="Nothing to report yet"
            description="GST appears here once bookings have been completed and settled."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Monthly GST collected</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-canvas">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">CGST 9%</TableHead>
                  <TableHead className="text-right">SGST 9%</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.month}>
                    <TableCell className="font-medium">{r.month}</TableCell>
                    <TableCell className="tabular text-right text-ink-muted">
                      {r.bookingCount}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatCurrency(r.cgstPaise)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatCurrency(r.sgstPaise)}
                    </TableCell>
                    <TableCell className="tabular text-right font-semibold">
                      {formatCurrency(r.totalPaise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-canvas">
                  <TableCell>All months</TableCell>
                  <TableCell className="tabular text-right">
                    {totals.bookings}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCurrency(totals.cgst)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCurrency(totals.sgst)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCurrency(totals.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Shared loading shape for the finance lists. */
function CatalogueSkeleton() {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-line-lg" />
            <Skeleton className="h-3 w-full max-w-line-2xl" />
          </div>
          <Skeleton className="h-6 w-line-xs" />
        </div>
      ))}
    </div>
  );
}








export default function PaymentsAndFinancePage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <PaymentsAndFinanceInner />
    </Suspense>
  );
}
