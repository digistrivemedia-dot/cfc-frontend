import type { Review } from "@cfc/types";
import { AREAS, CUSTOMER_NAMES, SERVICE_NAMES, seeded, pickFrom } from "./seed";

/**
 * Customer reviews.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * PLACEHOLDER COPY — REPLACE BEFORE LAUNCH
 *
 * The wording below is written by us, not by customers. It is here so the
 * review UI can be built and judged against realistic text lengths; it is not
 * evidence of anything.
 *
 * The screen that renders these must say so. An earlier version of the home
 * page carried invented reviews from invented named people under a heading
 * reading "Real reviews from real people" — that is the specific failure this
 * file exists to avoid repeating.
 *
 * When the client supplies real reviews, replace `REVIEW_BODIES` and the
 * author names, and drop the `placeholder` flag on the API. Nothing else has
 * to change.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Ratings skew high but not uniformly: a wall of fives reads as fabricated
 * even when it is not, and the UI needs to handle a 3 without breaking.
 */

const rand = seeded(20260908);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

/** Written to realistic length — one or two sentences, specific, unpolished. */
const REVIEW_BODIES: readonly { body: string; rating: number }[] = [
  { body: "Arrived on time and finished in about an hour. Explained what was wrong before starting, which I appreciated.", rating: 5 },
  { body: "Booking took two minutes and the price on the app was the price I paid. No surprises at the end.", rating: 5 },
  { body: "Good work overall. Took a little longer than the estimate because a part had to be fetched, but he kept me updated.", rating: 4 },
  { body: "The technician was polite and cleaned up afterwards. Would book again for the same job.", rating: 5 },
  { body: "Fixed the issue properly. Slightly late arriving but he called ahead to tell me, so it was fine.", rating: 4 },
  { body: "Second time using CFC. Same quality both times, which is the reason I came back.", rating: 5 },
  { body: "Work was done well but I had to follow up once about the schedule. Support sorted it the same day.", rating: 3 },
  { body: "Straightforward. Showed me the before and after photos, took the OTP, done.", rating: 5 },
];

export const reviews: Review[] = REVIEW_BODIES.map((entry, i) => {
  const daysAgo = 1 + Math.floor(rand() * 45);
  const name = pick(CUSTOMER_NAMES);
  // A published review shows a first name and a surname initial: enough to
  // read as a person, less identifying than a full name beside an area.
  const parts = name.split(" ");
  const first = parts[0] ?? name;
  const initial = parts[1]?.charAt(0);

  return {
    id: `rev_${(i + 1).toString().padStart(4, "0")}`,
    authorName: initial ? `${first} ${initial}.` : first,
    area: pick(AREAS),
    rating: entry.rating,
    body: entry.body,
    serviceName: pick(SERVICE_NAMES),
    createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    // Customer 30 gates reviews behind OTP confirmation, so a review that
    // exists at all has a completed job behind it.
    verified: true,
  };
});
