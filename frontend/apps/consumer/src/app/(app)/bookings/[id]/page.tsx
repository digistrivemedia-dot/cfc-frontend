"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  FileText,
  Info,
  MessageSquare,
  Phone,
  Star,
} from "lucide-react";
import { cancelBooking, getMyBooking, payBooking } from "@cfc/mocks";
import { ApiError, type ConsumerBooking } from "@cfc/types";
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
  OtpDisplay,
  PhotoGrid,
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

  /**
   * The money, derived once.
   *
   * Every figure falls back to something true for a booking the server has not
   * sent the new fields for — an older deploy, or a cached response — so the
   * section degrades to the booking total rather than rendering `NaN` where a
   * customer expects a price.
   */
  const extrasPaise = booking.extraChargesPaise ?? 0;
  const quotedPaise = booking.quotedWorkPaise ?? 0;
  const payablePaise =
    booking.amountPayablePaise ?? booking.totalPaise + extrasPaise + quotedPaise;
  const paidPaise = booking.amountPaidPaise ?? 0;
  const duePaise = Math.max(0, payablePaise - paidPaise);
  /** Only worth its own section when something was actually added. */
  const hasAddedWork = extrasPaise > 0 || quotedPaise > 0;

  return (
    <div className="bg-canvas min-h-screen px-4 pb-20 pt-6 md:px-6">
      <div className="mx-auto max-w-screen-md">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        My bookings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-bold text-ink">
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

      {/* The start code, from the moment a professional is assigned.

          Shown before the completion code and with a different instruction,
          because they do opposite things: this one begins the work and the
          other one closes it. A single panel showing "your code" would have a
          customer read out the wrong one at the wrong moment. */}
      {booking.status === "assigned" && booking.startOtp !== null && (
        <OtpDisplay
          className="mt-4"
          title="Start code"
          code={booking.startOtp}
          hint="Read this out when the professional arrives, so they can begin. Not before they are at your door."
        />
      )}

      {booking.status === "in_progress" && booking.completionOtp !== null && (
        <OtpDisplay
          className="mt-4"
          tone="clock"
          title="Finishing code"
          code={booking.completionOtp}
          // Covered: this is the code that closes the job and releases
          // payment, so uncovering it should be a deliberate act once the
          // customer is actually happy with the work.
          concealed
          hint="Share this only once you are happy with the work. It closes the job."
        />
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

      {/**
       * Customer 22 — the quotation on this booking.
       *
       * **The gap this closes.** The quotation had its own screen and its own
       * notification and nothing else: a customer who opened their booking —
       * the obvious place to look — saw no sign that a professional was in
       * their house waiting on a ₹5,000 decision, no way to reach the screen
       * that would let them make it, and a "Paid" figure that still showed the
       * original booking total.
       *
       * Above the professional and the details, because while a quote is
       * waiting on the customer nothing else on this screen matters.
       */}
      {booking.quotation && (
        <BookingQuotation quote={booking.quotation} />
      )}

      {/* The professional. */}
      {booking.pro !== null && (
        <section className="mt-4 rounded-card bg-surface shadow-sm p-4">
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
      <section className="mt-4 rounded-card bg-surface shadow-sm">
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
            label="Booking"
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

      {/**
       * What the job actually comes to.
       *
       * The row above was labelled **"Paid"** and showed `totalPaise`, which
       * was wrong twice over: a cash booking is not paid until the job closes,
       * and `totalPaise` is the booking as invoiced — it excludes on-site extra
       * charges and accepted quoted work entirely. A customer who agreed to a
       * ₹250 valve and a ₹5,000 repair saw neither, and saw the original total
       * described as already paid.
       *
       * Rendered only when something was added, so an ordinary booking keeps
       * one clean figure instead of a three-line sum of itself.
       */}
      {hasAddedWork && (
        <section className="mt-4 cfc-card">
          <h2 className="border-b border-border px-4 py-3 text-small font-semibold text-ink">
            What you pay
          </h2>
          <dl className="space-y-2 p-4">
            <MoneyLine label="Booking" value={booking.totalPaise} />
            {extrasPaise > 0 && (
              <MoneyLine label="Extra charges agreed on site" value={extrasPaise} />
            )}
            {quotedPaise > 0 && (
              <MoneyLine label="Approved extra work" value={quotedPaise} />
            )}

            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
              <dt className="text-small font-bold text-ink">Total</dt>
              <dd className="tabular text-body font-extrabold text-ink">
                {formatCurrency(payablePaise)}
              </dd>
            </div>

            {paidPaise > 0 && (
              <MoneyLine label="Already paid" value={-paidPaise} />
            )}

            {duePaise > 0 && (
              <div className="mt-1 flex items-baseline justify-between gap-3 rounded-card bg-action-subtle p-3">
                <dt className="text-small font-semibold text-action">
                  {booking.status === "completed" ? "Outstanding" : "Due on completion"}
                </dt>
                <dd className="tabular text-body font-extrabold text-action">
                  {formatCurrency(duePaise)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/**
       * Customer 30 — settle the job.
       *
       * **There was no way to pay anything after booking.** A cash job was
       * marked paid by the completion itself, a wallet job paid up front, and
       * the two online methods refused at checkout — so nothing needed a
       * payment step. Quoted work broke that: it is agreed *during* the job and,
       * with the advance removed, every rupee falls due at completion.
       *
       * Only once the professional has finished, which is the moment the
       * customer agreed to pay at.
       */}
      {booking.status === "completed" && duePaise > 0 && (
        <PayNow
          bookingId={booking.id}
          duePaise={duePaise}
          onPaid={load}
        />
      )}

      {/* Photos, once there are any. */}
      {(booking.beforePhotoUrls.length > 0 ||
        booking.afterPhotoUrls.length > 0) && (
        <section className="mt-4 rounded-card bg-surface shadow-sm p-4">
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
      <section className="mt-4 rounded-card bg-surface shadow-sm p-4">
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
    </div>
  );
}

const PAYMENT_LABEL: Record<ConsumerBooking["paymentMethod"], string> = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
};

/**
 * Customer 22 — the quotation, on the booking it belongs to.
 *
 * Four states, and only the first has an action:
 *
 *   approved           waiting on the customer. The amount, and a way to decide.
 *   customer_accepted  the code to read out, or "under way" once it is spent.
 *   customer_declined  the record, so they are not asked twice.
 *   rejected           the office turned it down. Nothing was charged.
 *
 * It does **not** duplicate the decide buttons from `/quotes/[id]`. One place
 * owns accepting a quotation, with the confirmation sheet and the payment
 * choice; this card's job is to say that a decision is waiting and to get the
 * customer there. Two accept paths would be two chances to take an advance
 * twice.
 */
function BookingQuotation({
  quote,
}: {
  quote: NonNullable<ConsumerBooking["quotation"]>;
}) {
  // `pending` is the live one; `approved` survives on rows from the old
  // admin-approval flow and must stay decidable.
  const awaiting = quote.status === "pending" || quote.status === "approved";
  const accepted = quote.status === "customer_accepted";
  const declined = quote.status === "customer_declined";
  const rejected = quote.status === "rejected";

  return (
    <section
      className={cn(
        "mt-4 overflow-hidden rounded-card border",
        awaiting && "border-clock-line",
        accepted && "border-live-line",
        (declined || rejected) && "border-border",
      )}
    >
      <div
        className={cn(
          "px-4 py-3",
          awaiting && "bg-clock-subtle",
          accepted && "bg-live-subtle",
          (declined || rejected) && "bg-canvas",
        )}
      >
        <h2 className="flex items-center gap-2 text-small font-bold text-ink">
          <FileText className="size-4 shrink-0" aria-hidden="true" />
          {awaiting
            ? "Extra work needs your approval"
            : accepted
              ? "Extra work approved"
              : declined
                ? "You declined the extra work"
                : "Extra work was not approved"}
        </h2>
        {awaiting && (
          <p className="mt-px text-caption text-clock-ink">
            Nothing is charged until you approve it.
          </p>
        )}
      </div>

      <div className="p-4">
        <p className="text-small leading-relaxed text-ink-muted">
          “{quote.proNotes}”
        </p>

        {/* One figure, one moment. The advance is gone: the customer pays the
            whole quotation when the job is finished. */}
        {(awaiting || accepted) && (
          <dl className="mt-3 rounded-card border border-border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-small text-ink-muted">Quotation total</dt>
              <dd className="tabular text-body font-bold text-ink">
                {formatCurrency(quote.totalPaise)}
              </dd>
            </div>
            <p className="mt-1 text-caption text-ink-muted">
              Nothing is taken when you approve. It is added to this booking and
              paid once the work is finished.
            </p>
          </dl>
        )}

        {/* The one action. It goes to the screen that owns the decision. */}
        {awaiting && (
          <Button variant="primary" className="mt-3 w-full" asChild>
            <Link href={`/quotes/${quote.id}`}>
              Review and decide — {formatCurrency(quote.totalPaise)}
            </Link>
          </Button>
        )}

        {/* The code, repeated here on purpose: the customer may well have
            navigated back to their booking before the professional asked. */}
        {accepted && !quote.workStarted && quote.startOtp && (
          <div className="mt-3">
            <OtpDisplay
              tone="action"
              title="Code to start the extra work"
              code={quote.startOtp}
              hint="Read this to your professional when you are happy for them to begin."
            />
          </div>
        )}

        {accepted && quote.workStarted && (
          <p className="mt-3 text-caption text-live-ink">
            Your professional entered your code and is carrying out the work.
          </p>
        )}

        {rejected && (
          <p className="mt-3 text-caption text-ink-muted">
            {quote.rejectionReason !== null && quote.rejectionReason !== ""
              ? `Our team did not approve it: “${quote.rejectionReason}”`
              : "Our team did not approve it. Nothing has been charged."}
          </p>
        )}

        {declined && (
          <p className="mt-3 text-caption text-ink-muted">
            You are charged only for the original booking.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Customer 30 — pay what is outstanding.
 *
 * Three methods, and the two that cannot work say why rather than being
 * hidden. A customer who expects to pay by card should learn that online
 * payment is not set up yet, not wonder where the option went.
 *
 * `upi` and `card` come back as a 503 from the server, so the message the
 * customer reads is the server's own rather than one guessed at here. No stub
 * that auto-succeeds: that is how an unverified signature check reaches
 * production, and here it would also tell a professional they had been paid
 * when they had not.
 */
function PayNow({
  bookingId,
  duePaise,
  onPaid,
}: {
  bookingId: string;
  duePaise: number;
  onPaid: () => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);

  const pay = (method: "cash" | "wallet" | "upi" | "card") => {
    setBusy(method);
    payBooking(bookingId, method)
      .then(() => {
        toast.success(
          method === "cash"
            ? "Recorded. Thank you."
            : "Paid. Thank you.",
        );
        onPaid();
      })
      .catch((e: unknown) =>
        toast.error(
          e instanceof ApiError ? e.message : "That payment did not go through.",
        ),
      )
      .finally(() => setBusy(null));
  };

  return (
    <section className="mt-4 cfc-card overflow-hidden">
      <h2 className="bg-action px-4 py-3 text-body font-bold text-on-action">
        Pay {formatCurrency(duePaise)}
      </h2>
      <div className="p-4">
        <p className="text-small text-ink-muted">
          The work is finished. Choose how you would like to settle it.
        </p>

        <div className="mt-3 space-y-2">
          <Button
            variant="primary"
            className="w-full"
            loading={busy === "cash"}
            disabled={busy !== null}
            onClick={() => pay("cash")}
          >
            I paid {formatCurrency(duePaise)} in cash
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            loading={busy === "wallet"}
            disabled={busy !== null}
            onClick={() => pay("wallet")}
          >
            Pay from CFC wallet
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            loading={busy === "upi"}
            disabled={busy !== null}
            onClick={() => pay("upi")}
          >
            UPI or card
          </Button>
        </div>

        <p className="cfc-info mt-3">
          <Info className="cfc-info-ic size-4" aria-hidden="true" />
          <span>
            UPI and card are not switched on in this deployment yet. Cash goes
            to your professional; wallet is taken from your balance.
          </span>
        </p>
      </div>
    </section>
  );
}

/** One money line. Negative renders as a deduction rather than a minus sign. */
function MoneyLine({ label, value }: { label: string; value: number }) {
  const credit = value < 0;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "tabular text-small",
          credit ? "font-medium text-live-ink" : "text-ink",
        )}
      >
        {credit ? "− " : ""}
        {formatCurrency(Math.abs(value))}
      </dd>
    </div>
  );
}

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
 * The real photos and videos from the job.
 *
 * These were **tinted panels with nothing in them** — a `<span>` per URL,
 * sized like a photo and coloured like a placeholder. The comment explained
 * why: the paths pointed at fixtures that did not exist, and a grid of
 * broken-image icons looks like a fault.
 *
 * They point at real uploads now, so the customer sees what the professional
 * actually photographed or filmed. `PhotoGrid` handles both, and keeps the
 * broken-tile fallback for a file that genuinely cannot be loaded.
 */
function PhotoRow({ label, urls }: { label: string; urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-caption text-ink-muted">{label}</p>
      <PhotoGrid className="mt-1" urls={urls} label={label} />
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
