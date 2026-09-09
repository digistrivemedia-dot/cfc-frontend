"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Phone, ShieldCheck, Star } from "lucide-react";
import { getMyBooking } from "@cfc/mocks";
import type { ConsumerBooking } from "@cfc/types";
import {
  Badge,
  Button,
  ErrorState,
  InlineAlert,
  MapView,
  OtpDisplay,
  PhotoGrid,
  Skeleton,
  Timeline,
  TimelineItem,
  cn,
  formatSchedule,
  formatTime,
} from "@cfc/ui";

/**
 * Customer 27, 28, 29 — tracking, work in progress, and the completion code.
 *
 * One route, because these are the same booking at three moments rather than
 * three screens. A customer refreshing while a professional is on site should
 * not have to find a different URL, and pushing them between routes as the
 * status changes would lose their scroll position at exactly the wrong time.
 *
 * What each state shows:
 *
 *   assigned     map, ETA countdown, timeline, the code kept hidden
 *   in_progress  the code prominent, before photos, timeline. No map — the
 *                professional has arrived, so their position is no longer the
 *                question.
 *   completed    before and after photos, the finished timeline
 *
 * The ETA counts down locally from the value the API gave. It is honest about
 * being an estimate rather than implying a live GPS feed we do not have.
 */

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [booking, setBooking] = React.useState<ConsumerBooking | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    getMyBooking(id)
      .then((b) => (b === null ? setError(true) : setBooking(b)))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not load this booking"
          action={{ label: "My bookings", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-lg rounded-card" />
      </div>
    );
  }

  const travelling = booking.status === "assigned";
  const onSite = booking.status === "in_progress";
  const finished = booking.status === "completed";

  // Nothing to track before a professional accepts, or after it is cancelled.
  if (!travelling && !onSite && !finished) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="There is nothing to track yet"
          description={
            booking.status === "pending"
              ? "We are still finding a professional. You will be notified when one accepts."
              : "This booking was cancelled."
          }
          action={{
            label: "Back to booking",
            onClick: () => router.push(`/bookings/${booking.id}`),
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      <Link
        href={`/bookings/${booking.id}`}
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Booking details
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        {travelling
          ? "On the way"
          : onSite
            ? "Work in progress"
            : "Job completed"}
      </h1>
      <p className="text-small text-ink-muted">{booking.serviceName}</p>

      {/* Customer 27 — the map and the countdown, while travelling. */}
      {travelling && booking.proPosition !== null && (
        <>
          <Eta minutes={booking.etaMinutes} />

          <section className="mt-3 overflow-hidden rounded-card border border-border bg-surface">
            <MapView
              className="h-block-lg"
              markers={[
                {
                  id: "customer",
                  x: 72,
                  y: 30,
                  kind: "customer",
                  label: "You",
                },
                {
                  id: "pro",
                  x: booking.proPosition.x,
                  y: booking.proPosition.y,
                  kind: "pro",
                  label: booking.pro?.name ?? "Professional",
                },
              ]}
              route={["pro", "customer"]}
            />
            {/* The map is a placeholder for the Maps SDK, and saying so is
                better than letting a reviewer assume the pin is live. */}
            <p className="border-t border-border px-4 py-2 text-caption text-ink-faint">
              Live position updates once the Maps integration is connected.
            </p>
          </section>
        </>
      )}

      {/* Customer 29 — the code that closes the job. */}
      {onSite && booking.completionOtp !== null && (
        <div className="mt-4">
          <OtpDisplay
            code={booking.completionOtp}
            hint="Share this with the professional only once you are happy with the work. The job cannot be closed without it."
          />
        </div>
      )}

      {onSite && (
        <div className="mt-3">
          <InlineAlert tone="info" title="Why the code matters">
            Nothing is marked complete until you share it, and your rating
            unlocks at the same time.
          </InlineAlert>
        </div>
      )}

      {/* The professional, and how to reach them. */}
      {booking.pro !== null && (travelling || onSite) && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-small font-medium text-ink">
                {booking.pro.name}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-star text-star" aria-hidden="true" />
                  <span className="tabular">{booking.pro.rating.toFixed(1)}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular">{booking.pro.jobsCompleted} jobs</span>
                <Badge tone="neutral" dot>
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Verified
                </Badge>
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" asChild>
                <a href={`tel:${booking.pro.phone}`}>
                  <Phone />
                  Call
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`sms:${booking.pro.phone}`}
                  aria-label="Message professional"
                >
                  <MessageSquare />
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Customer 28 — proof of work. */}
      {(booking.beforePhotoUrls.length > 0 ||
        booking.afterPhotoUrls.length > 0) && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">
            {finished ? "Before and after" : "Before starting"}
          </h2>

          {booking.beforePhotoUrls.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-caption text-ink-muted">Before</p>
              <PhotoGrid urls={booking.beforePhotoUrls} label="Before" />
            </div>
          )}

          {booking.afterPhotoUrls.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-caption text-ink-muted">After</p>
              <PhotoGrid urls={booking.afterPhotoUrls} label="After" />
            </div>
          )}
        </section>
      )}

      {/* Customer 27 — the job status timeline. */}
      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="mb-3 text-small font-semibold text-ink">Progress</h2>
        <Timeline>
          {booking.events.map((e, i) => {
            const last = i === booking.events.length - 1;
            return (
              <TimelineItem
                key={`${e.at}-${i}`}
                title={e.label}
                time={formatSchedule(e.at)}
                state={last && !finished ? "current" : "done"}
                last={last && finished}
              />
            );
          })}
          {/* What has not happened yet, so the customer can see what is left.
              Only while the job is live — on a finished booking it would be
              an empty promise. */}
          {onSite && (
            <TimelineItem title="Work completed" state="pending" last />
          )}
          {travelling && (
            <>
              <TimelineItem title="Arrives" state="pending" />
              <TimelineItem title="Work completed" state="pending" last />
            </>
          )}
        </Timeline>
      </section>

      {finished && !booking.rated && (
        <Button variant="primary" className="mt-4 w-full" asChild>
          <Link href={`/bookings/${booking.id}/review`}>Rate this job</Link>
        </Button>
      )}
    </div>
  );
}

/**
 * The arrival countdown.
 *
 * Counts down locally from the estimate the API gave, one minute at a time,
 * and stops at "any moment now" rather than going negative — a professional
 * running five minutes late should not be shown as "−5 min".
 *
 * The label says "about", because this is an estimate and dressing it as a
 * precise figure is how a two-minute delay becomes a complaint.
 */
function Eta({ minutes }: { minutes: number | null }) {
  const [left, setLeft] = React.useState(minutes);

  React.useEffect(() => setLeft(minutes), [minutes]);

  React.useEffect(() => {
    if (left === null || left <= 0) return;
    const timer = window.setInterval(
      () => setLeft((m) => (m === null ? null : Math.max(0, m - 1))),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, [left]);

  if (left === null) return null;

  return (
    <div
      className={cn(
        "mt-3 rounded-card border p-4 text-center",
        left > 0 ? "border-action-line bg-action-subtle" : "border-live-line bg-live-subtle",
      )}
      // The countdown changes without the customer acting, so it announces
      // itself — but politely, not interrupting whatever they are reading.
      aria-live="polite"
    >
      {left > 0 ? (
        <>
          <p className="tabular text-display font-semibold text-ink">
            {left} min
          </p>
          <p className="text-caption text-ink-muted">
            Estimated arrival · about {formatTime(new Date(Date.now() + left * 60_000))}
          </p>
        </>
      ) : (
        <p className="text-heading font-semibold text-live-ink">
          Arriving any moment now
        </p>
      )}
    </div>
  );
}
