"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Gift,
  LifeBuoy,
  MapPin,
  Navigation,
  Phone,
  Power,
  Star,
  Wallet,
} from "lucide-react";
import {
  getCommissionFreeRemaining,
  getProActiveJobs,
  getProDayStats,
} from "@cfc/mocks";
import {
  COMMISSION_FREE_JOBS,
  PRO_JOB_STATUS_LABEL,
  type ProDayStats,
  type ProJob,
} from "@cfc/types";
import {
  Badge,
  Button,
  ErrorState,
  Skeleton,
  cn,
  formatCurrency,
} from "@cfc/ui";
import { currentProId, useOnlineState } from "@/lib/pro-session";

/**
 * Pro 10 — the dashboard.
 *
 * The screen a pro opens twenty times a day, so it answers exactly three
 * questions and nothing else:
 *
 *   1. **What have I earned today?** — the figure at the top, and it is NET.
 *      Showing gross here and net on the settlement is how a pro comes to
 *      believe the app is skimming them.
 *   2. **Am I getting work?** — the online control, which is the largest thing
 *      on the screen when they are offline, because offline is the state that
 *      costs them money and is easy not to notice.
 *   3. **What am I doing next?** — the active jobs, with the one action each
 *      needs, so a pro on the move never has to go looking through a list.
 *
 * The four "quick stats" the inventory asks for sit below all three, because
 * a lifetime job count is something a pro checks occasionally and never acts
 * on. Putting them at the top would be arranging the screen by how easy the
 * numbers are to produce rather than by what the pro came for.
 *
 * Desktop is a genuine two-column layout — the day and the work on the left,
 * the standing figures docked right — not this column stretched wide.
 */

export default function ProDashboardPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [stats, setStats] = React.useState<ProDayStats | null>(null);
  const [jobs, setJobs] = React.useState<ProJob[] | null>(null);
  const [freeLeft, setFreeLeft] = React.useState<number | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setStats(null);
    setJobs(null);

    let cancelled = false;
    void Promise.all([
      getProDayStats(proId),
      getProActiveJobs(proId),
      getCommissionFreeRemaining(proId),
    ])
      .then(([s, j, f]) => {
        if (cancelled) return;
        setStats(s);
        setJobs(j);
        setFreeLeft(f);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  if (failed) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your day"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-action lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-4">
          <EarningsCard stats={stats} />
          <OnlineCard />
          {freeLeft !== null && freeLeft > 0 && (
            <CommissionFreeBanner remaining={freeLeft} />
          )}
          <ActiveJobs jobs={jobs} />
        </div>

        {/* The standing figures. Docked on desktop; below the work on mobile,
            because they are reference rather than something to act on. */}
        <div className="mt-4 space-y-4 lg:mt-0">
          <QuickStats stats={stats} />
          <SupportCard />
        </div>
      </div>
    </div>
  );
}

// -- 1. What have I earned today ---------------------------------------------

/**
 * Today's earning.
 *
 * Navy panel and the largest type on the screen, because this is what the pro
 * opened the app to see. The figure is **net** — what reaches their account —
 * and it says so, so there is never a gap between this number and the one in
 * their bank.
 */
