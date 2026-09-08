"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, MapPin, Star, TriangleAlert } from "lucide-react";
import {
  getActiveUsers,
  getBookingsSeries,
  getCustomerGrowth,
  getPeakHours,
  getProPerformance,
  getRatingTrend,
  getRevenueByArea,
  getRevenueByCategory,
  getRevenueSeries,
  getServiceDemand,
} from "@cfc/mocks";
import type {
  ActiveUsersPoint,
  BookingsPoint,
  CustomerGrowthPoint,
  PeakHourRow,
  ProPerformanceRow,
  RatingTrendPoint,
  RevenueBreakdownRow,
  RevenuePoint,
  ServiceDemandRow,
} from "@cfc/types";
import {
  BarChart,
  Button,
  ChartFrame,
  DataTable,
  DateRangePicker,
  EmptyState,
  ErrorState,
  InlineAlert,
  LineChart,
  NoResultsState,
  PageHeader,
  Skeleton,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  downloadCsv,
  formatCurrency,
  formatCurrencyAxis,
  toCsv,
  type CardLayout,
  type Column,
  type CsvColumn,
  type DateRange,
} from "@cfc/ui";

/**
 * Admin 38–42 — Reports and analytics.
 *
 * Inventory 38: "Revenue by date/category/area, charts, Excel export."
 * 39: "Volume, completion rate, cancellation analysis, peak hours."
 * 40: "Job completion rates, ratings trends, top earners, no-show count."
 * 41: "Which services are booked most, which areas have highest demand."
 * 42: "New signups, retention, repeat booking rate, MAU/DAU."
 *
 * Every report answers a question and then says what the answer means. A chart
 * with no reading is a picture someone has to interpret, and an operations
 * report that leaves interpretation to the reader is a report nobody uses
 * twice — so each tab leads with the figures, then the chart, then the detail.
 *
 * Export is on every tab because the client asked for it on 38 and the same
 * need applies to all five: these numbers end up in a spreadsheet or a
 * WhatsApp message either way.
 */
const TAB_PARAM = "tab";
type ReportsTab = "revenue" | "bookings" | "pros" | "demand" | "customers";

function ReportsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get(TAB_PARAM) as ReportsTab | null) ?? "revenue";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="How the platform is performing, and where it is not."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="pros">Pro performance</TabsTrigger>
          <TabsTrigger value="demand">Service demand</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueReport />
        </TabsContent>
        <TabsContent value="bookings">
          <BookingsReport />
        </TabsContent>
        <TabsContent value="pros">
          <ProPerformanceReport />
        </TabsContent>
        <TabsContent value="demand">
          <ServiceDemandReport />
        </TabsContent>
        <TabsContent value="customers">
          <CustomerReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** One frame for every report, so the five read as one screen. */
