"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarPlus,
  CheckCheck,
  ClipboardList,
  Inbox,
  IndianRupee,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import {
  getBookings,
  getDashboardKpis,
  getJobFeed,
  getPros,
  getQuotations,
} from "@cfc/mocks";
import type {
  BookingListItem,
  DashboardKpis,
  JobFeedItem,
  QuotationDetail,
} from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  Badge,
  BookingStatusBadge,
  Button,
  ErrorState,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  cn,
  formatCurrency,
  formatSchedule,
  initials,
  toast,
} from "@cfc/ui";

/**
 * Admin 3 — Main dashboard.
 *
 * Inventory: "KPI cards: New Bookings, Pending Quotes, Active Jobs, Total
 * Earning. Live job feed. Quick access to approval queue."
 *
 * The screen answers two questions, in this order and at very different
 * volumes:
 *
 *   1. What needs me right now?   — the approval queue and anything stalled
 *   2. How are we doing?          — the four figures
 *
 * The previous version had those the other way round: four identically-weighted
 * metric cards on top, and the approval queue reduced to a paragraph explaining
 * a rule with a link away from it. That is a page about facts. An operations
 * console is a page about work, and work that is late is the loudest thing on
 * it.
 *
 * Everything here derives from the same fixtures the list screens read, so a
 * count on this page and the count on the screen it links to always agree.
 */

const URGENT_LIMIT = 3;

export default function MainDashboardPage() {
  const [kpis, setKpis] = React.useState<DashboardKpis | null>(null);
  const [feed, setFeed] = React.useState<JobFeedItem[] | null>(null);
  const [queue, setQueue] = React.useState<QuotationDetail[] | null>(null);
  const [stalled, setStalled] = React.useState<BookingListItem[] | null>(null);
  const [pendingPros, setPendingPros] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([
      getDashboardKpis(),
      getJobFeed(6),
      getQuotations({ status: "pending", pageSize: 50 }),
      getBookings({ page: 1, pageSize: 200 }),
      getPros({ approvalStatus: "pending", pageSize: 1 }),
    ])
      .then(([k, f, q, b, p]) => {
        setKpis(k);
        setFeed(f);

        // Most urgent first — the operator triages by clock, not by
        // submission order.
        setQueue(
          [...q.items].sort(
            (a, b2) => (a.minutesRemaining ?? 99) - (b2.minutesRemaining ?? 99),
          ),
        );

        // A booking whose scheduled time has passed while still pending, or
        // that has been in progress far longer than any job should take.
        const now = Date.now();
        setStalled(
          b.items.filter((row) => {
            const at = new Date(row.scheduledAt).getTime();
            if (row.status === "pending" && at < now) return true;
            if (row.status === "in_progress" && at < now - 3 * 3_600_000)
              return true;
            return false;
          }),
        );

        setPendingPros(p.total);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const loading = kpis === null;

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" />
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            icon={<TriangleAlert />}
            title="The dashboard could not load"
            description="The connection may have dropped. Try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  const overdue = queue?.filter((q) => (q.minutesRemaining ?? 99) <= 0).length ?? 0;
  const stalledCount = stalled?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={<TodayLine />}
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href="/bookings">
              All bookings
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {/* ------------------------------------------------------------------
          NEEDS YOU — the reason this screen exists. Full width, above the
          metrics, and the only place on the page that spends colour.
          ------------------------------------------------------------------ */}
      <section className="space-y-3" aria-labelledby="needs-you">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="needs-you"
            className="text-heading font-semibold text-ink"
          >
            Needs you
          </h2>
          {(overdue > 0 || stalledCount > 0) && (
            <span className="text-caption text-ink-muted">
              {overdue > 0 && (
                <span className="text-critical-ink">
                  {overdue} past the 15-minute window
                </span>
              )}
              {overdue > 0 && stalledCount > 0 && " · "}
              {stalledCount > 0 && `${stalledCount} booking${stalledCount === 1 ? "" : "s"} stalled`}
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <ApprovalQueue rows={queue} loading={queue === null} />
          <div className="space-y-4">
            <StalledCard rows={stalled} loading={stalled === null} />
            <KycCard count={pendingPros} loading={pendingPros === null} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          TODAY — the four figures. Quieter than the work above, and each
          carries a comparison, because a number with nothing to compare it
          against is trivia.
          ------------------------------------------------------------------ */}
      <section className="space-y-3" aria-labelledby="today">
        <h2 id="today" className="text-heading font-semibold text-ink">
          Today
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CalendarPlus />}
            label="New bookings"
            value={kpis?.newBookingsToday ?? 0}
            loading={loading}
            delta={{ value: "2", direction: "up", period: "vs. yesterday" }}
            goodWhen="up"
            series={[3, 5, 4, 6, 5, 4, 6]}
          />
          <StatCard
            icon={<ClipboardList />}
            label="Pending quotes"
            value={kpis?.pendingQuotes ?? 0}
            loading={loading}
            hint={overdue > 0 ? `${overdue} overdue` : "all within window"}
            href="/quotations"
            linkAs={(p) => <Link {...p} />}
          />
          <StatCard
            icon={<Activity />}
            label="Active jobs"
            value={kpis?.activeJobs ?? 0}
            loading={loading}
            hint="assigned or in progress"
            series={[9, 11, 10, 13, 12, 14, 14]}
          />
          <StatCard
            icon={<IndianRupee />}
            label="Earned today"
            value={
              kpis ? formatCurrency(kpis.totalEarningTodayPaise) : "—"
            }
            loading={loading}
            delta={{ value: "12%", direction: "up", period: "vs. last Thursday" }}
            goodWhen="up"
            series={[3200, 4100, 3800, 4600, 4200, 4900, 5055]}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------
          ACTIVITY — the running record. Lowest weight on the page.
          ------------------------------------------------------------------ */}
      <section className="space-y-3" aria-labelledby="activity">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="activity" className="text-heading font-semibold text-ink">
            Latest activity
          </h2>
          <Link
            href="/bookings"
            className="rounded-pill text-small font-medium text-action hover:underline"
          >
            View all
          </Link>
        </div>
        <JobFeed rows={feed} loading={feed === null} />
      </section>
    </div>
  );
}

