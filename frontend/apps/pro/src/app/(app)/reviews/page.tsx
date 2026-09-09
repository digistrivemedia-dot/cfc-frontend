"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info, MessageSquare, Star, TriangleAlert } from "lucide-react";
import {
  REVIEWS_ARE_PLACEHOLDER,
  getProOwnReviews,
  getProRatingBreakdown,
  replyToReview,
} from "@cfc/mocks";
import type { RatingBreakdown, Review } from "@cfc/types";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  InlineAlert,
  Skeleton,
  StarRating,
  Textarea,
  cn,
  toast,
} from "@cfc/ui";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 30 — ratings and reviews.
 *
 * "All customer reviews, average rating, response option."
 *
 * ## The distribution, not just the average
 *
 * A single average tells a pro nothing they can act on. Four 5-star jobs and
 * one 1-star average to 4.2 — and so do five 4-star jobs. Only one of those
 * pros has a problem to fix, and only the distribution shows which.
 *
 * Verified: the bars average exactly to the headline figure. A breakdown whose
 * bars do not add up to the number above them is the first thing anyone checks.
 *
 * ## The 2.5 threshold is on this screen too
 *
 * It is on the profile screen as well, deliberately. This is where a pro comes
 * *after* a bad review, which is exactly the moment the consequence matters —
 * and burying the rule one screen away would mean the pro who most needs it is
 * the one who does not see it.
 *
 * ## Reviews are honestly labelled as placeholder
 *
 * `REVIEWS_ARE_PLACEHOLDER` is a real flag in the mock layer, shared with the
 * consumer side. While it is true this screen says so in plain words. The
 * alternative — presenting invented reviews as a pro's actual record — is the
 * exact failure that got the consumer home page rebuilt.
 */

/** From the agreement: below this, an account is blocked automatically. */
const AUTO_BLOCK_RATING = 2.5;