function ReportSection({
  title,
  note,
  onExport,
  exportDisabled,
  controls,
  children,
}: {
  title: string;
  note: string;
  onExport: () => void;
  exportDisabled: boolean;
  /** Sits between the heading and Export - a cut switch, a date range. */
  controls?: React.ReactNode | undefined;
  children: React.ReactNode;
}) {
  const [exporting, setExporting] = React.useState(false);

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="text-heading font-semibold text-ink">{title}</h2>
          <p className="text-caption text-ink-muted">{note}</p>
        </div>
        {controls}
        <Button
          variant="secondary"
          size="sm"
          loading={exporting}
          disabled={exportDisabled}
          onClick={() => {
            setExporting(true);
            onExport();
            setExporting(false);
          }}
        >
          <Download />
          Export
        </Button>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function useReport<T>(fetcher: () => Promise<T[]>) {
  const [rows, setRows] = React.useState<T[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    fetcher()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
    // The fetcher is a stable import; re-running on identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => load(), [load]);
  return { rows, error, reload: load };
}

function exportRows<T>(name: string, rows: T[], columns: CsvColumn<T>[]) {
  const csv = toCsv(rows, columns);
  downloadCsv(`cfc-${name}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

function ReportError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      icon={<TriangleAlert />}
      title="This report could not load"
      description="The connection may have dropped. Try again."
      action={{ label: "Try again", onClick: onRetry }}
    />
  );
}

// -- Admin 38: revenue -------------------------------------------------------

type RevenueCut = "category" | "area";

const REVENUE_CUTS = [
  { value: "category" as const, label: "By category" },
  { value: "area" as const, label: "By area" },
];

/**
 * Each cut carries its own reading. The chart is the same shape either way;
 * what changes is what a lopsided bar is telling you to do about it.
 */
const CUT_COPY: Record<
  RevenueCut,
  { note: string; noun: string; column: string; exportName: string }
> = {
  category: {
    note: "Which parts of the catalogue earn. A category with volume but little revenue is priced too low.",
    noun: "category",
    column: "Category",
    exportName: "revenue-by-category",
  },
  area: {
    note: "Where the money is. Compare against pro coverage before opening a new area.",
    noun: "area",
    column: "Area",
    exportName: "revenue-by-area",
  },
};

function RevenueReport() {
  const { rows: all, error, reload } = useReport<RevenuePoint>(getRevenueSeries);
  const byCategory = useReport<RevenueBreakdownRow>(getRevenueByCategory);
  const byArea = useReport<RevenueBreakdownRow>(getRevenueByArea);
  // Category and area answer the same question two ways, so they share one
  // block and a switch rather than stacking two near-identical sections.
  const [cut, setCut] = React.useState<RevenueCut>("category");
  const [range, setRange] = React.useState<DateRange | undefined>();

  // The series carries a formatted label rather than a timestamp, so the date
  // filter maps back onto position: the points are consecutive days ending
  // today, which is what the fixture and the real endpoint both produce.
  const rows = React.useMemo(() => {
    if (!all || !range?.from) return all;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const from = range.from.getTime();
    const to = (range.to ?? range.from).getTime();
    return all.filter((_, i) => {
      const at = today.getTime() - (all.length - 1 - i) * 86_400_000;
      return at >= from && at <= to;
    });
  }, [all, range]);

  const gross = (rows ?? []).reduce((s, r) => s + r.revenuePaise, 0);
  const fee = (rows ?? []).reduce((s, r) => s + r.platformFeePaise, 0);
  const days = rows?.length ?? 0;
  const takeRate = gross > 0 ? ((fee / gross) * 100).toFixed(1) : "0";
  const best = (rows ?? []).reduce<RevenuePoint | null>(
    (m, r) => (m === null || r.revenuePaise > m.revenuePaise ? r : m),
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Revenue by date, then split by category and by area.
        </p>
        <DateRangePicker
          value={range}
          onChange={setRange}
          placeholder="All dates"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross booking value"
          value={formatCurrency(gross)}
          loading={rows === null}
          hint={`across ${days} days`}
        />
        <StatCard
          label="CFC earned"
          value={formatCurrency(fee)}
          loading={rows === null}
          hint={`${takeRate}% take rate`}
        />
        <StatCard
          label="Daily average"
          value={formatCurrency(days > 0 ? Math.round(gross / days) : 0)}
          loading={rows === null}
          hint="gross per day"
        />
        <StatCard
          label="Best day"
          value={best ? formatCurrency(best.revenuePaise) : "—"}
          loading={rows === null}
          hint={best?.label ?? ""}
        />
      </div>

      <ReportSection
        title="Revenue by day"
        note="Gross booking value against the platform fee earned on it."
        exportDisabled={!rows || rows.length === 0}
        onExport={() =>
          exportRows("revenue", rows ?? [], [
            { header: "Day", value: (r) => r.label },
            { header: "Gross (INR)", value: (r) => (r.revenuePaise / 100).toFixed(2) },
            { header: "Platform fee (INR)", value: (r) => (r.platformFeePaise / 100).toFixed(2) },
            { header: "GST (INR)", value: (r) => (r.gstPaise / 100).toFixed(2) },
          ])
        }
      >
        {error ? (
          <ReportError onRetry={reload} />
        ) : !rows ? (
          <Skeleton className="h-panel rounded-card" />
        ) : rows.length === 0 ? (
          /* A range with no days in it. An empty axis looks like a bug; this
             says what happened and offers the way back. */
          <NoResultsState
            title="No revenue in this range"
            description="No bookings were completed on those dates."
            onClearFilters={() => setRange(undefined)}
          />
        ) : (
          <ChartFrame
            summary={`Revenue by day over ${days} days. Gross ${formatCurrency(gross)}, of which CFC earned ${formatCurrency(fee)}.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "revenuePaise", label: "Gross" },
              { key: "platformFeePaise", label: "Platform fee" },
              { key: "gstPaise", label: "GST" },
            ]}
            formatValue={formatCurrency}
          >
            <BarChart
              data={rows}
              xKey="label"
              series={[
                { key: "revenuePaise", label: "Gross" },
                { key: "platformFeePaise", label: "CFC fee" },
              ]}
              formatValue={formatCurrency}
              formatAxisValue={formatCurrencyAxis}
            />
          </ChartFrame>
        )}
      </ReportSection>

      <RevenueBreakdown
        cut={cut}
        onCutChange={setCut}
        state={cut === "category" ? byCategory : byArea}
        rangeActive={range?.from !== undefined}
      />
    </div>
  );
}

