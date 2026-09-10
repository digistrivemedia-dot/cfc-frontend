import type { Review } from "@cfc/types";
import { AREAS, CUSTOMER_NAMES, SERVICE_NAMES, seeded, pickFrom } from "./seed";
import { pros } from "./pros";

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
  { body: "Turned up within the slot I picked and got on with it. No fuss, no upselling.", rating: 5 },
  { body: "Quoted before starting and stuck to it. That is the bit I care about most.", rating: 5 },
  { body: "Decent job. One small thing needed redoing and they came back the next morning.", rating: 4 },
  { body: "Careful with the furniture and put everything back where it was. Small thing, but noticed.", rating: 5 },
  { body: "Rescheduled once from my side and it was painless. Work itself was fine.", rating: 4 },
  { body: "Knew exactly what the problem was within a few minutes. Clearly done it a hundred times.", rating: 5 },
  { body: "Fine for the price. Not the fastest, but thorough, and I would rather have that.", rating: 4 },
  { body: "Booked in the evening for the next day and it actually happened. Rare.", rating: 5 },
  { body: "Had to chase for an update on arrival time. Once he was here the work was good.", rating: 3 },
  { body: "Second visit under the warranty and there was no argument about it at all.", rating: 5 },
  { body: "Polite, wore shoe covers without being asked, explained the aftercare.", rating: 5 },
];

/**
 * Reviews, generated per service.
 *
 * Customer 12 shows reviews for the service being viewed, so every service in
 * the catalogue needs its own set. Drawing one shared pool and tagging each
 * row with a random service name — which is what this used to do — left most
 * services with nothing to show and put reviews of a plumbing job under a
 * salon appointment.
 *
 * Each service takes a rotating slice of the body pool, offset by its index,
 * so no two services show the identical run of reviews in the identical order.
 */
/**
 * Professionals a review can be attributed to.
 *
 * Only pros a customer can actually open - `getPublicPro` returns null for
 * anyone unapproved or blocked, so crediting a review to one of those would
 * point at a profile that 404s.
 */
const CREDITABLE_PROS = pros.filter(
  (p) => !p.blocked && p.approvalStatus === "approved",
);

/**
 * Which pros can be credited with a given service.
 *
 * A review is evidence that a specific professional did a specific job, so the
 * pro credited with it must actually offer that service. Matching on the
 * pro's own `services` list keeps a plumber's profile free of washing-machine
 * reviews - the exact contradiction this field was added to end.
 */
function prosFor(serviceName: string) {
  return CREDITABLE_PROS.filter((p) => p.services.includes(serviceName));
}

export const reviews: Review[] = SERVICE_NAMES.flatMap((serviceName, s) => {
  const perService = 3 + Math.floor(rand() * 3); // 3-5 reviews each
  const candidates = prosFor(serviceName);

  return Array.from({ length: perService }, (_, j) => {
    const entry = REVIEW_BODIES[(s * 3 + j) % REVIEW_BODIES.length]!;
    const daysAgo = 1 + Math.floor(rand() * 45);
    const name = pick(CUSTOMER_NAMES);
    // A published review shows a first name and a surname initial: enough to
    // read as a person, less identifying than a full name beside an area.
    const parts = name.split(" ");
    const first = parts[0] ?? name;
    const initial = parts[1]?.charAt(0);

    // Spread the service's reviews across whichever pros offer it, rather than
    // heaping them on one. Null when no approved pro offers this service -
    // better an unattributed review than one credited to someone who does not
    // do the work.
    const credited = candidates.length > 0
      ? candidates[j % candidates.length]!.id
      : null;

    return {
      id: `rev_${s.toString().padStart(2, "0")}_${j.toString().padStart(2, "0")}`,
      authorName: initial ? `${first} ${initial}.` : first,
      area: pick(AREAS),
      rating: entry.rating,
      body: entry.body,
      serviceName,
      proId: credited,
      createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      // Customer 30 gates reviews behind OTP confirmation, so a review that
      // exists at all has a completed job behind it.
      verified: true,
    };
  });
});
