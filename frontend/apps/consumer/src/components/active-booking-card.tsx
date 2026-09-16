"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone, Star } from "lucide-react";
import type { ConsumerBooking } from "@cfc/types";
import { cn } from "@cfc/ui";

/**
 * The live job, at the top of the home screen.
 *
 * A customer with a professional on the way is not shopping. Everything below
 * this card is irrelevant to them until the job is done, so it takes the whole
 * width above the fold and answers the three questions they actually have:
 * who is coming, when do they arrive, and how do I reach them.
 *
 * It is deliberately dense rather than decorative. The status line, the ETA and
 * the phone number are the content; there is no illustration, because a person
 * checking whether a pro is late does not want a picture.
 *
 * Rendered only when a live booking exists. The ordinary case — nobody has
 * anything in flight — renders nothing at all, so this never becomes an empty
 * shelf demanding explanation.
 */

/** What each live status means to the customer, in their words. */
const STATUS_COPY: Record<string, { label: string; tone: "clock" | "live" }> = {
  pending: { label: "Finding you a professional", tone: "clock" },
  assigned: { label: "On the way", tone: "live" },
  in_progress: { label: "Work in progress", tone: "live" },
};

export function ActiveBookingCard({ booking }: { booking: ConsumerBooking }) {
  const status = STATUS_COPY[booking.status] ?? {
    label: booking.status,
    tone: "clock" as const,
  };
  const pro = booking.pro;

  return (
    <section
      aria-label="Your current booking"
      // Pale panel with a teal edge, not a dark navy card under a blue
      // radial gradient. This sits at the top of the signed-in home, so it
      // was the first thing a returning customer saw - in the one treatment
      // the approved design removed.
      className="overflow-hidden rounded-card border-l-4 border-action bg-canvas shadow-sm"
    >

      <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0 flex-1">
          {/* Status. A dot that pulses only while someone is actually moving. */}
          <p className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                status.tone === "live" ? "bg-live" : "bg-clock",
              )}
              aria-hidden="true"
            />
            <span className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {status.label}
            </span>
          </p>

          <h2 className="mt-2 text-title font-extrabold tracking-tight text-ink">
            {booking.serviceName}
          </h2>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
            <span className="tabular">{booking.reference}</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {booking.address.area}
            </span>
            {booking.etaMinutes !== null && (
              <span className="font-semibold text-brand-bright">
                Arriving in {booking.etaMinutes} min
              </span>
            )}
          </p>

          {pro && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-small text-ink">
                <span className="font-medium">{pro.name}</span>
                <span className="flex items-center gap-1 text-ink-muted">
                  <Star
                    className="size-3 text-star"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <span className="tabular">{pro.rating.toFixed(1)}</span>
                </span>
              </span>
              <a
                href={`tel:${pro.phone}`}
                className={cn(
                  "flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-1",
                  "text-small font-medium text-ink",
                  "transition-colors duration-fast hover:bg-action-subtle",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <Phone className="size-3" aria-hidden="true" />
                Call
              </a>
            </div>
          )}

          {/* The completion code, shown only once there is one to show. */}
          {booking.completionOtp && (
            <p className="mt-4 text-small text-ink-muted">
              Share this code when the work is done:{" "}
              <span className="tabular text-heading font-semibold tracking-wide text-ink">
                {booking.completionOtp}
              </span>
            </p>
          )}
        </div>

        <Link
          href={`/bookings/${booking.id}`}
          className={cn(
            "flex h-touch shrink-0 items-center gap-2 rounded-control bg-brand px-6",
            "text-body font-semibold text-on-action shadow-md",
            "transition-colors duration-fast hover:bg-brand-bright",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          {booking.status === "pending" ? "View booking" : "Track live"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