/**
 * A segmented switch for choosing which cut of the same data to show.
 *
 * Not `Tabs`: those are underline-style and already claim the top of this
 * screen, so a second underline bar inside a tab panel reads as a nesting
 * error. A filled segment says something different and more accurate - one
 * dataset, several ways to slice it - and it is the control every analytics
 * product uses for exactly this.
 */
function CutSwitch<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-control border border-border bg-canvas p-px"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-control px-3 py-1 text-small font-medium",
              "transition-colors duration-fast",
              selected
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * One revenue split — by category or by area.
 *
 * Both answer the same shape of question, so they are one component rather than
 * two near-identical blocks that drift apart.
 */
function RevenueBreakdown({
  cut,
  onCutChange,
  state,
  rangeActive,
}: {
  cut: RevenueCut;
  onCutChange: (next: RevenueCut) => void;
  /**
   * Whether a date range is set on the day series above.
   *
   * The split is all-time: the endpoint returns totals with no date dimension.
   * Left unsaid, an all-time split sitting under a "Last 7 days" header reads
   * as filtered and the two figures silently contradict each other - so when a
   * range is active the section says which scope it is on.
   */
  rangeActive: boolean;
  state: {
    rows: RevenueBreakdownRow[] | null;
    error: string | null;
    reload: () => void;
  };
}) {
  const { rows, error, reload } = state;
  const total = (rows ?? []).reduce((s, r) => s + r.revenuePaise, 0);
  const top = rows?.[0];
  const copy = CUT_COPY[cut];

  return (
    <ReportSection
      title="Revenue split"
      note={
        rangeActive
          ? `${copy.note} Covers all time, not the date range above.`
          : copy.note
      }
      controls={
        <CutSwitch
          value={cut}
          onChange={onCutChange}
          label="Split revenue by"
          options={REVENUE_CUTS}
        />
      }
      exportDisabled={!rows || rows.length === 0}
      onExport={() =>
        exportRows(copy.exportName, rows ?? [], [
          { header: copy.column, value: (r) => r.label },
          { header: "Bookings", value: (r) => String(r.bookingCount) },
          { header: "Revenue (INR)", value: (r) => (r.revenuePaise / 100).toFixed(2) },
          { header: "Platform fee (INR)", value: (r) => (r.platformFeePaise / 100).toFixed(2) },
        ])
      }
    >
      {error ? (
        <ReportError onRetry={reload} />
      ) : !rows ? (
        <Skeleton className="h-panel rounded-card" />
      ) : rows.length === 0 ? (
        <EmptyState title={`No revenue by ${copy.noun} yet`} />
      ) : (
        <div className="space-y-4">
          <ChartFrame
            summary={`Revenue by ${copy.noun}. ${top?.label ?? "None"} leads with ${formatCurrency(top?.revenuePaise ?? 0)} of ${formatCurrency(total)}.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "revenuePaise", label: "Revenue" },
              { key: "platformFeePaise", label: "Platform fee" },
            ]}
            formatValue={formatCurrency}
          >
            <BarChart
              data={rows}
              xKey="label"
              series={[{ key: "revenuePaise", label: "Revenue" }]}
              formatValue={formatCurrency}
              formatAxisValue={formatCurrencyAxis}
            />
          </ChartFrame>

          {/* The share is the reading; the chart only shows the ranking. */}
          <ul className="divide-y divide-border-soft">
            {rows.map((r) => (
              <li
                key={r.label}
                className="flex items-center gap-3 py-2 text-small"
              >
                <span className="min-w-0 flex-1 truncate text-ink">
                  {r.label}
                </span>
                <span className="tabular w-line-xs text-right text-ink-muted">
                  {r.bookingCount} jobs
                </span>
                <span className="tabular w-line-xs text-right text-ink-faint">
                  {total > 0 ? Math.round((r.revenuePaise / total) * 100) : 0}%
                </span>
                <span className="tabular w-amount text-right font-medium text-ink">
                  {formatCurrency(r.revenuePaise)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ReportSection>
  );
}

// -- Admin 39: bookings ------------------------------------------------------

function BookingsReport() {
  const { rows, error, reload } = useReport<BookingsPoint>(getBookingsSeries);
  const hours = useReport<PeakHourRow>(getPeakHours);

  const completed = (rows ?? []).reduce((s, r) => s + r.completed, 0);
  const cancelled = (rows ?? []).reduce((s, r) => s + r.cancelled, 0);
  const total = completed + cancelled;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // The worst day is what an operations lead follows up on.
  const worst = (rows ?? []).reduce<BookingsPoint | null>((m, r) => {
    const rate = r.completed + r.cancelled;
    if (rate === 0) return m;
    const cancelShare = r.cancelled / rate;
    const mShare = m ? m.cancelled / (m.completed + m.cancelled) : -1;
    return cancelShare > mShare ? r : m;
  }, null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bookings"
          value={total}
          loading={rows === null}
          hint="completed and cancelled"
        />
        <StatCard
          label="Completion rate"
          value={`${completionRate}%`}
          loading={rows === null}
          hint={completionRate >= 90 ? "healthy" : "below target"}
          goodWhen="up"
        />
        <StatCard
          label="Cancelled"
          value={cancelled}
          loading={rows === null}
          hint={`${total > 0 ? Math.round((cancelled / total) * 100) : 0}% of all bookings`}
          goodWhen="down"
        />
        <StatCard
          label="Worst day"
          value={worst?.label ?? "—"}
          loading={rows === null}
          hint={
            worst
              ? `${worst.cancelled} of ${worst.completed + worst.cancelled} cancelled`
              : ""
          }
        />
      </div>

      <ReportSection
        title="Completed against cancelled"
        note="A rising cancellation share usually means assignment is failing, not demand."
        exportDisabled={!rows || rows.length === 0}
        onExport={() =>
          exportRows("bookings", rows ?? [], [
            { header: "Day", value: (r) => r.label },
            { header: "Completed", value: (r) => String(r.completed) },
            { header: "Cancelled", value: (r) => String(r.cancelled) },
          ])
        }
      >
        {error ? (
          <ReportError onRetry={reload} />
        ) : !rows ? (
          <Skeleton className="h-panel rounded-card" />
        ) : (
          <ChartFrame
            summary={`Bookings by day. ${completed} completed and ${cancelled} cancelled, a ${completionRate}% completion rate.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "completed", label: "Completed" },
              { key: "cancelled", label: "Cancelled" },
            ]}
          >
            <BarChart
              data={rows}
              xKey="label"
              stacked
              series={[
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" },
              ]}
            />
          </ChartFrame>
        )}
      </ReportSection>

      <PeakHoursSection state={hours} />
    </div>
  );
}

