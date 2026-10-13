"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin } from "lucide-react";
import {
  MATERIAL_REQUEST_STATUS_LABEL,
  type MaterialRequestDetail,
  type MaterialRequestStatus,
} from "@cfc/types";
import { Badge, cn, DataTable, type Column } from "@cfc/ui";
import { getMaterialRequests } from "@cfc/mocks";

/**
 * The queue screens (4, 5, 6) are one list filtered three ways, so they share
 * this component rather than repeating a table three times. Each screen passes
 * the statuses it covers and its own empty message.
 *
 * `DataTable` collapses to the card layout below its breakpoint, which is what
 * makes these usable on a phone — a shop owner reads this standing at a counter.
 */

export interface RequestListProps {
  statuses: MaterialRequestStatus[];
  title: string;
  description: string;
  emptyMessage: string;
}

/** Tone per status, so a queue is scannable without reading the labels. */
const STATUS_TONE: Record<
  MaterialRequestStatus,
  "neutral" | "warning" | "success" | "danger"
> = {
  pending: "warning",
  accepted: "success",
  partially_accepted: "warning",
  rejected: "danger",
  ready: "success",
  collected: "neutral",
  expired: "danger",
};

export function StatusBadge({ status }: { status: MaterialRequestStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium",
        tone === "warning" && "bg-clock-subtle text-clock-ink",
        tone === "success" && "bg-live-subtle text-live-ink",
        tone === "danger" && "bg-critical-subtle text-critical-ink",
        tone === "neutral" && "bg-neutral-subtle text-neutral",
      )}
    >
      {MATERIAL_REQUEST_STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Minutes until a broadcast request lapses.
 *
 * Rendered only once mounted: a countdown computed on the server is wrong by
 * the time it reaches the browser, and differs between the two renders.
 */
export function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tick = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setLabel("Expired");
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setLabel(`${minutes}:${String(seconds).padStart(2, "0")} left`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!label) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-clock-ink">
      <Clock className="size-4" aria-hidden="true" />
      {label}
    </span>
  );
}

export function RequestList({
  statuses,
  title,
  description,
  emptyMessage,
}: RequestListProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<MaterialRequestDetail[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    setRows(null);
    void getMaterialRequests({ pageSize: 100 })
      .then((page) => {
        setRows(page.items.filter((row) => statuses.includes(row.status)));
      })
      .catch(() => setError("Could not load requests."));
    // `statuses` is a literal defined at each call site, so its identity is
    // stable for the lifetime of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(load, [load]);

  const columns: Column<MaterialRequestDetail>[] = [
    {
      id: "jobRef",
      header: "Job",
      cell: (row) => (
        <span className="font-medium text-ink">{row.jobRef}</span>
      ),
    },
    {
      id: "serviceName",
      header: "Service",
      cell: (row) => <span className="text-ink-muted">{row.serviceName}</span>,
    },
    {
      id: "area",
      header: "Area",
      cell: (row) => <span className="text-ink-muted">{row.area}</span>,
    },
    {
      id: "lineCount",
      header: "Items",
      cell: (row) => (
        <span className="tabular-nums text-ink-muted">{row.lineCount}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <StatusBadge status={row.status} />
          {row.status === "pending" && row.expiresAt ? (
            <ExpiryCountdown expiresAt={row.expiresAt} />
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <section>
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </header>

      <DataTable
        columns={columns}
        rows={rows ?? []}
        rowKey={(row) => row.id}
        loading={rows === null && !error}
        error={error}
        onRetry={load}
        caption={title}
        empty={
          <p className="text-sm text-ink-muted">{emptyMessage}</p>
        }
        onRowClick={(row) => router.push(`/requests/${row.id}`)}
        card={{
          title: (row) => (
            <span className="font-medium text-ink">{row.jobRef}</span>
          ),
          badge: (row) => <StatusBadge status={row.status} />,
          lines: [
            (row) => <span className="text-ink">{row.serviceName}</span>,
            (row) => (
              <span className="flex items-center gap-2 text-ink-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {row.area}
              </span>
            ),
            (row) =>
              row.status === "pending" && row.expiresAt ? (
                <ExpiryCountdown expiresAt={row.expiresAt} />
              ) : null,
          ],
          trailing: (row) => (
            <Badge tone="neutral">
              {row.lineCount} {row.lineCount === 1 ? "item" : "items"}
            </Badge>
          ),
        }}
      />
    </section>
  );
}