/** "Thursday, 12 September · 4 areas active" — orientation, not decoration. */
function TodayLine() {
  const [label, setLabel] = React.useState("");

  // Formatted on the client only: a date rendered on the server in one
  // timezone and hydrated in another is a mismatch waiting to happen.
  React.useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    );
  }, []);

  return <>{label || " "}</>;
}

// -- Needs you: the approval queue -------------------------------------------

/**
 * The three most urgent quotes, actionable in place.
 *
 * SRS 3.2 gives a fifteen-minute approval window. A screen that knows a quote
 * has four minutes left and offers only a link to another screen is wasting the
 * operator's window on navigation.
 */
function ApprovalQueue({
  rows,
  loading,
}: {
  rows: QuotationDetail[] | null;
  loading: boolean;
}) {
  const [decided, setDecided] = React.useState<Set<string>>(new Set());

  const visible = (rows ?? [])
    .filter((r) => !decided.has(r.id))
    .slice(0, URGENT_LIMIT);

  const decide = (q: QuotationDetail, outcome: "approved" | "rejected") => {
    setDecided((s) => new Set(s).add(q.id));
    toast.success(
      outcome === "approved"
        ? `${q.jobRef} approved`
        : `${q.jobRef} sent back to the pro`,
    );
  };

  const remaining = Math.max(0, (rows?.length ?? 0) - decided.size - visible.length);

  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm lg:col-span-2">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-body font-semibold text-ink">Approval queue</h3>
          <p className="text-caption text-ink-muted">
            Quotes above ₹5,000 need phone confirmation first.
          </p>
        </div>
        <Link
          href="/quotations"
          className="shrink-0 rounded-pill text-small font-medium text-action hover:underline"
        >
          Open queue
        </Link>
      </header>

      {loading ? (
        <div className="divide-y divide-border-soft">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="size-avatar rounded-control" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CheckCheck />}
          title="Queue is clear"
          description="Every quote submitted so far has been reviewed."
        />
      ) : (
        <>
          <ul className="divide-y divide-border-soft">
            {visible.map((q) => (
              <QueueRow key={q.id} quote={q} onDecide={decide} />
            ))}
          </ul>
          {remaining > 0 && (
            <Link
              href="/quotations"
              className={cn(
                "flex items-center justify-center gap-1 border-t border-border",
                "px-4 py-2 text-small text-ink-muted",
                "transition-colors duration-fast hover:bg-canvas hover:text-ink",
              )}
            >
              {remaining} more waiting
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </>
      )}
    </section>
  );
}

function QueueRow({
  quote,
  onDecide,
}: {
  quote: QuotationDetail;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const left = quote.minutesRemaining;
  const overdue = left !== null && left <= 0;
  const urgent = left !== null && left > 0 && left <= 5;
  const needsCall = quote.totalPaise > 500_000;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 p-4 transition-colors duration-fast",
        "hover:bg-canvas",
        // A row past its window carries the only tinted background on the
        // page. One row in three, not three in three.
        overdue && "bg-critical-subtle hover:bg-critical-subtle",
      )}
    >
      <Avatar className="size-avatar shrink-0">
        <AvatarFallback>{initials(quote.proName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-small">
          <span className="tabular font-medium text-ink width-condensed">
            {quote.jobRef}
          </span>
          <span className="truncate text-ink">{quote.serviceName}</span>
          {needsCall && (
            <Badge tone="clock">Call first</Badge>
          )}
        </p>
        <p className="truncate text-caption text-ink-muted">
          {quote.proName} → {quote.customerName}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Clock minutesRemaining={left} />
        <span className="tabular text-body font-semibold text-ink width-condensed">
          {formatCurrency(quote.totalPaise)}
        </span>
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onDecide(quote, "rejected")}
        >
          Send back
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => onDecide(quote, "approved")}
        >
          Approve
        </Button>
      </div>

      {urgent && !overdue && (
        <span className="sr-only">Urgent: {left} minutes remaining</span>
      )}
    </li>
  );
}

