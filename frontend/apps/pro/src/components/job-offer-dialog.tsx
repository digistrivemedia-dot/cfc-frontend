"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MapPin, Users, X } from "lucide-react";
import {
  OFFER_WINDOW_SECONDS,
  PROS_NOTIFIED_PER_JOB,
  acceptOffer,
  declineOffer,
} from "@cfc/mocks";
import type { ProJob } from "@cfc/types";
import {
  Button,
  CountdownRing,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { useOnlineState } from "@/lib/pro-session";

/**
 * Pro 12 — the new job alert.
 *
 * The most consequential thirty seconds in the product, and the screen with the
 * least room for cleverness. Every decision here is about a pro deciding under
 * time pressure, one-handed, possibly outdoors:
 *
 * **What they decide on.** Four things, in this order of prominence: what the
 * work is, **what they earn**, how far away, and when. The earning is NET —
 * what reaches their account after CFC's commission. A pro who accepts on gross
 * and is paid net feels cheated on every job, and the fix is to never show them
 * gross at the point of decision.
 *
 * **The asymmetry is deliberate.** ACCEPT is a full-width 56px green button;
 * DECLINE is a quiet text button. The inventory asks for exactly this
 * ("[ACCEPT] big green, [DECLINE] grey small"), and it is right — the default
 * outcome of hesitating is already a decline, so the interface should not make
 * declining easy to hit by accident too.
 *
 * **No address.** Three pros see this offer and two will not take it. The
 * customer's door number is released on acceptance, not on notification.
 *
 * **A dialog, not a route.** An offer can arrive while the pro is anywhere in
 * the app, so it has to be able to appear over whatever they are looking at.
 * On mobile it fills the screen; on desktop it is a centred panel, because a
 * full-screen takeover on a 1280px monitor is a phone mock.
 *
 * ## What this cannot do, and says so elsewhere
 *
 * A web app cannot wake a sleeping phone — that needs FCM push, which is
 * backend. Recorded in PRO-OPEN-ITEMS 2.2. Here the offer arrives while the
 * app is open, which is honest and demonstrable.
 */

export function JobOfferDialog({
  offer,
  onClose,
}: {
  offer: ProJob | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { goOnJob } = useOnlineState();
  const [busy, setBusy] = React.useState(false);

  // Guards the outcome handlers: the countdown expiring and the pro pressing
  // Accept can race, and whichever lands first must be the only one that acts.
  const settledRef = React.useRef(false);
  React.useEffect(() => {
    settledRef.current = false;
  }, [offer?.id]);

  const settle = (fn: () => void) => {
    if (settledRef.current) return;
    settledRef.current = true;
    fn();
  };

  const accept = async () => {
    if (offer === null || settledRef.current) return;
    setBusy(true);
    try {
      const outcome = await acceptOffer(offer);
      if (outcome.kind === "taken") {
        // Not an error. Three pros were notified and someone else was faster —
        // the documented rule working exactly as intended.
        settle(() => {
          toast.error("Another professional accepted this job first.");
          onClose();
        });
        return;
      }
      if (outcome.kind === "accepted") {
        settle(() => {
          // The agreement's rule: accepting takes the pro out of the dispatch
          // pool, so they are not alerted for a second job while working.
          goOnJob();
          toast.success("Job accepted. You are now offline.");
          onClose();
          router.push(`/jobs/${outcome.job.id}`);
        });
      }
    } catch {
      settle(() => {
        toast.error("Could not accept the job. Check your connection.");
        onClose();
      });
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (offer === null || settledRef.current) return;
    settle(() => {
      onClose();
      toast.success("Declined. The job goes to the next professional nearby.");
    });
    // Recorded after the UI has already responded — a pro should not wait on a
    // network call to dismiss something they have finished with.
    if (offer !== null) await declineOffer(offer);
  };

  /**
   * The window closed with no answer.
   *
   * An auto-reject per the agreement, and worth wording differently from a
   * decline: the pro did not choose this, and a message implying they did is
   * both wrong and, over time, insulting.
   */
  const expire = React.useCallback(() => {
    settle(() => {
      onClose();
      toast.error("Time ran out. The job went to another professional.");
    });
  }, [onClose]);

  return (
    <Dialog
      open={offer !== null}
      // Not dismissible by clicking away or pressing Escape. A stray tap must
      // not silently throw away a job — the two buttons are the only exits.
      onOpenChange={() => undefined}
    >
      <DialogContent
        className={cn(
          "max-w-detail p-0",
          // Fills the phone; a centred panel on a desktop.
          "h-screen max-h-screen rounded-none sm:h-auto sm:max-h-none sm:rounded-card",
        )}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {offer !== null && (
          <div className="flex h-full flex-col">
            {/* The countdown, on the navy panel, above everything. It is the
                reason this screen exists and the first thing a pro looks at. */}
            <div className="flex flex-col items-center bg-structure px-5 py-6 sm:rounded-t-card">
              <DialogTitle className="text-heading font-semibold text-on-structure">
                New job for you
              </DialogTitle>
              <DialogDescription className="mt-1 text-caption text-on-structure-muted">
                Accept within {OFFER_WINDOW_SECONDS} seconds
              </DialogDescription>

              <div className="mt-4 rounded-full bg-surface p-1">
                <CountdownRing
                  // Keyed on the offer so a new offer gets a fresh deadline
                  // rather than inheriting the previous one's remaining time.
                  key={offer.id}
                  seconds={OFFER_WINDOW_SECONDS}
                  onExpire={expire}
                  paused={busy}
                />
              </div>

              {/* Why the clock matters. Without this a pro reads the timer as
                  arbitrary pressure rather than a race they can win. */}
              <p className="mt-3 flex items-center gap-2 text-caption text-on-structure-muted">
                <Users className="size-4 shrink-0" aria-hidden="true" />
                Sent to the {PROS_NOTIFIED_PER_JOB} nearest professionals —
                first to accept gets it
              </p>
            </div>

            {/* What the job is. */}
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-title font-semibold text-ink">
                {offer.serviceName}
              </h3>
              <p className="mt-1 text-small text-ink-muted">
                {offer.customerName}
              </p>

              {/* The earning, given its own panel. This is the number the
                  decision turns on, so it is not a row in a list. */}
              <div className="mt-4 rounded-card border border-live-line bg-live-subtle p-4">
                <p className="text-small text-live-ink">You earn</p>
                <p className="tabular mt-px text-display font-semibold text-live-ink">
                  {formatCurrency(offer.netEarningPaise)}
                </p>
                <p className="mt-1 text-caption text-live-ink">
                  After the CFC platform fee. Paid within 48 hours of
                  completing.
                </p>
              </div>

              <dl className="mt-4 space-y-3">
                <Fact
                  icon={<MapPin className="size-5" aria-hidden="true" />}
                  label="Distance"
                  value={`${offer.distanceKm} km away`}
                  hint={offer.area}
                />
                <Fact
                  icon={<CalendarClock className="size-5" aria-hidden="true" />}
                  label="When"
                  value={formatWhen(offer.scheduledAt)}
                />
              </dl>

              {offer.notes !== null && (
                <p className="mt-4 rounded-control bg-canvas p-3 text-small text-ink-muted">
                  “{offer.notes}”
                </p>
              )}

              {/* Said plainly, because a pro wondering why they cannot see the
                  address will assume the app is broken. */}
              <p className="mt-4 text-caption text-ink-faint">
                The full address and the customer’s number are shared as soon as
                you accept.
              </p>
            </div>

            {/* The decision. Accept dominates; decline is deliberately quiet. */}
            <div className="border-t border-border p-4">
              <Button
                variant="go"
                size="pro"
                className="w-full"
                disabled={busy}
                onClick={() => void accept()}
              >
                {busy ? "Accepting…" : "Accept job"}
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full text-ink-muted"
                disabled={busy}
                onClick={() => void decline()}
              >
                <X />
                Decline
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Fact({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-px shrink-0 text-ink-faint">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-ink-muted">{label}</dt>
        <dd className="text-body font-medium text-ink">
          {value}
          {hint !== undefined && (
            <span className="font-normal text-ink-muted"> · {hint}</span>
          )}
        </dd>
      </div>
    </div>
  );
}

/** "Now" for immediate work, a clock time for scheduled. */
function formatWhen(iso: string): string {
  const then = new Date(iso);
  const diffMin = Math.round((then.getTime() - Date.now()) / 60_000);
  if (diffMin <= 5) return "Now";
  if (diffMin < 60) return `In ${diffMin} min`;
  return `Today, ${then.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