export default function ProReviewsPage() {
  const proId = React.useMemo(() => currentProId(), []);

  const [breakdown, setBreakdown] = React.useState<RatingBreakdown | null>(
    null,
  );
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(() => {
    setFailed(false);
    let cancelled = false;
    void Promise.all([getProRatingBreakdown(proId), getProOwnReviews(proId)])
      .then(([b, r]) => {
        if (cancelled) return;
        setBreakdown(b);
        setReviews(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [proId]);

  React.useEffect(() => load(), [load]);

  if (failed) {
    return (
      <div className="mx-auto max-w-detail px-4 py-12 md:px-6">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Could not load your reviews"
            description="Check your connection and try again."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-detail px-4 py-4 pb-12 md:px-6 md:py-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Profile
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">
        Ratings and reviews
      </h1>

      {breakdown === null ? (
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      ) : breakdown.total === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<Star />}
            title="No ratings yet"
            description="Customers can rate a job once they confirm your completion code. Your first ratings appear here."
          />
        </div>
      ) : (
        <BreakdownCard breakdown={breakdown} />
      )}

      {/* Reviews. */}
      <section className="mt-6">
        <h2 className="text-heading font-semibold text-ink">
          What customers said
        </h2>

        {REVIEWS_ARE_PLACEHOLDER && (
          <InlineAlert
            tone="info"
            title="Example reviews"
            className="mt-3"
          >
            These are examples, not your real reviews. Your own will appear here
            once the review system is connected.
          </InlineAlert>
        )}

        {reviews === null ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-block-xs w-full rounded-card" />
            <Skeleton className="h-block-xs w-full rounded-card" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="mt-3 rounded-card border border-border bg-surface p-4 text-small text-ink-muted">
            No written reviews yet. A customer can rate a job without leaving
            a comment.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How ratings are earned — the OTP gate is a real protection for the
          pro, not a hurdle, and worth saying so. */}
      <section className="mt-6 rounded-card border border-border bg-canvas p-4">
        <h2 className="flex items-center gap-2 text-small font-medium text-ink">
          <Info className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          How ratings work
        </h2>
        <ul className="mt-2 space-y-2 text-caption text-ink-muted">
          <li>
            A customer can only rate a job after confirming your completion
            code — so nobody can rate work you did not do.
          </li>
          <li>
            Your rating decides which jobs you are offered first. At the same
            distance, the higher-rated professional is alerted before the other.
          </li>
          <li>
            Accounts are blocked automatically below {AUTO_BLOCK_RATING}. If a
            review is unfair, raise it with the office rather than letting it
            stand.
          </li>
        </ul>
        <Button variant="secondary" className="mt-3 w-full" asChild>
          <Link href="/support">Dispute a review</Link>
        </Button>
      </section>
    </div>
  );
}

// -- The breakdown -----------------------------------------------------------

function BreakdownCard({ breakdown }: { breakdown: RatingBreakdown }) {
  const stars = [5, 4, 3, 2, 1] as const;
  const atRisk = breakdown.average < AUTO_BLOCK_RATING + 0.5;
  const max = Math.max(...stars.map((s) => breakdown.counts[s]), 1);

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-start gap-6 p-4">
        {/* The headline. */}
        <div className="shrink-0 text-center">
          <p className="tabular text-display font-semibold text-ink">
            {breakdown.average.toFixed(1)}
          </p>
          <StarRating value={breakdown.average} className="mt-1 justify-center" />
          <p className="mt-1 text-caption text-ink-muted">
            {breakdown.total} rating{breakdown.total === 1 ? "" : "s"}
          </p>
        </div>

        {/* The distribution. Bars scaled to the largest count, not to the
            total — with 107 of 156 at four stars, scaling to the total would
            make every other bar invisible. */}
        <ul className="min-w-0 flex-1 space-y-1">
          {stars.map((star) => {
            const count = breakdown.counts[star];
            const share = Math.round((count / max) * 100);
            return (
              <li key={star} className="flex items-center gap-2">
                <span className="w-4 shrink-0 tabular text-caption text-ink-muted">
                  {star}
                </span>
                <Star
                  className="size-3 shrink-0 fill-star text-star"
                  aria-hidden="true"
                />
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-canvas">
                  <span
                    className={cn(
                      "block h-full rounded-pill transition-size duration-base",
                      star >= 4 ? "bg-live" : star === 3 ? "bg-clock" : "bg-critical",
                    )}
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="w-clock shrink-0 text-right tabular text-caption text-ink-muted">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The threshold, on the screen a pro reaches after a bad review. */}
      <p
        className={cn(
          "border-t px-4 py-2 text-caption",
          atRisk
            ? "border-critical-line bg-critical-subtle text-critical-ink"
            : "border-border text-ink-muted",
        )}
      >
        {atRisk ? (
          <span className="flex items-start gap-2">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
            Your rating is close to the {AUTO_BLOCK_RATING} minimum. Accounts
            below it are blocked automatically — talk to the office if you need
            support.
          </span>
        ) : (
          `Accounts are blocked automatically if the rating falls below ${AUTO_BLOCK_RATING}.`
        )}
      </p>
    </section>
  );
}

// -- One review, with a reply ------------------------------------------------

function ReviewCard({ review }: { review: Review }) {
  const [replying, setReplying] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [sent, setSent] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const send = async () => {
    const text = body.trim();
    if (text === "") return;
    setBusy(true);
    try {
      await replyToReview(review.id, text);
      setSent(text);
      setReplying(false);
      setBody("");
      toast.success("Reply posted.");
    } catch {
      toast.error("Could not post your reply. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-small font-medium text-ink">
            {review.authorName}
          </p>
          <p className="mt-px truncate text-caption text-ink-muted">
            {review.serviceName} · {review.area}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <StarRating value={review.rating} className="justify-end" />
          <p className="mt-px text-caption text-ink-muted">
            {formatWhen(review.createdAt)}
          </p>
        </div>
      </div>

      {review.body !== "" && (
        <p className="mt-3 text-small text-ink">{review.body}</p>
      )}

      {/* Verified means CFC matched it to an OTP-closed booking. Worth
          showing: it is what makes the review trustworthy in both directions. */}
      {review.verified && (
        <p className="mt-2">
          <Badge tone="live">Verified job</Badge>
        </p>
      )}

      {/* The reply. */}
      {sent !== null ? (
        <div className="mt-3 rounded-control border-l-nav border-action bg-canvas p-3">
          <p className="text-caption font-medium text-ink">Your reply</p>
          <p className="mt-px text-small text-ink-muted">{sent}</p>
        </div>
      ) : replying ? (
        <div className="mt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Thank the customer, or explain what happened. Your reply is public."
            aria-label={`Reply to ${review.authorName}`}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-ink-faint">{body.length} / 300</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplying(false);
                  setBody("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={body.trim() === "" || busy}
                onClick={() => void send()}
              >
                {busy ? "Posting…" : "Post reply"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setReplying(true)}
        >
          <MessageSquare />
          Reply
        </Button>
      )}
    </article>
  );
}

/** "3 days ago", then a date. */
function formatWhen(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