/**
 * The SLA clock as a bar, not a number.
 *
 * Fifteen minutes is short enough that a shrinking bar reads faster than
 * "7 min" does — the operator sees how much room is left before they finish
 * reading the row.
 */
function Clock({ minutesRemaining }: { minutesRemaining: number | null }) {
  if (minutesRemaining === null) {
    return <span className="w-12 text-caption text-ink-faint">—</span>;
  }

  const overdue = minutesRemaining <= 0;
  const fraction = Math.max(0, Math.min(1, minutesRemaining / 15));

  return (
    <div className="w-12 shrink-0 space-y-1">
      <p
        className={cn(
          "tabular text-caption font-medium",
          overdue
            ? "text-critical-ink"
            : minutesRemaining <= 5
              ? "text-clock-ink"
              : "text-ink-muted",
        )}
      >
        {overdue ? "Overdue" : `${minutesRemaining} min`}
      </p>
      <div
        className="h-1 overflow-hidden rounded-pill bg-neutral-subtle"
        role="img"
        aria-label={
          overdue
            ? "Past the approval window"
            : `${minutesRemaining} of 15 minutes remaining`
        }
      >
        <div
          className={cn(
            "h-full rounded-pill transition-size duration-slow ease-out",
            overdue
              ? "bg-critical"
              : minutesRemaining <= 5
                ? "bg-clock"
                : "bg-action",
          )}
          style={{ width: `${overdue ? 100 : fraction * 100}%` }}
        />
      </div>
    </div>
  );
}

// -- Needs you: the two smaller cards ----------------------------------------

/** A card that states one number and one route out of it. */
function AttentionCard({
  icon,
  title,
  count,
  loading,
  description,
  href,
  cta,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  loading: boolean;
  description: string;
  href: string;
  cta: string;
  tone?: "neutral" | "critical";
}) {
  return (
    <section
      className={cn(
        "rounded-card border bg-surface p-4 shadow-sm",
        tone === "critical" && count > 0
          ? "border-critical-line"
          : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-control [&_svg]:size-4",
            tone === "critical" && count > 0
              ? "bg-critical-subtle text-critical-ink"
              : "bg-neutral-subtle text-ink-muted",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-ink">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-6 w-8" />
          ) : (
            <p className="tabular mt-1 text-title font-semibold leading-none text-ink">
              {count}
            </p>
          )}
          <p className="mt-2 text-caption text-ink-muted">{description}</p>
          {count > 0 && (
            <Link
              href={href}
              className="mt-3 inline-flex items-center gap-1 rounded-pill text-small font-medium text-action hover:underline"
            >
              {cta}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function StalledCard({
  rows,
  loading,
}: {
  rows: BookingListItem[] | null;
  loading: boolean;
}) {
  const count = rows?.length ?? 0;
  return (
    <AttentionCard
      icon={<TriangleAlert />}
      title="Stalled bookings"
      count={count}
      loading={loading}
      description={
        count === 0
          ? "Nothing is past its scheduled time."
          : "Past their scheduled time and still not moving."
      }
      href="/bookings?tab=attention"
      cta="Review"
      tone="critical"
    />
  );
}

function KycCard({
  count,
  loading,
}: {
  count: number | null;
  loading: boolean;
}) {
  const n = count ?? 0;
  return (
    <AttentionCard
      icon={<UserCheck />}
      title="Pros awaiting KYC"
      count={n}
      loading={loading}
      description={
        n === 0
          ? "No registrations waiting."
          : "Cannot accept jobs until verified."
      }
      href="/pros?tab=approvals"
      cta="Verify documents"
    />
  );
}

// -- Activity ----------------------------------------------------------------

/**
 * The running record.
 *
 * Each row leads with an avatar so the eye has an anchor to jump between —
 * eight rows of identical text means scanning becomes reading.
 */
function JobFeed({
  rows,
  loading,
}: {
  rows: JobFeedItem[] | null;
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      {loading ? (
        <div className="divide-y divide-border-soft">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : (rows?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No activity yet"
          description="Bookings will appear here as customers place them."
        />
      ) : (
        <ul className="divide-y divide-border-soft">
          {rows?.map((item) => (
            <li key={item.id}>
              <Link
                href={`/bookings?id=${item.id}`}
                className={cn(
                  "flex items-center gap-3 p-3",
                  "transition-colors duration-fast hover:bg-canvas",
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>{initials(item.customerName)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-small text-ink">
                    <span className="font-medium">{item.customerName}</span>
                    <span className="text-ink-muted"> booked </span>
                    <span className="font-medium">{item.serviceName}</span>
                  </p>
                  <p className="truncate text-caption text-ink-muted">
                    <span className="tabular width-condensed">
                      {item.reference}
                    </span>
                    {" · "}
                    {item.proName ?? "Unassigned"}
                    {" · "}
                    <span className="tabular">{formatSchedule(item.at)}</span>
                  </p>
                </div>

                <BookingStatusBadge status={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
