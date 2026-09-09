import { myBookings } from "../fixtures/my-bookings";
import { applyScenario, latency } from "../control";

/**
 * Customer 30 — submitting a rating.
 *
 * Reviews are **OTP-gated** per the agreement: a rating is only possible after
 * the customer has confirmed completion with their code. That is enforced here
 * rather than only in the UI, because it is the rule that makes a rating mean
 * something — a review attached to a job the customer never confirmed is not
 * evidence of anything.
 */

/**
 * Chips a customer taps instead of writing.
 *
 * Split by sentiment, because the useful feedback differs: a low rating needs
 * to say what went wrong, and offering "Very professional" there is tone deaf.
 * Nothing here names a policy — these describe the visit, not what CFC will do
 * about it.
 */
export const POSITIVE_CHIPS = [
  "On time",
  "Very professional",
  "Neat and tidy",
  "Explained the work",
  "Fair price",
  "Would book again",
] as const;

export const NEGATIVE_CHIPS = [
  "Arrived late",
  "Work took longer",
  "Left a mess",
  "Did not explain",
  "Price was unclear",
  "Problem not fixed",
] as const;

/** A rating of 3 or less asks what went wrong rather than what went well. */
export function chipsFor(rating: number): readonly string[] {
  return rating > 3 ? POSITIVE_CHIPS : NEGATIVE_CHIPS;
}

export type ReviewSubmitFailure = "not-completed" | "already-rated";

export interface ReviewSubmitResult {
  ok: boolean;
  reason?: ReviewSubmitFailure;
}

export async function submitReview({
  bookingId,
  rating,
  body,
  chips,
}: {
  bookingId: string;
  rating: number;
  body: string;
  chips: readonly string[];
}): Promise<ReviewSubmitResult> {
  await latency();

  const booking = myBookings.find((b) => b.id === bookingId);
  if (!booking) {
    return applyScenario({ ok: false, reason: "not-completed" }, { ok: false });
  }

  // The gate. A job that is not closed has not been confirmed with the code,
  // so there is nothing to rate yet.
  if (booking.status !== "completed") {
    return applyScenario({ ok: false, reason: "not-completed" }, { ok: false });
  }
  if (booking.rated) {
    return applyScenario({ ok: false, reason: "already-rated" }, { ok: false });
  }

  void rating;
  void body;
  void chips;

  booking.rated = true;
  return applyScenario({ ok: true }, { ok: false });
}