/**
 * Admin 39 - peak hours.
 *
 * This is a staffing question, not a curiosity. Knowing when demand lands is
 * what a 7pm auto-assign failure is actually about, so the reading names the
 * busiest window rather than leaving it to be eyeballed off the chart. A
 * single peak hour is too narrow to staff to; a three-hour block is what a
 * shift is planned around.
 */
function PeakHoursSection({
  state,
}: {
  state: {
    rows: PeakHourRow[] | null;
    error: string | null;
    reload: () => void;
  };
}) {
  const { rows, error, reload } = state;

  const peak = (rows ?? []).reduce<PeakHourRow | null>(
    (best, r) => (best === null || r.bookingCount > best.bookingCount ? r : best),
    null,
  );
  const total = (rows ?? []).reduce((sum, r) => sum + r.bookingCount, 0);

  const window = React.useMemo(() => {
    if (rows === null || rows.length < 3) return null;
    let bestStart = 0;
    let bestCount = 0;
    for (let i = 0; i <= rows.length - 3; i++) {
      const sum =
        (rows[i]?.bookingCount ?? 0) +
        (rows[i + 1]?.bookingCount ?? 0) +
        (rows[i + 2]?.bookingCount ?? 0);
      if (sum > bestCount) {
        bestCount = sum;
        bestStart = i;
      }
    }
    const from = rows[bestStart];
    const to = rows[bestStart + 2];
    if (!from || !to) return null;
    return { from, to, count: bestCount };
  }, [rows]);

  return (
    <ReportSection
      title="Peak hours"
      note="When customers book. Pros need to be online through the busiest window, not spread evenly across the day."
      exportDisabled={rows === null || rows.length === 0}
      onExport={() =>
        exportRows("peak-hours", rows ?? [], [
          { header: "Hour", value: (r) => r.label },
          { header: "Bookings", value: (r) => String(r.bookingCount) },
        ])
      }
    >
      {error ? (
        <ReportError onRetry={reload} />
      ) : rows === null ? (
        <Skeleton className="h-block-md rounded-card" />
      ) : (
        <div className="space-y-4">
          {window && (
            <InlineAlert
              tone="info"
              title={`Busiest window is ${window.from.label} to ${window.to.label}`}
            >
              {window.count} of {total} bookings land in those three hours
              {total > 0
                ? ` - ${Math.round((window.count / total) * 100)}% of the day`
                : ""}
              . Staff the roster around it.
            </InlineAlert>
          )}

          <ChartFrame
            summary={`Bookings by hour of day. The peak is ${peak?.label ?? "unknown"} with ${peak?.bookingCount ?? 0} bookings.`}
            data={rows}
            xKey="label"
            columns={[{ key: "bookingCount", label: "Bookings" }]}
          >
            <BarChart
              data={rows}
              xKey="label"
              series={[{ key: "bookingCount", label: "Bookings" }]}
            />
          </ChartFrame>
        </div>
      )}
    </ReportSection>
  );
}

