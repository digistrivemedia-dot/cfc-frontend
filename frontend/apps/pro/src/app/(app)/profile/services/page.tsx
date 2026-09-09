"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, TriangleAlert, Wrench } from "lucide-react";
import { getProServices, setProServiceEnabled } from "@cfc/mocks";
import type { ProService } from "@cfc/types";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Switch,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 28 — your services.
 *
 * The inventory says "services offered, pricing per service, enable/disable
 * toggle", which reads as though a pro sets their own rates. **They do not.**
 * `PLATFORM-FACTS.md` is unambiguous: "All categories, sub-categories, services
 * and pricing are created and managed entirely by the Admin. Nothing is
 * hardcoded."
 *
 * So this screen shows the rate as a fact with its owner named, and gives the
 * pro the one control they genuinely have: whether they are taking that work
 * right now.
 *
 * The alternative — an editable price field that silently cannot save — would
 * be considerably worse. A pro would set ₹800, believe they had, take a job at
 * ₹499, and conclude the platform was underpaying them. A read-only rate with
 * "set by the CFC office" beside it answers the question instead of inviting it.
 *
 * ## Two figures per service, not one
 *
 * The rate is what the customer pays; the net is what the pro keeps. A pro
 * deciding whether a service is worth keeping switched on is deciding on the
 * second number, and making them apply 15% in their head to find it is a small
 * cruelty the platform has no reason to inflict.
 *
 * ## Switching everything off is possible, and warned about
 *
 * A pro with no services enabled receives no jobs at all. That is a legitimate
 * thing to want for a day, and a terrible thing to do by accident — so it is
 * allowed and it is stated plainly at the top of the screen.
 */

export default function ProServicesPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [rows, setRows] = React.useState<ProService[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void getProServices(proId)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  const toggle = async (service: ProService, next: boolean) => {
    setBusy(service.serviceId);
    // Applied immediately: a switch that waits on the network before moving
    // feels broken, and the failure path below puts it back.
    setRows(
      (current) =>
        current?.map((r) =>
          r.serviceId === service.serviceId ? { ...r, enabled: next } : r,
        ) ?? null,
    );
    try {
      await setProServiceEnabled(proId, service.serviceId, next);
    } catch {
      setRows(
        (current) =>
          current?.map((r) =>
            r.serviceId === service.serviceId ? { ...r, enabled: !next } : r,
          ) ?? null,
      );
      toast.error("Could not save that. Check your connection.");
    } finally {
      setBusy(null);
    }
  };

  const enabledCount = (rows ?? []).filter((r) => r.enabled).length;
  const noneOn = rows !== null && rows.length > 0 && enabledCount === 0;

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Profile
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">Your services</h1>
      <p className="mt-1 text-small text-ink-muted">
        Switch off anything you are not taking at the moment. You will not be
        sent jobs for a service that is off.
      </p>

      {/* Everything off means no work at all. Said, not discovered. */}
      {noneOn && (
        <p className="mt-4 flex items-start gap-2 rounded-card border border-critical-line bg-critical-subtle p-3 text-caption text-critical-ink">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          All of your services are switched off, so you will not receive any
          jobs — even while you are online.
        </p>
      )}

      {failed ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your services"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      ) : rows === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-block-xs w-full rounded-card" />
          <Skeleton className="h-block-xs w-full rounded-card" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<Wrench />}
            title="No services approved yet"
            description="The CFC office assigns the services you are approved for. Contact support if you expected to see something here."
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-caption text-ink-muted">
            {enabledCount} of {rows.length} switched on
          </p>

          <ul className="mt-2 space-y-3">
            {rows.map((service) => (
              <li key={service.serviceId}>
                <ServiceRow
                  service={service}
                  busy={busy === service.serviceId}
                  onToggle={(next) => void toggle(service, next)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Who owns the rate. Answered once, at the foot, where a pro who has
          just read three prices will be wondering. */}
      <section className="mt-6 rounded-card border border-border bg-canvas p-4">
        <h2 className="flex items-center gap-2 text-small font-medium text-ink">
          <Lock className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          Who sets these rates
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Rates are set per service by the CFC office, so every professional
          charges the same for the same work and a customer sees one price
          before booking. If a rate does not cover the work in your area, raise
          it with the office rather than declining jobs.
        </p>
        <Button variant="secondary" className="mt-3 w-full" asChild>
          <Link href="/support">Raise a rate with the office</Link>
        </Button>
      </section>
    </div>
  );
}

function ServiceRow({
  service,
  busy,
  onToggle,
}: {
  service: ProService;
  busy: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-card border bg-surface p-4",
        service.enabled ? "border-border" : "border-border bg-canvas",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate text-body font-semibold",
              service.enabled ? "text-ink" : "text-ink-muted",
            )}
          >
            {service.serviceName}
          </h3>
          <p className="mt-px truncate text-caption text-ink-muted">
            {service.categoryName}
          </p>
        </div>

        <Switch
          checked={service.enabled}
          disabled={busy}
          onCheckedChange={onToggle}
          aria-label={`Take ${service.serviceName} jobs`}
        />
      </div>

      {/* Both figures. The rate is what the customer pays; the net is what the
          pro decides on. */}
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <dt className="text-caption text-ink-muted">Customer pays from</dt>
          <dd className="tabular text-small font-medium text-ink">
            {formatCurrency(service.ratePaise)}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-ink-muted">You keep</dt>
          <dd className="tabular text-small font-semibold text-ink">
            {formatCurrency(service.netPaise)}
          </dd>
        </div>
      </dl>

      {service.jobsCompleted > 0 && (
        <p className="mt-2 text-caption text-ink-muted">
          {service.jobsCompleted} job
          {service.jobsCompleted === 1 ? "" : "s"} completed
        </p>
      )}

      {!service.enabled && (
        <p className="mt-2">
          <Badge tone="neutral">Not taking these jobs</Badge>
        </p>
      )}
    </article>
  );
}
