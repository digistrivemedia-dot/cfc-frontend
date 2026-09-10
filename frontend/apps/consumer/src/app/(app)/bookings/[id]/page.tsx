"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  MessageSquare,
  Phone,
  Star,
} from "lucide-react";
import { cancelBooking, getMyBooking } from "@cfc/mocks";
import type { ConsumerBooking } from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  BookingStatusBadge,
  Button,
  ErrorState,
  InlineAlert,
  Skeleton,
  Timeline,
  TimelineItem,
  cn,
  formatCurrency,
  formatDayShort,
  formatSchedule,
  formatTime,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 26 — Booking detail.
 *
 * Inventory: "Full info, cancel/reschedule, contact Pro."
 *
 * What is offered depends on the state, because most of these actions are only
 * meaningful in one:
 *
 *   pending      cancel. There is nobody to contact yet.
 *   assigned     cancel, contact. Reschedule while nobody is on site.
 *   in_progress  contact only. A job under way cannot be cancelled from here.
 *   completed    rate, if not already rated. Invoice.
 *   cancelled    nothing but the record.
 *
 * A screen that shows all five actions greyed out is a screen that makes a
 * customer work out which one applies.
 */

function BookingDetailPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [booking, setBooking] = React.useState<ConsumerBooking | null>(null);
  const [error, setError] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    getMyBooking(id)
      .then((b) => (b === null ? setError(true) : setBooking(b)))
      .catch(() => setError(true));
  }, [id]);

  React.useEffect(() => load(), [load]);

  const doCancel = () => {
    setCancelling(true);
    cancelBooking(id)
      .then(() => {
        toast.success("Booking cancelled");
        setConfirmCancel(false);
        load();
      })
      .catch(() => toast.error("We could not cancel that. Try again."))
      .finally(() => setCancelling(false));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="We could not find that booking"
          description="It may have been removed."
          action={{ label: "My bookings", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-3 h-block-sm rounded-card" />
      </div>
    );
  }

  const canCancel =
    booking.status === "pending" || booking.status === "assigned";
  const canReschedule = canCancel;
  const canContact =
    booking.pro !== null &&
    (booking.status === "assigned" || booking.status === "in_progress");
  const needsRating = booking.status === "completed" && !booking.rated;

  return (
    <div className="mx-auto max-w-screen-md px-4 pt-4 md:px-6 md:pb-12">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        My bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-semibold text-ink">
            {booking.serviceName}
          </h1>
          {booking.variantName !== null && (
            <p className="text-small text-ink-muted">{booking.variantName}</p>
          )}
          <p className="tabular mt-1 select-all text-caption text-ink-faint">
            {booking.reference}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Live state first, because it is the reason a customer opened this. */}
      {booking.status === "assigned" && booking.etaMinutes !== null && (
        <div className="mt-4">
          <InlineAlert tone="info" title={`Arriving in about ${booking.etaMinutes} minutes`}>
            {booking.pro?.name ?? "Your professional"} is on the way.{" "}
            <Link href={`/bookings/${booking.id}/track`} className="underline">
              Track live
            </Link>
          </InlineAlert>
        </div>
      )}

      {booking.status === "in_progress" && booking.completionOtp !== null && (
        <div className="mt-4">
          <InlineAlert tone="clock" title="Work is under way">
            Share the code{" "}
            <span className="tabular font-semibold">{booking.completionOtp}</span>{" "}
            with the professional only once you are happy with the work.
          </InlineAlert>
        </div>
      )}

      {needsRating && (
        <div className="mt-4">
          <InlineAlert
            tone="clock"
            title="How was it?"
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/bookings/${booking.id}/review`}>Rate this job</Link>
              </Button>
            }
          >
            Your rating helps other customers choose.
          </InlineAlert>
        </div>
      )}

      {/* The professional. */}
      {booking.pro !== null && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">
            Your professional
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {/* Links to Customer 13. The public profile is a deliberate
                  subset of the admin record — no phone, no earnings. */}
              <Link
                href={`/pro/${booking.pro.id}`}
                className="text-small font-medium text-ink hover:text-action hover:underline"
              >
                {booking.pro.name}
              </Link>
              <p className="flex items-center gap-2 text-caption text-ink-muted">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-star text-star" aria-hidden="true" />
                  <span className="tabular">{booking.pro.rating.toFixed(1)}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular">{booking.pro.jobsCompleted} jobs</span>
              </p>
            </div>

            {canContact && (
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <a href={`tel:${booking.pro.phone}`}>
                    <Phone />
                    Call
                  </a>
                </Button>
                {/* `sms:` opens the phone's own messaging app, which works
                    everywhere. In-app chat with a pro is not in the
                    inventory. */}
                <Button variant="ghost" size="sm" asChild>
                  <a href={`sms:${booking.pro.phone}`} aria-label="Message professional">
                    <MessageSquare />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* The facts. */}
      <section className="mt-4 rounded-card border border-border bg-surface">
        <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
          Details
        </h2>
        <dl className="divide-y divide-border-soft">
          <Row
            icon={<CalendarDays />}
            label="Arrival window"
            value={
              <span className="tabular">
                {formatDayShort(booking.scheduledAt)},{" "}
                {formatTime(booking.scheduledAt)}
              </span>
            }
          />
          <Row
            icon={<MapPin />}
            label="Address"
            value={
              <>
                {booking.address.line1}
                {booking.address.line2 ? `, ${booking.address.line2}` : ""}
                <span className="block text-caption text-ink-muted">
                  {booking.address.area} —{" "}
                  <span className="tabular">{booking.address.pincode}</span>
                </span>
                {booking.address.landmark && (
                  <span className="block text-caption text-ink-faint">
                    {booking.address.landmark}
                  </span>
                )}
              </>
            }
          />
          <Row
            label="Paid"
            value={
              <span className="flex flex-wrap items-center gap-2">
                <span className="tabular font-medium">
                  {formatCurrency(booking.totalPaise)}
                </span>
                <Badge tone="neutral">{PAYMENT_LABEL[booking.paymentMethod]}</Badge>
              </span>
            }
          />
        </dl>
      </section>

      {/* Photos, once there are any. */}
      {(booking.beforePhotoUrls.length > 0 ||
        booking.afterPhotoUrls.length > 0) && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">Photos</h2>
          {booking.beforePhotoUrls.length > 0 && (
            <PhotoRow label="Before" urls={booking.beforePhotoUrls} />
          )}
          {booking.afterPhotoUrls.length > 0 && (
            <PhotoRow label="After" urls={booking.afterPhotoUrls} />
          )}
        </section>
      )}

      {/* What happened, when. */}
      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="mb-3 text-small font-semibold text-ink">Progress</h2>
        <Timeline>
          {booking.events.map((e, i) => (
            <TimelineItem
              key={`${e.at}-${i}`}
              title={e.label}
              time={formatSchedule(e.at)}
              state={i === booking.events.length - 1 ? "current" : "done"}
              last={i === booking.events.length - 1}
            />
          ))}
        </Timeline>
      </section>

      {/* Receipts, once the job is done. Named "Receipt" rather than
          "Invoice" because that is the word a customer looking for what they
          paid actually uses. */}
      {booking.status === "completed" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" asChild>
            <Link href={`/bookings/${booking.id}/invoice`}>View receipt</Link>
          </Button>
          <Button variant="ghost" className="flex-1" asChild>
            <Link href={`/bookings/${booking.id}/invoice?tax=1`}>Tax invoice</Link>
          </Button>
        </div>
      )}

      {(canCancel || canReschedule) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {canReschedule && (
            <Button variant="secondary" className="flex-1" asChild>
              <Link href={`/book/${booking.id}?reschedule=1`}>Reschedule</Link>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmCancel(true)}
            >
              Cancel booking
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            {/* No refund promise here. The agreement documents no cancellation
                policy, and inventing one commits support to honouring it.
                See CONSUMER-OPEN-ITEMS 1.1. */}
            <AlertDialogDescription>
              Your professional will be told. Our team will contact you about
              anything you have already paid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="critical" onClick={doCancel} disabled={cancelling}>
              Cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const PAYMENT_LABEL: Record<ConsumerBooking["paymentMethod"], string> = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
};

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode | undefined;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {icon !== undefined && (
        <span
          className="flex size-6 shrink-0 items-center justify-center text-ink-faint [&>svg]:size-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <dt
        className={cn(
          "shrink-0 text-caption text-ink-muted",
          icon === undefined ? "ml-0 w-line-sm" : "w-line-xs",
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-small text-ink">{value}</dd>
    </div>
  );
}

/**
 * Before and after.
 *
 * Tinted panels rather than `<img>`: these paths point at fixtures that do not
 * exist, and a grid of broken-image icons looks like a fault. The real photo
 * grid with a lightbox arrives with Customer 28.
 */
function PhotoRow({ label, urls }: { label: string; urls: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-caption text-ink-muted">{label}</p>
      <div className="mt-1 flex gap-2 overflow-x-auto scrollbar-none">
        {urls.map((url) => (
          <span
            key={url}
            className="aspect-card w-line-md shrink-0 rounded-control bg-action-subtle"
            role="img"
            aria-label={`${label} photo`}
          />
        ))}
      </div>
    </div>
  );
}

/** This is one customer's own record. A visitor without an account is offered
 *  one rather than being shown somebody else's booking. */
export default function BookingDetailPage() {
  return (
    <RequireAccount title="Sign in to see this booking" description="Booking details, your professional and the address are kept with your account.">
      <BookingDetailPageInner />
    </RequireAccount>
  );
}