// -- Admin 40: pro performance -----------------------------------------------

function ProPerformanceReport() {
  const { rows, error, reload } = useReport<ProPerformanceRow>(getProPerformance);
  const ratings = useReport<RatingTrendPoint>(getRatingTrend);

  const sorted = React.useMemo(
    () => [...(rows ?? [])].sort((a, b) => b.earnedPaise - a.earnedPaise),
    [rows],
  );

  const avgCompletion =
    sorted.length > 0
      ? Math.round(
          sorted.reduce((s, r) => s + r.completionRateBps, 0) /
            sorted.length /
            100,
        )
      : 0;
  const noShows = sorted.reduce((s, r) => s + r.noShowCount, 0);
  // The agreement auto-blocks below 2.5, so anyone near it is worth naming.
  const atRisk = sorted.filter((r) => r.avgRating > 0 && r.avgRating < 3);

  const columns: Column<ProPerformanceRow>[] = [
    {
      id: "pro",
      header: "Pro",
      skeletonWidth: "w-line-lg",
      cell: (r) => <span className="font-medium text-ink">{r.proName}</span>,
    },
    {
      id: "jobs",
      header: "Jobs",
      align: "right",
      tabular: true,
      skeletonWidth: "w-line-xs",
      cell: (r) => <span className="text-ink">{r.jobsCompleted}</span>,
    },
    {
      id: "completion",
      header: "Completion",
      align: "right",
      tabular: true,
      hideBelow: 780,
      skeletonWidth: "w-line-xs",
      cell: (r) => (
        <span
          className={cn(
            r.completionRateBps < 9000 ? "text-clock-ink" : "text-ink",
          )}
        >
          {(r.completionRateBps / 100).toFixed(0)}%
        </span>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      align: "right",
      tabular: true,
      skeletonWidth: "w-line-xs",
      cell: (r) =>
        r.avgRating > 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              r.avgRating < 3 ? "text-critical-ink" : "text-ink",
            )}
          >
            <Star className="size-3 fill-star text-star" aria-hidden="true" />
            {r.avgRating.toFixed(1)}
          </span>
        ) : (
          <span className="text-ink-faint">New</span>
        ),
    },
    {
      id: "noshow",
      header: "No-shows",
      align: "right",
      tabular: true,
      hideBelow: 1000,
      skeletonWidth: "w-line-xs",
      cell: (r) => (
        <span className={r.noShowCount > 0 ? "text-critical-ink" : "text-ink-muted"}>
          {r.noShowCount}
        </span>
      ),
    },
    {
      id: "earned",
      header: "Earned",
      align: "right",
      tabular: true,
      skeletonWidth: "w-line-sm",
      cell: (r) => (
        <span className="font-medium text-ink">
          {formatCurrency(r.earnedPaise)}
        </span>
      ),
    },
  ];

  const card: CardLayout<ProPerformanceRow> = {
    title: (r) => r.proName,
    lines: [
      (r) => `${r.jobsCompleted} jobs · ${(r.completionRateBps / 100).toFixed(0)}% completion`,
      (r) =>
        r.avgRating > 0
          ? `★ ${r.avgRating.toFixed(1)} · ${r.noShowCount} no-shows`
          : "New pro",
    ],
    trailing: (r) => (
      <span className="tabular">{formatCurrency(r.earnedPaise)}</span>
    ),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Average completion"
          value={`${avgCompletion}%`}
          loading={rows === null}
          hint="jobs accepted then finished"
          goodWhen="up"
        />
        <StatCard
          label="No-shows"
          value={noShows}
          loading={rows === null}
          hint="across every pro"
          goodWhen="down"
        />
        <StatCard
          label="Below 3 stars"
          value={atRisk.length}
          loading={rows === null}
          hint="auto-block applies under 2.5"
          goodWhen="down"
        />
      </div>

      <ReportSection
        title="Top earners"
        note="Sorted by what each pro earned. Completion and no-shows say whether that is sustainable."
        exportDisabled={sorted.length === 0}
        onExport={() =>
          exportRows("pro-performance", sorted, [
            { header: "Pro", value: (r) => r.proName },
            { header: "Jobs completed", value: (r) => String(r.jobsCompleted) },
            { header: "Completion %", value: (r) => (r.completionRateBps / 100).toFixed(1) },
            { header: "Rating", value: (r) => r.avgRating.toFixed(1) },
            { header: "No-shows", value: (r) => String(r.noShowCount) },
            { header: "Earned (INR)", value: (r) => (r.earnedPaise / 100).toFixed(2) },
          ])
        }
      >
        <DataTable
          columns={columns}
          rows={sorted}
          rowKey={(r) => r.proName}
          card={card}
          loading={rows === null}
          error={error}
          onRetry={reload}
          caption="Pro performance"
          selectionNoun="pro"
          empty={
            <EmptyState
              icon={<Star />}
              title="No performance data yet"
              description="Figures appear once pros start completing jobs."
            />
          }
        />
      </ReportSection>

      <RatingTrendSection state={ratings} />
    </div>
  );
}

