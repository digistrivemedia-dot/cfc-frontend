"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  PackageCheck,
  User,
} from "lucide-react";
import type { MaterialRequestDetail } from "@cfc/types";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  formatCurrency,
  Input,
  Skeleton,
  Textarea,
  toast,
} from "@cfc/ui";
import {
  acceptMaterialRequest,
  getMaterialRequest,
  markMaterialRequestReady,
  rejectMaterialRequest,
} from "@cfc/mocks";
import { ExpiryCountdown, StatusBadge } from "@/components/request-list";

/**
 * Request detail (screen 7) — where the work happens.
 *
 * Every line starts ticked. A shop confirms by exception: unticking the one
 * item that is out of stock is one tap, whereas ticking five items that are all
 * present is five. Leaving the remainder for the admin to place elsewhere is
 * why a partial acceptance is its own status rather than a silent edit.
 */

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = React.useState<MaterialRequestDetail | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [availableIds, setAvailableIds] = React.useState<Set<string>>(
    new Set(),
  );
  /** The shop's own price per unit, in rupees as typed. */
  const [prices, setPrices] = React.useState<Record<string, string>>({});
  const [isRejecting, setRejecting] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isBusy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setError(null);
    void getMaterialRequest(id)
      .then((row) => {
        setRequest(row);
        setAvailableIds(
          new Set(row.lines.filter((l) => l.available).map((l) => l.id)),
        );
        setPrices(
          Object.fromEntries(
            row.lines.map((line) => [
              line.id,
              line.merchantCostPaise === null
                ? ""
                : String(line.merchantCostPaise / 100),
            ]),
          ),
        );
      })
      .catch(() => setError("Could not load this request."));
  }, [id]);

  const isPending = request?.status === "pending";
  const canMarkReady =
    request?.status === "accepted" || request?.status === "partially_accepted";

  const unavailableIds = React.useMemo(
    () =>
      (request?.lines ?? [])
        .filter((line) => !availableIds.has(line.id))
        .map((line) => line.id),
    [request, availableIds],
  );

  const hasAnyAvailable = availableIds.size > 0;

  /**
   * A line's price per unit in paise, as the shop typed it. Zero until priced:
   * the shop sets the price, so there is no figure to fall back to.
   */
  const unitPaise = React.useCallback(
    (lineId: string): number => {
      const typed = prices[lineId];
      if (typed === undefined || typed.trim() === "") return 0;
      const rupees = Number(typed);
      return Number.isFinite(rupees) && rupees >= 0
        ? Math.round(rupees * 100)
        : 0;
    },
    [prices],
  );

  /** What the shop is charging, across the lines it is supplying. */
  const supplyingTotal = (request?.lines ?? [])
    .filter((line) => (isPending ? availableIds.has(line.id) : line.available))
    .reduce(
      (sum, line) =>
        sum +
        line.quantity *
          (isPending ? unitPaise(line.id) : (line.merchantCostPaise ?? 0)),
      0,
    );

  const suppliedCount = (request?.lines ?? []).filter((l) => l.available).length;

  /**
   * Every line the shop is supplying carries a price. Accepting without one
   * would commit the shop to supplying for nothing.
   */
  const isFullyPriced = (request?.lines ?? [])
    .filter((line) => availableIds.has(line.id))
    .every((line) => unitPaise(line.id) > 0);

  const onAccept = async () => {
    setBusy(true);
    try {
      const next = await acceptMaterialRequest(
        id,
        unavailableIds,
        Object.fromEntries(
          (request?.lines ?? []).map((line) => [line.id, unitPaise(line.id)]),
        ),
      );
      setRequest(next);
      toast.success(
        unavailableIds.length > 0
          ? "Accepted the items you have. CFC will place the rest."
          : "Request accepted.",
      );
    } catch {
      toast.error("Could not accept this request.");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      const next = await rejectMaterialRequest(id, rejectReason.trim());
      setRequest(next);
      setRejecting(false);
      toast.success("Request declined.");
    } catch {
      toast.error("Could not decline this request.");
    } finally {
      setBusy(false);
    }
  };

  const onMarkReady = async () => {
    setBusy(true);
    try {
      const next = await markMaterialRequestReady(id);
      setRequest(next);
      toast.success("Marked ready for pickup.");
    } catch {
      toast.error("Could not update this request.");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-lg border border-critical-line bg-critical-subtle p-6 text-sm text-critical-ink">
          {error}
        </p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <BackLink />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {request.jobRef}
          </h1>
          <StatusBadge status={request.status} />
          {isPending && request.expiresAt ? (
            <ExpiryCountdown expiresAt={request.expiresAt} />
          ) : null}
        </div>

        <p className="mt-1 text-sm text-ink">{request.serviceName}</p>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Area</dt>
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dd>{request.area}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Professional</dt>
            <User className="size-4 shrink-0" aria-hidden="true" />
            <dd>{request.proName}</dd>
          </div>
        </dl>
      </header>

      {request.proNotes ? (
        <section className="rounded-lg border border-border bg-neutral-subtle p-4">
          <h2 className="text-sm font-medium text-ink">Note from the pro</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {request.proNotes}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="items">
        <h2
          id="items"
          className="mb-3 text-base font-semibold tracking-tight text-ink"
        >
          Materials required
        </h2>

        {isPending ? (
          <p className="mb-3 text-sm text-ink-muted">
            Everything is ticked. Untick anything you do not have in stock.
          </p>
        ) : null}

        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {request.lines.map((line) => {
            const isTicked = availableIds.has(line.id);

            return (
              <li key={line.id} className="bg-surface">
                <label
                  className={`flex cursor-pointer items-start gap-3 p-4 ${
                    isPending ? "hover:bg-neutral-subtle" : "cursor-default"
                  }`}
                >
                  {isPending ? (
                    <Checkbox
                      checked={isTicked}
                      onCheckedChange={(checked) => {
                        setAvailableIds((prev) => {
                          const next = new Set(prev);
                          if (checked === true) next.add(line.id);
                          else next.delete(line.id);
                          return next;
                        });
                      }}
                      aria-label={`${line.description} in stock`}
                      className="mt-px"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`mt-1 size-1 shrink-0 rounded-full ${
                        line.available ? "bg-live-ink" : "bg-ink-faint"
                      }`}
                    />
                  )}

                  <span className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium ${
                          isPending || line.available
                            ? "text-ink"
                            : "text-ink-faint line-through"
                        }`}
                      >
                        {line.description}
                      </span>
                      <span className="mt-px block text-sm text-ink-muted">
                        {line.quantity} {line.unit}
                      </span>
                      {!isPending && !line.available ? (
                        <span className="mt-1 block text-xs text-critical-ink">
                          Not supplied
                        </span>
                      ) : null}
                    </span>

                    {/* Line total, from the shop's own price. */}
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        isTicked ? "text-ink" : "text-ink-faint line-through"
                      }`}
                    >
                      {isPending
                        ? unitPaise(line.id) === 0
                          ? "—"
                          : formatCurrency(line.quantity * unitPaise(line.id))
                        : formatCurrency(
                            line.quantity * (line.merchantCostPaise ?? 0),
                          )}
                    </span>
                  </span>
                </label>

                {isPending && isTicked ? (
                  <div className="flex flex-wrap items-center gap-3 border-t border-border bg-neutral-subtle px-4 py-3">
                    <label
                      htmlFor={`price-${line.id}`}
                      className="text-sm text-ink-muted"
                    >
                      Your price per {line.unit}
                    </label>

                    <span className="flex items-center gap-2">
                      <span className="text-sm text-ink-muted">₹</span>
                      <Input
                        id={`price-${line.id}`}
                        inputMode="decimal"
                        placeholder="0"
                        value={prices[line.id] ?? ""}
                        onChange={(event) => {
                          const next = event.target.value.replace(
                            /[^0-9.]/g,
                            "",
                          );
                          setPrices((prev) => ({ ...prev, [line.id]: next }));
                        }}
                        className="w-line-xs"
                        aria-label={`Your price per ${line.unit} for ${line.description}`}
                      />
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <dl className="mt-3 space-y-2 rounded-lg border border-border bg-neutral-subtle p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">
              {isPending ? "Items you are supplying" : "Items supplied"}
            </dt>
            <dd className="tabular-nums text-ink-muted">
              {isPending ? availableIds.size : suppliedCount} of{" "}
              {request.lines.length}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="font-medium text-ink">Your total</dt>
            <dd className="text-base font-semibold tabular-nums text-ink">
              {isPending && !isFullyPriced
                ? "—"
                : formatCurrency(supplyingTotal)}
            </dd>
          </div>

          <p className="pt-1 text-xs leading-relaxed text-ink-muted">
            You set these prices. CFC settles with you directly — nothing is
            collected through this app.
          </p>
        </dl>

        {isPending && unavailableIds.length > 0 ? (
          <p className="mt-3 rounded-md bg-clock-subtle p-3 text-sm text-clock-ink">
            {unavailableIds.length}{" "}
            {unavailableIds.length === 1 ? "item" : "items"} marked
            unavailable. CFC will source {unavailableIds.length === 1 ? "it" : "them"}{" "}
            elsewhere.
          </p>
        ) : null}
      </section>

      {/* Sticky on a phone so the action is reachable without scrolling back;
          inline from `lg`, where the whole screen is already visible. */}
      {isPending || canMarkReady ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-surface p-4 lg:static lg:border-0 lg:p-0">
          {isPending ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={isBusy}
                onClick={() => setRejecting(true)}
              >
                Decline
              </Button>
              <Button
                className="flex-1"
                disabled={isBusy || !hasAnyAvailable || !isFullyPriced}
                onClick={() => void onAccept()}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {unavailableIds.length > 0
                  ? `Accept ${availableIds.size} of ${request.lines.length}`
                  : "Accept all"}
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              disabled={isBusy}
              onClick={() => void onMarkReady()}
            >
              <PackageCheck className="size-4" aria-hidden="true" />
              Mark ready for pickup
            </Button>
          )}
        </div>
      ) : null}

      <Dialog open={isRejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              It goes back to CFC to place with another shop. Tell them why so
              the job is not held up.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Out of stock until Friday"
            aria-label="Reason for declining"
            rows={3}
          />

          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="critical"
              disabled={isBusy || !rejectReason.trim()}
              onClick={() => void onReject()}
            >
              Decline request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/requests"
      className="inline-flex items-center gap-2 text-sm text-action hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      All requests
    </Link>
  );
}
