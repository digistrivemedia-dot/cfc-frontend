"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type {
  MaterialRequestDetail,
  MerchantDashboardSummary,
} from "@cfc/types";
import { cn, Skeleton } from "@cfc/ui";
import { getMaterialRequests, getMerchantDashboard } from "@cfc/mocks";
import { ExpiryCountdown, StatusBadge } from "@/components/request-list";

/**
 * Dashboard (screen 3).
 *
 * Four counts and the requests still waiting on an answer. A shop owner opens
 * this between customers, so the one thing that cannot wait — an unanswered
 * request with a timer against it — is on the screen without a further tap.
 */

interface Tile {
  key: keyof MerchantDashboardSummary;
  label: string;
  icon: LucideIcon;
  href: string;
  tone: "action" | "clock" | "live" | "neutral";
}

const TILES: Tile[] = [
  {
    key: "pending",
    label: "Awaiting response",
    icon: ClipboardList,
    href: "/requests",
    tone: "clock",
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: PackageCheck,
    href: "/preparing",
    tone: "action",
  },
  {
    key: "ready",
    label: "Ready for pickup",
    icon: CheckCircle2,
    href: "/ready",
    tone: "live",
  },
  {
    key: "collectedToday",
    label: "Collected",
    icon: Truck,
    href: "/ready",
    tone: "neutral",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = React.useState<MerchantDashboardSummary | null>(
    null,
  );
  const [pending, setPending] = React.useState<MaterialRequestDetail[] | null>(
    null,
  );

  React.useEffect(() => {
    void getMerchantDashboard().then(setSummary).catch(() => setSummary(null));
    void getMaterialRequests({ status: "pending", pageSize: 10 })
      .then((page) => setPending(page.items))
      .catch(() => setPending([]));
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Material requests for Sri Balaji Electricals &amp; Hardware.
        </p>
      </header>

      {/* One column on a phone, two on a tablet, four from `lg`. */}
      <section
        aria-label="Summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {TILES.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-action"
          >
            <span className="flex items-center gap-2 text-sm text-ink-muted">
              <tile.icon
                className={cn(
                  "size-4 shrink-0",
                  tile.tone === "clock" && "text-clock-ink",
                  tile.tone === "live" && "text-live-ink",
                  tile.tone === "action" && "text-action",
                  tile.tone === "neutral" && "text-ink-faint",
                )}
                aria-hidden="true"
              />
              {tile.label}
            </span>

            {summary ? (
              <span className="mt-2 block text-3xl font-semibold tabular-nums text-ink">
                {summary[tile.key]}
              </span>
            ) : (
              <Skeleton className="mt-3 h-8 w-line-xs" />
            )}
          </Link>
        ))}
      </section>

      <section aria-labelledby="awaiting">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="awaiting"
            className="text-base font-semibold tracking-tight text-ink"
          >
            Awaiting your response
          </h2>
          <Link
            href="/requests"
            className="shrink-0 text-sm text-action hover:underline"
          >
            View all
          </Link>
        </div>

        {pending === null ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-ink-muted">
            Nothing waiting. New requests appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/requests/${request.id}`)}
                  className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-action"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">
                      {request.jobRef}
                    </span>
                    <span className="flex items-center gap-2">
                      {request.expiresAt ? (
                        <ExpiryCountdown expiresAt={request.expiresAt} />
                      ) : null}
                      <StatusBadge status={request.status} />
                    </span>
                  </span>

                  <span className="mt-1 block text-sm text-ink">
                    {request.serviceName}
                  </span>
                  <span className="mt-px block text-sm text-ink-muted">
                    {request.area} · {request.lineCount}{" "}
                    {request.lineCount === 1 ? "item" : "items"} ·{" "}
                    {request.proName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