/**
 * Admin 40 - ratings trend.
 *
 * A current average hides direction. A platform at 4.3 and falling is a
 * different situation from one at 4.3 and climbing, and only the second is
 * fine - so the trend gets its own section rather than being a number on a
 * tile. The delta on the first card is the whole point of the section.
 */
function RatingTrendSection({
  state,
}: {
  state: {
    rows: RatingTrendPoint[] | null;
    error: string | null;
    reload: () => void;
  };
}) {
  const { rows, error, reload } = state;
  const first = rows?.[0];
  const last = rows && rows.length > 0 ? rows[rows.length - 1] : undefined;
  const shift =
    first && last ? Number((last.avgRating - first.avgRating).toFixed(2)) : 0;
  const totalRatings = (rows ?? []).reduce((sum, r) => sum + r.ratingCount, 0);

  return (
    <ReportSection
      title="Ratings over time"
      note="The direction matters more than the number. A falling average shows up here before it shows up in churn."
      exportDisabled={rows === null || rows.length === 0}
      onExport={() =>
        exportRows("rating-trend", rows ?? [], [
          { header: "Period", value: (r) => r.label },
          { header: "Average rating", value: (r) => r.avgRating.toFixed(2) },
          { header: "Ratings", value: (r) => String(r.ratingCount) },
        ])
      }
    >
      {error ? (
        <ReportError onRetry={reload} />
      ) : rows === null ? (
        <Skeleton className="h-block-md rounded-card" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Average now"
              value={last ? last.avgRating.toFixed(2) : "-"}
              hint={`across ${totalRatings} ratings`}
              goodWhen="up"
              {...(shift !== 0
                ? {
                    delta: {
                      value: Math.abs(shift).toFixed(2),
                      direction: shift > 0 ? ("up" as const) : ("down" as const),
                      period: "over the period",
                    },
                  }
                : {})}
            />
            <StatCard
              label="Best day"
              value={
                rows.length > 0
                  ? Math.max(...rows.map((r) => r.avgRating)).toFixed(2)
                  : "-"
              }
              hint="highest daily average"
            />
            <StatCard
              label="Worst day"
              value={
                rows.length > 0
                  ? Math.min(...rows.map((r) => r.avgRating)).toFixed(2)
                  : "-"
              }
              hint="lowest daily average"
            />
          </div>

          <ChartFrame
            summary={`Average platform rating across ${rows.length} periods, now ${last?.avgRating.toFixed(2) ?? "unknown"}.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "avgRating", label: "Average rating" },
              { key: "ratingCount", label: "Ratings" },
            ]}
          >
            <LineChart
              data={rows}
              xKey="label"
              series={[{ key: "avgRating", label: "Average rating" }]}
            />
          </ChartFrame>
        </div>
      )}
    </ReportSection>
  );
}

// -- Admin 41: service demand ------------------------------------------------

function ServiceDemandReport() {
  const { rows, error, reload } = useReport<ServiceDemandRow>(getServiceDemand);

  // The inventory asks two questions — which services, and which areas — so
  // the data is rolled up both ways rather than shown as one flat list.
  const byService = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows ?? [])
      map.set(r.serviceName, (map.get(r.serviceName) ?? 0) + r.bookingCount);
    return [...map.entries()]
      .map(([label, bookings]) => ({ label, bookings }))
      .sort((a, b) => b.bookings - a.bookings);
  }, [rows]);

  const byArea = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows ?? [])
      map.set(r.area, (map.get(r.area) ?? 0) + r.bookingCount);
    return [...map.entries()]
      .map(([label, bookings]) => ({ label, bookings }))
      .sort((a, b) => b.bookings - a.bookings);
  }, [rows]);

  const total = byService.reduce((s, r) => s + r.bookings, 0);
  const topService = byService[0];
  const topArea = byArea[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Bookings"
          value={total}
          loading={rows === null}
          hint={`across ${byService.length} services`}
        />
        <StatCard
          label="Most booked"
          value={topService?.label ?? "—"}
          loading={rows === null}
          hint={
            topService
              ? `${topService.bookings} bookings · ${Math.round((topService.bookings / total) * 100)}% of demand`
              : ""
          }
        />
        <StatCard
          label="Busiest area"
          value={topArea?.label ?? "—"}
          loading={rows === null}
          hint={topArea ? `${topArea.bookings} bookings` : ""}
        />
      </div>

      <ReportSection
        title="Demand by service"
        note="What customers actually book. Thin demand is a candidate for hiding, not discounting."
        exportDisabled={byService.length === 0}
        onExport={() =>
          exportRows("service-demand", byService, [
            { header: "Service", value: (r) => r.label },
            { header: "Bookings", value: (r) => String(r.bookings) },
          ])
        }
      >
        {error ? (
          <ReportError onRetry={reload} />
        ) : !rows ? (
          <Skeleton className="h-panel rounded-card" />
        ) : byService.length === 0 ? (
          <EmptyState
            icon={<MapPin />}
            title="No demand data yet"
            description="Figures appear as customers place bookings."
          />
        ) : (
          <ChartFrame
            summary={`Bookings by service. ${topService?.label ?? "None"} leads with ${topService?.bookings ?? 0} of ${total}.`}
            data={byService}
            xKey="label"
            columns={[{ key: "bookings", label: "Bookings" }]}
          >
            <BarChart
              data={byService}
              xKey="label"
              series={[{ key: "bookings", label: "Bookings" }]}
            />
          </ChartFrame>
        )}
      </ReportSection>

      <ReportSection
        title="Demand by area"
        note="Where the work is. A busy area with few pros is where auto-assign starts failing."
        exportDisabled={byArea.length === 0}
        onExport={() =>
          exportRows("area-demand", byArea, [
            { header: "Area", value: (r) => r.label },
            { header: "Bookings", value: (r) => String(r.bookings) },
          ])
        }
      >
        {error ? (
          <ReportError onRetry={reload} />
        ) : !rows ? (
          <Skeleton className="h-panel rounded-card" />
        ) : (
          <ChartFrame
            summary={`Bookings by area. ${topArea?.label ?? "None"} is busiest with ${topArea?.bookings ?? 0}.`}
            data={byArea}
            xKey="label"
            columns={[{ key: "bookings", label: "Bookings" }]}
          >
            <BarChart
              data={byArea}
              xKey="label"
              series={[{ key: "bookings", label: "Bookings" }]}
            />
          </ChartFrame>
        )}
      </ReportSection>
    </div>
  );
}

// -- Admin 42: customers -----------------------------------------------------

function CustomerReport() {
  const { rows, error, reload } = useReport<CustomerGrowthPoint>(getCustomerGrowth);
  const active = useReport<ActiveUsersPoint>(getActiveUsers);

  const signups = (rows ?? []).reduce((s, r) => s + r.newSignups, 0);
  const latest = rows?.[rows.length - 1];
  const first = rows?.[0];
  const repeatNow = latest ? latest.repeatBookingRateBps / 100 : 0;
  const repeatThen = first ? first.repeatBookingRateBps / 100 : 0;
  const repeatShift = Math.round(repeatNow - repeatThen);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="New signups"
          value={signups}
          loading={rows === null}
          hint={`across ${rows?.length ?? 0} periods`}
        />
        <StatCard
          label="Repeat booking rate"
          value={`${repeatNow.toFixed(0)}%`}
          loading={rows === null}
          hint="customers who booked again"
          goodWhen="up"
          {...(repeatShift !== 0
            ? {
                delta: {
                  value: `${Math.abs(repeatShift)}%`,
                  direction: repeatShift > 0 ? ("up" as const) : ("down" as const),
                  period: "since the start of the period",
                },
              }
            : {})}
        />
        <StatCard
          label="Average signups"
          value={
            rows && rows.length > 0 ? Math.round(signups / rows.length) : 0
          }
          loading={rows === null}
          hint="per period"
        />
      </div>

      <ReportSection
        title="Signups and retention"
        note="Signups without a rising repeat rate is spend, not growth."
        exportDisabled={!rows || rows.length === 0}
        onExport={() =>
          exportRows("customers", rows ?? [], [
            { header: "Period", value: (r) => r.label },
            { header: "New signups", value: (r) => String(r.newSignups) },
            { header: "Repeat rate %", value: (r) => (r.repeatBookingRateBps / 100).toFixed(1) },
          ])
        }
      >
        {error ? (
          <ReportError onRetry={reload} />
        ) : !rows ? (
          <Skeleton className="h-panel rounded-card" />
        ) : (
          <ChartFrame
            summary={`New signups by period, ${signups} in total. Repeat booking rate is now ${repeatNow.toFixed(0)}%.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "newSignups", label: "New signups" },
              { key: "repeatBookingRateBps", label: "Repeat rate (bps)" },
            ]}
          >
            <LineChart
              data={rows}
              xKey="label"
              series={[{ key: "newSignups", label: "New signups" }]}
            />
          </ChartFrame>
        )}
      </ReportSection>

      <ActiveUsersSection state={active} />
    </div>
  );
}

