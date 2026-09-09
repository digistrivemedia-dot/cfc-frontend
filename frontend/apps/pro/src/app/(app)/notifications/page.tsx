"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  FileText,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import {
  getProNotifications,
  markAllProNotificationsRead,
  markProNotificationRead,
  type ProNotificationFilter,
} from "@cfc/mocks";
import {
  PRO_NOTIFICATION_KINDS,
  PRO_NOTIFICATION_KIND_LABEL,
  type ProNotification,
  type ProNotificationKind,
} from "@cfc/types";
import {
  Button,
  EmptyState,
  ErrorState,
  InlineAlert,
  Skeleton,
  cn,
  toast,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 31 — notifications.
 *
 * "Job alerts, payout updates, platform announcements, warnings."
 *
 * ## Warnings are their own category, and coloured
 *
 * The customer's `AppNotification` has four kinds and none of them is a
 * warning, so the pro app has its own union. That is not tidiness: a warning is
 * a disciplinary notice with a penalty attached and an escalation path behind
 * it, and filing it under "reminder" would bury the most consequential message
 * this app can deliver. It gets `critical`, and it never groups with anything
 * else.
 *
 * ## Push delivery is backend
 *
 * This list is real. The *arrival* of a notification on a locked phone needs
 * FCM, which is out of frontend scope, and a web app cannot wake a sleeping
 * device regardless. Said plainly at the foot rather than implied by silence,
 * because a pro who misses a job alert needs to know whether to keep the app
 * open. PRO-OPEN-ITEMS 2.6.
 *
 * ## Tapping marks read and goes somewhere
 *
 * Every row has an `href` unless there is genuinely nowhere to go. A
 * notification that opens nothing tells a pro something happened and then
 * leaves them to find it.
 */

const KIND_ICON: Record<ProNotificationKind, React.ReactNode> = {
  job: <BriefcaseBusiness className="size-5" aria-hidden="true" />,
  payout: <Banknote className="size-5" aria-hidden="true" />,
  quotation: <FileText className="size-5" aria-hidden="true" />,
  announcement: <Megaphone className="size-5" aria-hidden="true" />,
  warning: <ShieldAlert className="size-5" aria-hidden="true" />,
};

export default function ProNotificationsPage() {
  const proId = React.useMemo(() => currentProId(), []);
  const [filter, setFilter] = React.useState<ProNotificationFilter>("all");
  const [rows, setRows] = React.useState<ProNotification[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    setRows(null);
    let cancelled = false;
    void getProNotifications(proId, filter)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId, filter]);

  React.useEffect(() => load(), [load]);

  const unread = (rows ?? []).filter((r) => !r.read).length;

  const markAll = async () => {
    try {
      await markAllProNotificationsRead(proId);
      setRows((current) => current?.map((r) => ({ ...r, read: true })) ?? null);
      toast.success("All marked as read.");
    } catch {
      toast.error("Could not mark them read. Try again.");
    }
  };

  const open = (row: ProNotification) => {
    if (!row.read) {
      // Applied locally first: the row should dim as the pro taps it, not
      // after a round trip they have already navigated away from.
      setRows(
        (current) =>
          current?.map((r) => (r.id === row.id ? { ...r, read: true } : r)) ??
          null,
      );
      void markProNotificationRead(proId, row.id).catch(() => {
        // Not worth telling the pro about. The next load corrects it.
      });
    }
  };

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title font-semibold text-ink">Notifications</h1>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => void markAll()}>
            <CheckCheck />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters. A scroller on a phone; they all fit on a desktop. */}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {PRO_NOTIFICATION_KINDS.map((kind) => (
          <FilterChip
            key={kind}
            active={filter === kind}
            onClick={() => setFilter(kind)}
            label={PRO_NOTIFICATION_KIND_LABEL[kind]}
          />
        ))}
      </div>

      {failed ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load notifications"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      ) : rows === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<Bell />}
            title={
              filter === "all"
                ? "Nothing yet"
                : `No ${PRO_NOTIFICATION_KIND_LABEL[filter as ProNotificationKind].toLowerCase()}`
            }
            description={
              filter === "warning"
                ? "You have no warnings on your account. Keep it that way."
                : "Job alerts, payment updates and announcements from CFC appear here."
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <NotificationRow row={row} onOpen={() => open(row)} />
            </li>
          ))}
        </ul>
      )}

      {/* What this list cannot do. Stated, because a pro who misses a job
          alert needs to know whether keeping the app open matters. */}
      <InlineAlert
        tone="info"
        title="Keep the app open for job alerts"
        className="mt-6"
      >
        Push notifications to a locked phone are not switched on yet. While you
        are online, keep CFC Pro open in your browser so a new job alert reaches
        you inside its 30 seconds.
      </InlineAlert>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-8 shrink-0 items-center whitespace-nowrap rounded-pill px-3",
        "text-caption font-medium transition-colors duration-fast",
        active
          ? "bg-action text-on-action"
          : "border border-border bg-surface text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function NotificationRow({
  row,
  onOpen,
}: {
  row: ProNotification;
  onOpen: () => void;
}) {
  const warning = row.kind === "warning";

  const inner = (
    <>
      <span
        className={cn(
          "flex size-tile shrink-0 items-center justify-center rounded-control",
          warning
            ? "bg-critical text-on-action"
            : row.read
              ? "bg-canvas text-ink-muted"
              : "bg-action-subtle text-action",
        )}
      >
        {KIND_ICON[row.kind]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "min-w-0 text-small",
              row.read ? "font-medium text-ink-muted" : "font-semibold text-ink",
              warning && "text-critical-ink",
            )}
          >
            {row.title}
          </span>
          {/* An unread dot rather than a bold-everything treatment: it survives
              being read at a glance and does not fight the warning colour. */}
          {!row.read && (
            <span
              className="mt-1 size-2 shrink-0 rounded-full bg-action"
              aria-label="Unread"
            />
          )}
        </span>
        <span className="mt-px block text-caption text-ink-muted">
          {row.body}
        </span>
        <span className="mt-1 block text-caption text-ink-faint">
          {formatWhen(row.at)}
        </span>
      </span>
    </>
  );

  const shell = cn(
    "flex items-start gap-3 rounded-card border p-4 text-left",
    warning
      ? "border-critical-line bg-critical-subtle"
      : row.read
        ? "border-border bg-surface"
        : "border-action-line bg-surface",
    row.href !== null && "transition-colors duration-fast hover:bg-canvas",
  );

  // A row with somewhere to go is a link; one without is a plain element
  // rather than a link to nowhere.
  if (row.href === null) {
    return (
      <div className={shell}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={row.href} onClick={onOpen} className={cn(shell, "w-full")}>
      {inner}
    </Link>
  );
}

/** Relative while it is recent, a date once it is not. */
function formatWhen(iso: string): string {
  const mins = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
