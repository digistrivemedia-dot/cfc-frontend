"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Star } from "lucide-react";
import { chipsFor, getMyBooking, submitReview } from "@cfc/mocks";
import type { ConsumerBooking } from "@cfc/types";
import {
  Button,
  ErrorState,
  InlineAlert,
  Skeleton,
  StarRatingInput,
  Textarea,
  cn,
  toast,
} from "@cfc/ui";
import { RequireAccount } from "@/components/require-account";

/**
 * Customer 30 — Rate and review.
 *
 * Inventory: "Star rating (shown only after OTP confirmation), written
 * review, feedback chips."
 *
 * The parenthesis is the rule, not a note. A rating is only possible once the
 * customer has closed the job with their code, and the API enforces that
 * rather than trusting this screen — a review attached to a job nobody
 * confirmed is not evidence of anything.
 *
 * The rating comes first and the rest of the form appears after it, because
 * which chips are useful depends on the rating: a two-star visit needs to say
 * what went wrong, and offering "Very professional" there is tone deaf.
 */

function ReviewPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [booking, setBooking] = React.useState<ConsumerBooking | null>(null);
  const [error, setError] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [body, setBody] = React.useState("");
  const [chips, setChips] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    getMyBooking(id)
      .then((b) => (b === null ? setError(true) : setBooking(b)))
      .catch(() => setError(true));
  }, [id]);

  // Changing the rating across the 3/4 boundary swaps the chip set, so any
  // chosen chip may no longer be on offer.
  const available = React.useMemo(() => chipsFor(rating), [rating]);
  React.useEffect(() => {
    setChips((current) => current.filter((c) => available.includes(c)));
  }, [available]);

  const submit = () => {
    if (rating === 0) return;
    setBusy(true);
    submitReview({ bookingId: id, rating, body: body.trim(), chips })
      .then((result) => {
        if (result.ok) {
          setDone(true);
          return;
        }
        toast.error(
          result.reason === "already-rated"
            ? "You have already rated this job."
            : "This job cannot be rated yet.",
        );
      })
      .catch(() => toast.error("We could not send that. Try again."))
      .finally(() => setBusy(false));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-12 md:px-6">
        <ErrorState
          title="We could not find that booking"
          action={{ label: "My bookings", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
      </div>
    );
  }

  // The gate, stated rather than hidden. A customer arriving here early should
  // learn why they cannot rate yet.
  if (booking.status !== "completed") {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-12 md:px-6">
        <ErrorState
          icon={<Star />}
          title="This job is not finished yet"
          description="You can rate it once you have confirmed completion with your code."
          action={{
            label: "Back to booking",
            onClick: () => router.push(`/bookings/${booking.id}`),
          }}
        />
      </div>
    );
  }

  if (booking.rated || done) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-12 text-center md:px-6">
        <span
          className="inline-flex size-tile-lg items-center justify-center rounded-full bg-live-subtle text-live-ink"
          aria-hidden="true"
        >
          <Check className="size-8" />
        </span>
        <h1 className="mt-4 text-title font-semibold text-ink">
          {done ? "Thank you" : "Already rated"}
        </h1>
        <p className="mt-1 text-small text-ink-muted">
          {done
            ? "Your rating helps other customers choose, and helps us keep standards up."
            : "You have already rated this job."}
        </p>
        <Button variant="primary" className="mt-6 w-full" asChild>
          <Link href="/bookings">Back to my bookings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 pt-4 md:px-6 md:pb-12">
      <Link
        href={`/bookings/${booking.id}`}
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Booking details
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">How was it?</h1>
      <p className="text-small text-ink-muted">
        {booking.serviceName}
        {booking.pro !== null ? ` with ${booking.pro.name}` : ""}
      </p>

      <section className="mt-6 rounded-card border border-border bg-surface p-4">
        <StarRatingInput
          value={rating}
          onChange={setRating}
          label={`Rate ${booking.serviceName}`}
        />
      </section>

      {/* Everything below waits for a rating: the chips depend on it, and a
          form that appears in one go asks a customer to read six things before
          doing the one thing. */}
      {rating > 0 && (
        <>
          <section className="mt-4">
            <h2 className="text-small font-semibold text-ink">
              {rating > 3 ? "What went well?" : "What went wrong?"}
            </h2>
            <p className="text-caption text-ink-muted">Tap any that apply.</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {available.map((chip) => {
                const on = chips.includes(chip);
                return (
                  <li key={chip}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setChips((current) =>
                          on
                            ? current.filter((c) => c !== chip)
                            : [...current, chip],
                        )
                      }
                      className={cn(
                        "flex h-touch items-center rounded-pill border px-3 text-small",
                        "transition-colors duration-fast",
                        on
                          ? "border-action bg-action text-on-action"
                          : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
                      )}
                    >
                      {chip}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-4">
            <h2 className="text-small font-semibold text-ink">
              Anything else? <span className="font-normal text-ink-muted">(optional)</span>
            </h2>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="mt-2"
              placeholder={
                rating > 3
                  ? "What would you tell someone thinking of booking this?"
                  : "What should we have done differently?"
              }
              aria-label="Your review"
            />
          </section>

          {rating <= 2 && (
            <div className="mt-4">
              {/* A low rating gets a route to a person. The alternative is a
                  customer with a real problem leaving two stars and nothing
                  happening. */}
              <InlineAlert tone="clock" title="Something go wrong?">
                If this needs fixing, raise it with our team and we will sort it
                out — the 30-day warranty covers a return visit.{" "}
                <Link href="/support" className="underline">
                  Contact support
                </Link>
              </InlineAlert>
            </div>
          )}

          <Button
            variant="primary"
            className="mt-4 w-full"
            loading={busy}
            onClick={submit}
          >
            Submit rating
          </Button>
        </>
      )}
    </div>
  );
}

/** This is one customer's own record. A visitor without an account is offered
 *  one rather than being shown somebody else's booking. */
export default function ReviewPage() {
  return (
    <RequireAccount title="Sign in to leave a review" description="Only the customer who booked a job can rate it.">
      <ReviewPageInner />
    </RequireAccount>
  );
}