function EarningsCard({ stats }: { stats: ProDayStats | null }) {
  return (
    <section className="overflow-hidden rounded-card bg-structure p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-small text-on-structure-muted">
            Earned today, after CFC fee
          </p>
          {stats ? (
            <p className="mt-1 tabular text-display font-semibold text-on-structure">
              {formatCurrency(stats.todayNetPaise)}
            </p>
          ) : (
            <Skeleton className="mt-2 h-8 w-line-lg" />
          )}
          <p className="mt-1 text-caption text-on-structure-faint">
            {stats
              ? stats.todayJobCount === 1
                ? "1 job completed today"
                : `${stats.todayJobCount} jobs completed today`
              : " "}
          </p>
        </div>

        <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-structure-raised text-brand">
          <Wallet className="size-5" aria-hidden="true" />
        </span>
      </div>

      {/* The 48-hour rule, stated where the money is. A pro who does not know
          it will raise a ticket on day one asking where their payout went. */}
      <p className="mt-4 border-t border-structure-line pt-3 text-caption text-on-structure-muted">
        Paid to your bank or UPI within 48 hours of completing a job.
      </p>

      <Button variant="secondary" className="mt-3 w-full" asChild>
        <Link href="/earnings">
          See full earnings
          <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}

// -- 2. Am I getting work ----------------------------------------------------

/**
 * The GO ONLINE control.
 *
 * The inventory calls for a "big green button", and offline is exactly when
 * that is right: a pro who does not realise they are offline is losing income
 * silently, so the control dominates the screen until they fix it. Once they
 * are online it steps back to a confirmation strip — a permanent full-width
 * green slab would train them to stop reading it.
 *
 * Green here is `live`, the platform's "in progress / accepting" colour, not a
 * one-off. And the state carries a text label as well as the colour, because
 * this is the screen where colour-blind guessing would cost money.
 */
function OnlineCard() {
  const { online, setOnline } = useOnlineState();

  if (!online) {
    return (
      <section className="rounded-card border border-border bg-surface p-5 text-center">
        <span className="mx-auto flex size-tile-lg items-center justify-center rounded-full bg-neutral-subtle text-ink-muted">
          <Power className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-heading font-semibold text-ink">
          You are offline
        </h2>
        <p className="mx-auto mt-1 max-w-prose text-small text-ink-muted">
          You will not receive job alerts until you go online.
        </p>
        <Button
          variant="go"
          size="pro"
          className="mt-4 w-full"
          onClick={() => setOnline(true)}
        >
          Go online
        </Button>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "flex items-center gap-3 rounded-card border p-4",
        "border-live-line bg-live-subtle",
      )}
    >
      <span className="flex size-tile shrink-0 items-center justify-center rounded-full bg-live text-on-action">
        <Power className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-live-ink">
          You are online
        </p>
        <p className="text-caption text-live-ink">
          In the queue for new jobs near you.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setOnline(false)}>
        Go offline
      </Button>
    </section>
  );
}

/**
 * The onboarding offer, while it lasts.
 *
 * A real term from the agreement: the first 20 jobs carry no CFC commission.
 * It disappears at zero rather than reading "0 jobs left", which would turn a
 * benefit into a reminder of a benefit ending.
 */
function CommissionFreeBanner({ remaining }: { remaining: number }) {
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
          Your first {COMMISSION_FREE_JOBS} jobs on CFC carry no platform
          commission — you keep the full amount.
        </p>
      </div>
    </section>
  );
}

// -- 3. What am I doing next -------------------------------------------------

