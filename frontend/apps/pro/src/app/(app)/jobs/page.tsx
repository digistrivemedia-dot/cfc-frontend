"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, CalendarClock, MapPin } from "lucide-react";
import { getProJobCounts, getProJobs } from "@cfc/mocks";
import {
  PRO_JOB_STATUS_LABEL,
  PRO_JOB_TABS,
  PRO_JOB_TAB_LABEL,
  type ProJob,
  type ProJobStatus,
  type ProJobTab,
} from "@cfc/types";
import {
  Badge,
  DataTable,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
  formatCurrency,
  type Column,
} from "@cfc/ui";
import { useOnlineState } from "@/lib/pro-session";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 20 — my jobs.
 *
 * Four tabs, as the inventory specifies: Active / Upcoming / Completed /
 * Cancelled.
 *
 * ## One data source, two presentations
 *
 * On a phone a job is a card; on a laptop a partner scanning forty jobs needs a
 * table with alignable columns. `DataTable` already renders both from one
 * column definition and one card layout, which is the important part — two
 * hand-built implementations of the same list is how a column ends up missing
 * from one of them. That is not hypothetical: the admin panel shipped a table
 * whose only Assign button disappeared at exactly the width where it was
 * needed, because `hideBelow` measures the CONTAINER and the container had
 * shrunk.
 *
 * So nothing here is hidden below a width. Every column earns its place at
 * every size or it is not a column.
 *
 * ## The tab lives in the URL
 *
 * `?tab=completed` so a pro can be sent to the right list from a notification,
 * and so the back button returns to the tab they were on rather than the
 * default. The dashboard's "Rate a booking"-style links depend on it.
 */

function isTab(value: string | null): value is ProJobTab {
  return value !== null && (PRO_JOB_TABS as readonly string[]).includes(value);
}

export default function ProJobsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen" />}>
      <JobsInner />
    </React.Suspense>
  );
}

function JobsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const proId = React.useMemo(() => currentProId(), []);

  const raw = params.get("tab");
  const tab: ProJobTab = isTab(raw) ? raw : "active";

  const [jobs, setJobs] = React.useState<ProJob[] | null>(null);
  const [counts, setCounts] = React.useState<Record<ProJobTab, number> | null>(
    null,
  );
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setJobs(null);
    let cancelled = false;
    void Promise.all([getProJobs(proId, tab), getProJobCounts(proId)])
      .then(([rows, c]) => {
        if (cancelled) return;
        setJobs(rows);
        setCounts(c);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId, tab]);

  React.useEffect(() => load(), [load]);

  const columns = React.useMemo<Column<ProJob>[]>(
    () => [
      {
        id: "service",
        header: "Job",
        cell: (job) => (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">
              {job.serviceName}
            </span>
            <span className="block truncate text-caption text-ink-muted">
              {job.reference}
            </span>
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        cell: (job) => (
          <span className="block min-w-0">
            <span className="block truncate text-ink">{job.customerName}</span>
            <span className="block truncate text-caption text-ink-muted">
              {job.area} · {job.distanceKm} km
            </span>
          </span>
        ),
      },
      {
        id: "when",
        header: "Scheduled",
        cell: (job) => (
          <span className="whitespace-nowrap">{formatWhen(job.scheduledAt)}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (job) => <JobStatusBadge status={job.status} />,
      },
      {
        id: "earning",
        header: "You earn",
        align: "right",
        tabular: true,
        // Net, as on every other pro screen. A list showing gross beside a
        // detail screen showing net is how a pro stops trusting both.
        cell: (job) => formatCurrency(job.netEarningPaise),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <h1 className="text-title font-semibold text-ink">Your jobs</h1>

      <Tabs
        value={tab}
        onValueChange={(next) => {
          // `replace` rather than `push`: switching tabs should not fill the
          // back stack with four entries a pro has to press through.
          router.replace(next === "active" ? "/jobs" : `/jobs?tab=${next}`);
        }}
        className="mt-4"
      >
        <TabsList className="w-full overflow-x-auto scrollbar-none">
          {PRO_JOB_TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="shrink-0">
              {PRO_JOB_TAB_LABEL[t]}
              {counts !== null && counts[t] > 0 && (
                <span
                  className={cn(
                    "ml-2 rounded-pill px-2 text-caption tabular",
                    tab === t
                      ? "bg-action-subtle text-action"
                      : "bg-canvas text-ink-muted",
                  )}
                >
                  {counts[t]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        className="mt-4"
        columns={columns}
        rows={jobs ?? []}
        rowKey={(job) => job.id}
        caption={`${PRO_JOB_TAB_LABEL[tab]} jobs`}
        loading={jobs === null && !failed}
        error={failed ? "Could not load your jobs." : null}
        onRetry={load}
        onRowClick={(job) => router.push(jobHref(job))}
        empty={<EmptyJobs tab={tab} />}
        card={{
          title: (job) => (
            <span className="block truncate font-semibold text-ink">
              {job.serviceName}
            </span>
          ),
          badge: (job) => <JobStatusBadge status={job.status} />,
          lines: [
            (job) => (
              <span className="flex items-center gap-1">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {job.customerName} · {job.area} · {job.distanceKm} km
              </span>
            ),
            (job) => (
              <span className="flex items-center gap-1">
                <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                {formatWhen(job.scheduledAt)}
              </span>
            ),
          ],
          trailing: (job) => (
            <span className="block text-right">
              <span className="block tabular text-body font-semibold text-ink">
                {formatCurrency(job.netEarningPaise)}
              </span>
              <span className="block text-caption text-ink-muted">
                you earn
              </span>
            </span>
          ),
        }}
      />
    </div>
  );
}

/**
 * A job's status, coloured once.
 *
 * `live` for work happening now, `clock` for something waiting on someone else,
 * `critical` for cancelled, neutral otherwise — the design system's rule that
 * colour is spent on state, not on decoration.
 */
function JobStatusBadge({ status }: { status: ProJobStatus }) {
  const tone =
    status === "in_progress" || status === "on_the_way"
      ? "live"
      : status === "awaiting_quote"
        ? "clock"
        : status === "cancelled"
          ? "critical"
          : "neutral";

  return (
    <Badge tone={tone} dot={status === "in_progress"}>
      {PRO_JOB_STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * An empty tab.
 *
 * Four tabs, four different reasons for being empty, and four different things
 * to do about it. "No jobs found" would be true and useless in all four cases —
 * an empty Active tab while offline is a fixable situation, and an empty
 * Cancelled tab is good news.
 */
function EmptyJobs({ tab }: { tab: ProJobTab }) {
  const { online, setOnline } = useOnlineState();

  if (tab === "active") {
    return (
      <EmptyState
        icon={<BriefcaseBusiness />}
        title="No jobs in progress"
        description={
          online
            ? "You are online. New jobs near you will appear here as they come in."
            : "Go online to start receiving jobs near you."
        }
        {...(online
          ? {}
          : { action: { label: "Go online", onClick: () => setOnline(true) } })}
      />
    );
  }

  if (tab === "upcoming") {
    return (
      <EmptyState
        icon={<CalendarClock />}
        title="Nothing scheduled"
        description="Jobs booked for a later date will show here."
      />
    );
  }

  if (tab === "completed") {
    return (
      <EmptyState
        icon={<BriefcaseBusiness />}
        title="No completed jobs yet"
        description="Finished jobs appear here with what you earned on each."
      />
    );
  }

  return (
    <EmptyState
      icon={<BriefcaseBusiness />}
      title="No cancelled jobs"
      description="Nothing has been cancelled. That is a good record to keep."
    />
  );
}

// -- Helpers -----------------------------------------------------------------

/**
 * Where a row goes.
 *
 * A job in progress opens on the work screen rather than the detail, because
 * that is what the pro is trying to reach — one tap saved on the screen they
 * touch most.
 */
function jobHref(job: ProJob): string {
  return job.status === "in_progress"
    ? `/jobs/${job.id}/work`
    : `/jobs/${job.id}`;
}

/** Relative for anything close, a date beyond that. */
function formatWhen(iso: string): string {
  const then = new Date(iso);
  const diffMs = then.getTime() - Date.now();
  const absMin = Math.round(Math.abs(diffMs) / 60_000);

  if (absMin < 1) return "Now";
  if (absMin < 60) return diffMs > 0 ? `In ${absMin} min` : `${absMin} min ago`;

  const time = then.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  const today = new Date();
  if (then.toDateString() === today.toDateString()) return `Today, ${time}`;

  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (then.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${time}`;
  }
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (then.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${time}`;
  }

  return `${then.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}, ${time}`;
}
