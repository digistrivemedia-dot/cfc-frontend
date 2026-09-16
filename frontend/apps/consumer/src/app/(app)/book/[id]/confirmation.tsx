"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus, Check, MapPin } from "lucide-react";
import type { Address, ServiceDetail } from "@cfc/types";
import {
  Button,
  cn,
  formatDayShort,
  formatTime,
  usePrefersReducedMotion,
} from "@cfc/ui";

/**
 * Customer 21 — booking confirmed.
 *
 * Inventory: "Success animation, booking ID, Pro ETA, Add to Calendar."
 *
 * The reference is the most important thing here — it is what a customer
 * quotes on the phone — so it is the largest element after the tick and is
 * selectable text rather than an image.
 *
 * "Pro ETA" is shown as the arrival window the customer chose, not as a
 * countdown to a specific pro. No pro is assigned yet at this point: auto-
 * assignment notifies the three nearest and the first to accept wins, so a
 * named professional here would be a guess.
 */
export function ConfirmationStep({
  reference,
  service,
  address,
  startsAt,
}: {
  reference: string;
  service: ServiceDetail;
  address: Address | null;
  startsAt: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="mx-auto mt-8 max-w-screen-sm text-center">
      <span
        className={cn(
          // Teal, matching the approved hero's own confirmation tick
          // (.done-mark is var(--teal) on a solid fill). A pale green circle
          // was the one green thing in the consumer app and read as a system
          // status rather than as CFC confirming the job.
          "inline-flex size-tile-lg items-center justify-center rounded-full bg-action text-on-action shadow-md",
          // The animation is decoration. Anyone who has asked their system to
          // stop moving things gets the tick without the bounce.
          !reducedMotion && "animate-in",
        )}
        aria-hidden="true"
      >
        <Check className="size-8" />
      </span>

      <h1 className="mt-4 text-title font-extrabold tracking-tight text-ink md:text-title-lg">
        Your booking is confirmed
      </h1>
      <p className="mt-1 text-small text-ink-muted">
        We are finding a professional near you. You will get a notification the
        moment one accepts.
      </p>

      {/* The reference is what a customer screenshots, quotes on the phone and
          looks for in their email. It was caption-sized grey over a heading -
          the weakest treatment on the screen for the one string that has to be
          readable later. Teal head, code at display weight, selectable. */}
      <div className="cfc-card mt-6 overflow-hidden text-left">
        <div className="flex items-center gap-2 bg-action px-4 py-3 text-on-action">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-body font-bold">Booking reference</p>
        </div>

        <div className="p-4">
        <p className="tabular select-all text-title font-extrabold tracking-tight text-ink">
          {reference}
        </p>

        <dl className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <dt className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Service</dt>
            <dd className="mt-1 text-body font-semibold text-ink">{service.name}</dd>
          </div>
          <div>
            <dt className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Arrival window</dt>
            <dd className="tabular mt-1 text-body font-semibold text-ink">
              {formatDayShort(startsAt)}, {formatTime(startsAt)}
            </dd>
          </div>
          {address !== null && (
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Address</dt>
              <dd className="mt-1 flex items-start gap-1 text-body font-semibold text-ink">
                <MapPin
                  className="mt-px size-3 shrink-0 text-ink-faint"
                  aria-hidden="true"
                />
                <span>
                  {address.line1}, {address.area} —{" "}
                  <span className="tabular">{address.pincode}</span>
                </span>
              </dd>
            </div>
          )}
        </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <AddToCalendar
          reference={reference}
          serviceName={service.name}
          startsAt={startsAt}
          address={address}
        />
        <Button variant="primary" className="flex-1" asChild>
          <Link href="/bookings">View my bookings</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * "Add to Calendar", the web way.
 *
 * There is no browser API for this, so it generates an `.ics` file — which
 * every calendar app on every platform understands, including Apple Calendar
 * and Outlook, and which needs no third-party service.
 *
 * A Google Calendar link would work too but only for Google users, and
 * choosing for the customer is worse than handing them a file their own system
 * opens.
 */
function AddToCalendar({
  reference,
  serviceName,
  startsAt,
  address,
}: {
  reference: string;
  serviceName: string;
  startsAt: string;
  address: Address | null;
}) {
  const download = () => {
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const stamp = (d: Date) =>
      `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

    const location = address
      ? `${address.line1}, ${address.area}, ${address.city} ${address.pincode}`
      : "";

    // Folded at 75 octets is the spec, but every real calendar client accepts
    // unfolded lines, and folding correctly is more code than it earns here.
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//City Family Care//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${reference}@cityfamilycare`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${serviceName} — City Family Care`,
      `DESCRIPTION:Booking reference ${reference}`,
      location === "" ? "" : `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter((line) => line !== "")
      .join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reference}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="secondary" className="flex-1" onClick={download}>
      <CalendarPlus />
      Add to calendar
    </Button>
  );
}