/**
 * Admin 42 - MAU and DAU.
 *
 * The ratio is the point. DAU over MAU is how often a registered customer
 * actually opens the app, and for home services a low number is normal -
 * nobody books a plumber daily - so the hint says what good looks like rather
 * than leaving someone to panic at 18%.
 */
function ActiveUsersSection({
  state,
}: {
  state: {
    rows: ActiveUsersPoint[] | null;
    error: string | null;
    reload: () => void;
  };
}) {
  const { rows, error, reload } = state;
  const last = rows && rows.length > 0 ? rows[rows.length - 1] : undefined;
  const ratio = last && last.mau > 0 ? (last.dau / last.mau) * 100 : 0;

  return (
    <ReportSection
      title="Active users"
      note="How many registered customers actually open the app."
      exportDisabled={rows === null || rows.length === 0}
      onExport={() =>
        exportRows("active-users", rows ?? [], [
          { header: "Period", value: (r) => r.label },
          { header: "Daily active", value: (r) => String(r.dau) },
          { header: "Monthly active", value: (r) => String(r.mau) },
          {
            header: "DAU/MAU %",
            value: (r) =>
              r.mau > 0 ? ((r.dau / r.mau) * 100).toFixed(1) : "0.0",
          },
        ])
      }
    >
      {error ? (
        <ReportError onRetry={reload} />
      ) : rows === null ? (
        <Skeleton className="h-block-md rounded-card" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Daily active"
              value={String(last?.dau ?? 0)}
              hint="opened the app today"
            />
            <StatCard
              label="Monthly active"
              value={String(last?.mau ?? 0)}
              hint="opened it in the last 30 days"
            />
            <StatCard
              label="Stickiness"
              value={`${ratio.toFixed(0)}%`}
              hint="daily over monthly - 15 to 25% is normal for home services"
            />
          </div>

          <ChartFrame
            summary={`Daily and monthly active users. ${last?.dau ?? 0} daily against ${last?.mau ?? 0} monthly, a ${ratio.toFixed(0)}% ratio.`}
            data={rows}
            xKey="label"
            columns={[
              { key: "dau", label: "Daily active" },
              { key: "mau", label: "Monthly active" },
            ]}
          >
            <LineChart
              data={rows}
              xKey="label"
              series={[
                { key: "mau", label: "Monthly active" },
                { key: "dau", label: "Daily active" },
              ]}
            />
          </ChartFrame>
        </div>
      )}
    </ReportSection>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <ReportsInner />
    </Suspense>
  );
}
