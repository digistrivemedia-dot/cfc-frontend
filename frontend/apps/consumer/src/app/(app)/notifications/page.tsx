"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellOff,
  CalendarCheck,
  Clock,
  FileText,
  Tag,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@cfc/mocks";
import type { NotificationFilter } from "@cfc/mocks";
import type { AppNotification } from "@cfc/types";
import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  formatSchedule,
} from "@cfc/ui";

/**
 * Customer 39 — Notifications.
 *
 * Inventory: "All alerts — bookings, offers, quotations, reminders."
 *
 * Those four are the filter tabs and the icons, from one `kind` field, so a
 * category cannot exist in the tab strip and not in the data.
 *
 * Every row navigates. A notification that opens nothing tells a customer
 * something happened and then leaves them to go and find it — which is worse
 * than not telling them.
 */

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "booking", label: "Bookings" },
  { id: "quotation", label: "Quotations" },
  { id: "offer", label: "Offers" },
  { id: "reminder", label: "Reminders" },
];

const KIND_META: Record<
  AppNotification["kind"],
  { icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  booking: { icon: CalendarCheck, tint: "bg-action-subtle text-action" },
  // A quotation is the one that needs a decision, so it is the only kind that
  // spends colour.
  quotation: { icon: FileText, tint: "bg-clock-subtle text-clock-ink" },
  offer: { icon: Tag, tint: "bg-neutral-subtle text-ink-muted" },
  reminder: { icon: Clock, tint: "bg-neutral-subtle text-ink-muted" },
};

function NotificationsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (params.get("kind") as NotificationFilter | null) ?? "all";

  const [rows, setRows] = React.useState<AppNotification[] | null>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    setRows(null);
    getNotifications(filter).then(setRows).catch(() => setError(true));
  }, [filter]);

  React.useEffect(() => load(), [load]);

  const unread = rows?.filter((n) => !n.read).length ?? 0;

  const open = (n: AppNotification) => {
    // Marked read on the way out, not on render: a customer who scrolls past
    // something has not dealt with it.
    if (!n.read) void markNotificationRead(n.id);
    if (n.href !== null) router.push(n.href);
  };

  const markAll = () => {
    setBusy(true);
    markAllNotificationsRead()
      .then(load)
      .finally(() => setBusy(false));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not load your notifications"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold text-ink">Notifications</h1>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={busy}
            onClick={markAll}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Filter notifications"
        className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0"
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
                router.push(
                  f.id === "all" ? "/notifications" : `/notifications?kind=${f.id}`,
                )
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
            icon={<BellOff />}
            title={
              filter === "all"
                ? "Nothing here yet"
                : "Nothing in this category"
            }
            description={
              filter === "all"
                ? "Updates about your bookings and offers will appear here."
                : "Try another category."
            }
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((n) => (
            <li key={n.id}>
              <NotificationRow notification={n} onOpen={() => open(n)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One notification.
 *
 * Unread carries a tinted background and a dot rather than bold text: bold on
 * a two-line body is heavy, and the dot survives being scanned at speed.
 */
function NotificationRow({
  notification,
  onOpen,
}: {
  notification: AppNotification;
  onOpen: () => void;
}) {
  const meta = KIND_META[notification.kind];
  const Icon = meta.icon;
  const interactive = notification.href !== null;

  const body = (
    <>
      <span
        className={cn(
          "flex size-tile shrink-0 items-center justify-center rounded-control",
          meta.tint,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 text-small",
              notification.read ? "text-ink" : "font-semibold text-ink",
            )}
          >
            {notification.title}
          </span>
          {!notification.read && (
            <span
              className="mt-1 size-2 shrink-0 rounded-full bg-action"
              aria-label="Unread"
            />
          )}
        </span>
        <span className="mt-px block text-caption text-ink-muted">
          {notification.body}
        </span>
        <span className="tabular mt-1 block text-caption text-ink-faint">
          {formatSchedule(notification.at)}
        </span>
      </span>
    </>
  );

  const classes = cn(
    "flex w-full items-start gap-3 rounded-card border p-4 text-left",
    "transition-colors duration-fast",
    notification.read
      ? "border-border bg-surface"
      : "border-action-line bg-action-subtle",
    interactive && "hover:border-action-line",
  );

  if (!interactive) {
    return <div className={classes}>{body}</div>;
  }

  return (
    <Link href={notification.href ?? "#"} className={classes} onClick={onOpen}>
      {body}
    </Link>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
          <Skeleton className="h-block-md rounded-card" />
        </div>
      }
    >
      <NotificationsInner />
    </Suspense>
  );
}