function ActiveJobs({ jobs }: { jobs: ProJob[] | null }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading font-semibold text-ink">Your work now</h2>
        <Link
          href="/jobs"
          className="flex shrink-0 items-center gap-1 text-small font-medium text-action hover:underline"
        >
          All jobs
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {jobs === null ? (
        <div className="mt-3 space-y-3">
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
        </div>
      ) : jobs.length === 0 ? (
        <NoActiveJobs />
      ) : (
        <ul className="mt-3 space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * No active work.
 *
 * Not an error, and not a dead end. It says what to do next, and what it says
 * depends on whether the pro is online — "wait for a job" is useless advice to
 * someone who is not in the queue.
 */
function NoActiveJobs() {
  const { online, setOnline } = useOnlineState();

  return (
    <div className="mt-3 rounded-card border border-border bg-surface p-6 text-center">
      <span className="mx-auto flex size-tile items-center justify-center rounded-full bg-neutral-subtle text-ink-muted">
        <BriefcaseBusiness className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-small font-medium text-ink">
        No jobs in progress
      </p>
      <p className="mx-auto mt-1 max-w-prose text-caption text-ink-muted">
        {online
          ? "You are online. New jobs near you will appear here."
          : "Go online to start receiving jobs near you."}
      </p>
      {!online && (
        <Button
          variant="go"
          className="mt-3"
          onClick={() => setOnline(true)}
        >
          Go online
        </Button>
      )}
    </div>
  );
}

/**
 * One job, with its next action.
 *
 * The action changes with the status, because "what do I do about this job" has
 * a different answer at each stage and making the pro work that out is the
 * thing an app is for. Travelling → navigate. On site → open the job.
 */
function JobCard({ job }: { job: ProJob }) {
  const tone =
    job.status === "in_progress"
      ? "live"
      : job.status === "awaiting_quote"
        ? "clock"
        : "neutral";

  return (
    <article className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={tone} dot={job.status === "in_progress"}>
            {PRO_JOB_STATUS_LABEL[job.status]}
          </Badge>
          <h3 className="mt-2 truncate text-body font-semibold text-ink">
            {job.serviceName}
          </h3>
          <p className="mt-px truncate text-small text-ink-muted">
            {job.customerName}
          </p>
        </div>

        {/* Net, as everywhere a pro sees a figure before doing the work. */}
        <div className="shrink-0 text-right">
          <p className="tabular text-body font-semibold text-ink">
            {formatCurrency(job.netEarningPaise)}
          </p>
          <p className="text-caption text-ink-muted">you earn</p>
        </div>
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted">
        <div className="flex items-center gap-1">
          <dt className="sr-only">Area</dt>
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <dd>
            {job.area} · {job.distanceKm} km
          </dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="sr-only">Scheduled</dt>
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          <dd>{formatWhen(job.scheduledAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="min-w-0 flex-1" asChild>
          <Link href={`/jobs/${job.id}`}>
            {job.status === "in_progress" ? "Continue job" : "Open job"}
          </Link>
        </Button>

        {/* Only useful once the pro has the address, which they only get after
            accepting. Both are null before that, so neither renders. */}
        {job.address !== null && job.status === "on_the_way" && (
          <Button variant="secondary" size="icon-md" asChild>
            <a
              href={mapsHref(job.address)}
              target="_blank"
              rel="noreferrer"
              aria-label="Navigate to the customer"
            >
              <Navigation />
            </a>
          </Button>
        )}
        {job.customerPhone !== null && (
          <Button variant="secondary" size="icon-md" asChild>
            <a
              href={`tel:${job.customerPhone}`}
              aria-label={`Call ${job.customerName}`}
            >
              <Phone />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

// -- The standing figures ----------------------------------------------------

/**
 * The four quick stats the inventory asks for.
 *
 * Reference, not action — so they are below the fold on mobile and docked in
 * the right column on desktop. `totalEarnedNetPaise` is net for the same
 * reason every other figure in this app is.
 */
function QuickStats({ stats }: { stats: ProDayStats | null }) {
  const rows: { label: string; value: string; icon: React.ReactNode }[] = stats
    ? [
        {
          label: "Jobs completed",
          value: String(stats.completedTotal),
          icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
        },
        {
          label: "Active and upcoming",
          value: String(stats.activeCount + stats.upcomingCount),
          icon: <BriefcaseBusiness className="size-4" aria-hidden="true" />,
        },
        {
          label: "Your rating",
          // One decimal always, so 4.0 does not render as "4" beside 4.8.
          value: stats.rating > 0 ? stats.rating.toFixed(1) : "—",
          icon: <Star className="size-4" aria-hidden="true" />,
        },
        {
          label: "Earned all time",
          value: formatCurrency(stats.totalEarnedNetPaise, { compact: true }),
          icon: <Wallet className="size-4" aria-hidden="true" />,
        },
      ]
    : [];

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
        Your record
      </h2>

      {stats === null ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-line-lg" />
        </div>
      ) : (
        <dl className="divide-y divide-border-soft">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <dt className="flex min-w-0 items-center gap-2 text-small text-ink-muted">
                <span className="shrink-0 text-ink-faint">{row.icon}</span>
                <span className="truncate">{row.label}</span>
              </dt>
              <dd className="shrink-0 tabular text-body font-semibold text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** The support entry the inventory asks for on this screen. */
function SupportCard() {
  return (
    <Link
      href="/support"
      className={cn(
        "flex items-center gap-3 rounded-card border border-border bg-surface p-4",
        "transition-colors duration-fast hover:border-action-line",
      )}
    >
      <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
        <LifeBuoy className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-medium text-ink">
          Need help?
        </span>
        <span className="block text-caption text-ink-muted">
          Talk to the CFC team about a job or a payment.
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-ink-faint"
        aria-hidden="true"
      />
    </Link>
  );
}

// -- Helpers -----------------------------------------------------------------

/**
 * When a job is, in the words a pro would use.
 *
 * "In 40 minutes" is what they need on a job starting soon; a date is what they
 * need on one next week. A single format cannot do both.
 */
function formatWhen(iso: string): string {
  const then = new Date(iso);
  const diffMs = then.getTime() - Date.now();
  const absMin = Math.round(Math.abs(diffMs) / 60_000);

  if (absMin < 1) return "Now";
  if (absMin < 60) {
    return diffMs > 0 ? `In ${absMin} min` : `${absMin} min ago`;
  }

  const time = then.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  const today = new Date();
  const isToday = then.toDateString() === today.toDateString();
  if (isToday) return `Today, ${time}`;

  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (then.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${time}`;
  }

  return `${then.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}, ${time}`;
}

/**
 * Hand navigation to the device.
 *
 * Not a compromise — this is the right answer in production too. Nobody should
 * rebuild turn-by-turn navigation inside a web app, and this opens whatever the
 * pro already has installed and knows how to use.
 */
function mapsHref(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;
}
