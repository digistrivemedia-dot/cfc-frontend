"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin, Star } from "lucide-react";
import { getMyBookingCounts, getMyBookings } from "@cfc/mocks";
import type { ConsumerBooking } from "@cfc/types";
import type { BookingTab } from "@cfc/mocks";
import {
  Badge,
  BookingStatusBadge,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  formatCurrency,
  formatDayShort,
  formatTime,
} from "@cfc/ui";

/**
 * Customer 25 — My bookings.
 *
 * Inventory: "Tabs: Upcoming / Ongoing / Completed / Cancelled."
 *
 * The tab lives in the URL so a customer who opens a booking and comes back
 * lands on the tab they left, rather than being dropped on Upcoming again.
 *
 * The grouping is in the API, not here: "Upcoming" spans two statuses —
 * a booking with no professional yet, and one with a professional already
 * travelling — and that mapping should not be duplicated on a screen.
 */

const TABS: { id: BookingTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const EMPTY: Record<BookingTab, { title: string; description: string }> = {
  upcoming: {
    title: "Nothing booked yet",
    description: "When you book a service it will appear here.",
  },
  ongoing: {
    title: "No job in progress",
    description: "A booking shows here while a professional is working.",
  },
  completed: {
    title: "No completed jobs yet",
    description: "Finished bookings and their invoices live here.",
  },
  cancelled: {
    title: "Nothing cancelled",
    description: "Cancelled bookings are kept here for your records.",
  },
};

function BookingsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as BookingTab | null) ?? "upcoming";

  const [rows, setRows] = React.useState<ConsumerBooking[] | null>(null);
  const [counts, setCounts] = React.useState<Record<BookingTab, number> | null>(
    null,
  );
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    setRows(null);
    Promise.all([getMyBookings(tab), getMyBookingCounts()])
      .then(([list, c]) => {
        setRows(list);
        setCounts(c);
      })
      .catch(() => setError(true));
  }, [tab]);

  React.useEffect(() => load(), [load]);

  return (
    <div className="mx-auto max-w-screen-lg px-4 pb-tab-bar pt-4 md:px-6 md:pb-12 lg:px-8">
      <h1 className="text-title font-semibold text-ink">My bookings</h1>

      {/* Scrolls on a phone: four tabs with counts do not fit at 390px. */}
      <div
        role="tablist"
        aria-label="Booking status"
        className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          const count = counts?.[t.id] ?? null;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => router.push(`/bookings?tab=${t.id}`)}
              className={cn(
                "flex h-touch shrink-0 items-center gap-2 rounded-pill border px-3 text-small",
                "transition-colors duration-fast",
                active
                  ? "border-action bg-action text-on-action"
                  : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
              )}
            >
              {t.label}
              {count !== null && count > 0 && (
                <span
                  className={cn(
                    "tabular rounded-pill px-1 text-caption font-semibold",
                    active ? "bg-on-action text-action" : "bg-neutral-subtle text-ink-muted",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorState
            title="We could not load your bookings"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      ) : rows === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-block-sm rounded-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<CalendarDays />}
            title={EMPTY[tab].title}
            description={EMPTY[tab].description}
            {...(tab === "upcoming"
              ? {
                  action: {
                    label: "Browse services",
                    onClick: () => router.push("/categories"),
                  },
                }
              : {})}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One booking, actionable from the list.
 *
 * The status decides what matters: a job in progress leads with the
 * professional and the arrival time, a completed one leads with whether it
 * still needs rating. A card that shows the same six fields regardless makes
 * the customer read all six every time.
 */
function BookingCard({ booking }: { booking: ConsumerBooking }) {
  const needsRating = booking.status === "completed" && !booking.rated;

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className={cn(
        "block rounded-card border border-border bg-surface p-4",
        "transition-colors duration-fast hover:border-action-line",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {needsRating && (
              <Badge tone="clock" dot>
                Rate this
              </Badge>
            )}
          </div>

          <p className="mt-2 text-small font-semibold text-ink">
            {booking.serviceName}
          </p>
          {booking.variantName !== null && (
            <p className="text-caption text-ink-muted">{booking.variantName}</p>
          )}

          <p className="tabular mt-1 text-caption text-ink-muted">
            {formatDayShort(booking.scheduledAt)}, {formatTime(booking.scheduledAt)}
          </p>

          <p className="mt-1 flex items-start gap-1 text-caption text-ink-faint">
            <MapPin className="mt-px size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {booking.address.line1}, {booking.address.area}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="tabular text-small font-semibold text-ink">
            {formatCurrency(booking.totalPaise)}
          </span>
          <ChevronRight className="size-4 text-ink-faint" aria-hidden="true" />
        </div>
      </div>

      {/* The professional, once there is one. Before that, saying "finding a
          professional" is more use than an empty row. */}
      <div className="mt-3 flex items-center gap-2 border-t border-border-soft pt-3">
        {booking.pro === null ? (
          <p className="text-caption text-ink-muted">
            {booking.status === "cancelled"
              ? "No professional was assigned"
              : "Finding a professional near you"}
          </p>
        ) : (
          <>
            <p className="min-w-0 flex-1 truncate text-caption text-ink">
              {booking.pro.name}
            </p>
            <span className="flex shrink-0 items-center gap-1 text-caption text-ink-muted">
              <Star className="size-3 fill-star text-star" aria-hidden="true" />
              <span className="tabular">{booking.pro.rating.toFixed(1)}</span>
            </span>
            {booking.etaMinutes !== null && (
              <Badge tone="live" dot>
                {booking.etaMinutes} min away
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-lg px-4 py-6 md:px-6 lg:px-8">
          <Skeleton className="h-block-md rounded-card" />
        </div>
      }
    >
      <BookingsInner />
    </Suspense>
  );
}
