import type { ProJob } from "@cfc/types";
import { AREAS, CUSTOMER_NAMES, SERVICE_CATALOG } from "../fixtures/seed";
import { pros } from "../fixtures/pros";
import { commissionFor } from "./pro-earnings";
import { checklistFor } from "./pro-jobs";
import { latency } from "../control";

/**
 * Pro 12 — a job offer, and what happens to it.
 *
 * The dispatch rules from the agreement, all three of which shape this file:
 *
 *   - **3 nearest pros are notified simultaneously; first to accept wins.**
 *     So an offer can be lost to someone else, and the UI has to be able to
 *     say so — "taken by another professional" is a real outcome, not an error.
 *   - **30 seconds**, countdown shown, **auto-reject on timeout.** A timeout is
 *     a decline the pro did not make, which is worth distinguishing from one
 *     they did.
 *   - **A pro goes offline on accept.** Handled by the session, not here, but
 *     it is why accepting returns the job rather than another offer.
 *
 * Offers are generated on request rather than sitting in a fixture, because an
 * offer is an event with a deadline attached — a stored one would arrive
 * already expired.
 *
 * `applyScenario` is deliberately NOT used on `nextOffer`. Every other list in
 * the platform can honestly be empty; an offer stream returning `empty` would
 * be indistinguishable from "no work right now", which is a state the caller
 * already handles. The scenario harness still governs the latency.
 */

/** The accept window, in seconds. From the agreement. */
export const OFFER_WINDOW_SECONDS = 30;

/** How many pros are alerted for one job. From the agreement. */
export const PROS_NOTIFIED_PER_JOB = 3;

let offerSeq = 0;

function rnd(): number {
  return Math.random();
}

/**
 * The next job offered to a pro.
 *
 * Returns null when there is nothing to offer, which is the ordinary case — a
 * pro is not offered a job every time they look.
 *
 * The job comes back with `status: "offered"` and, critically, **no address and
 * no phone**: three pros see this offer and two of them will not take it, so
 * releasing the customer's door number here would hand it to strangers who
 * never came. Area and distance are what the decision needs.
 */
export async function nextOffer(proId: string): Promise<ProJob | null> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro || pro.approvalStatus !== "approved" || pro.blocked) return null;

  offerSeq += 1;

  // Offered work matches the pro's own skills. A plumber sent salon jobs is
  // the fastest way to make the whole platform look untrue.
  const matching = SERVICE_CATALOG.filter((s) => pro.services.includes(s[2]));
  const pool = matching.length > 0 ? matching : SERVICE_CATALOG.slice(0, 3);
  const svc = pool[Math.floor(rnd() * pool.length)] ?? pool[0]!;
  const [, , serviceName, minPaise, maxPaise] = svc;

  const grossEarningPaise =
    minPaise + Math.floor(rnd() * Math.max(1, maxPaise - minPaise));
  const { cfcFeePaise } = commissionFor(grossEarningPaise, pro.jobsCompleted);

  // Nearest-first dispatch, so an offer is close by. Beyond about 8 km the
  // pro is not one of the three nearest and would not have been alerted.
  const distanceKm = Math.round((0.3 + rnd() * 5.2) * 10) / 10;
  const area = rnd() < 0.6 ? pro.area : (AREAS[Math.floor(rnd() * AREAS.length)] ?? pro.area);

  const customerFull =
    CUSTOMER_NAMES[Math.floor(rnd() * CUSTOMER_NAMES.length)] ??
    CUSTOMER_NAMES[0]!;
  const parts = customerFull.split(" ");
  const shortName = parts[1]
    ? `${parts[0]} ${parts[1].charAt(0)}.`
    : (parts[0] ?? customerFull);

  return {
    id: `offer_${proId}_${offerSeq}`,
    reference: `CFC${10_000_000 + Math.floor(rnd() * 89_999_999)}`,
    serviceName,
    status: "offered",
    // Most offers are for now; some are scheduled for later today.
    scheduledAt: new Date(
      Date.now() + (rnd() < 0.7 ? 0 : 3_600_000 + rnd() * 14_400_000),
    ).toISOString(),
    customerName: shortName,
    area,
    address: null,
    customerPhone: null,
    landmark: null,
    notes:
      rnd() < 0.4 ? "Please call before arriving — the gate is locked." : null,
    distanceKm,
    // Withheld with the address. A coordinate IS an address.
    location: null,
    netEarningPaise: grossEarningPaise - cfcFeePaise,
    grossEarningPaise,
    completionOtp: null,
    // What the job involves. Carried on the OFFER as well, because "deep home
    // cleaning" covers a very different amount of work in different pros'
    // heads, and 30 seconds is not long enough to guess.
    checklist: [],
    beforePhotoUrls: [],
    afterPhotoUrls: [],
  };
}

/** How an offer ended. */
export type OfferOutcome =
  /** The pro took it. They are now offline and the job is theirs. */
  | { kind: "accepted"; job: ProJob }
  /** The pro said no. It goes to the next nearest pro. */
  | { kind: "declined" }
  /** The window closed with no answer. An auto-reject, per the agreement. */
  | { kind: "expired" }
  /** One of the other two notified pros got there first. */
  | { kind: "taken" };

/**
 * Accept an offer.
 *
 * Can fail: three pros were notified and one of the others may have accepted
 * in the seconds before this call. That is not an error condition — it is the
 * documented dispatch rule working — so it comes back as an outcome the UI can
 * explain rather than as a thrown error.
 *
 * The job returned has `status: "on_the_way"` and now carries the address and
 * phone, which the offer withheld.
 */
export async function acceptOffer(offer: ProJob): Promise<OfferOutcome> {
  await latency();

  // A small chance another pro won the race. Low enough not to be a nuisance
  // in a demo, present enough that the losing path is real and demonstrable.
  if (Math.random() < 0.08) return { kind: "taken" };

  const door = 1 + Math.floor(rnd() * 180);
  const streets = [
    "East Street",
    "Bharathi Salai",
    "Kamarajar Street",
    "Big Bazaar Road",
    "Anna Nagar Main Road",
  ];
  const street = streets[Math.floor(rnd() * streets.length)] ?? streets[0]!;

  return {
    kind: "accepted",
    job: {
      ...offer,
      status: "on_the_way",
      // Released only now that this pro is the one attending.
      address: `${door}, ${street}, ${offer.area}, Tiruchirappalli`,
      location: {
        lat: 10.7905 + (rnd() - 0.5) * 0.055,
        lng: 78.7047 + (rnd() - 0.5) * 0.055,
      },
      customerPhone: `+91 ${9_000_000_000 + Math.floor(rnd() * 999_999_999)}`,
      landmark: rnd() < 0.6 ? "Near the water tank" : null,
      checklist: checklistFor(offer.serviceName),
    },
  };
}

/**
 * Decline an offer.
 *
 * Nothing to return — the job moves on to the next nearest pro. It exists as a
 * call so the real implementation has a place to record the decline, which
 * matters: a pattern of declines is what an admin reviews.
 */
export async function declineOffer(_offer: ProJob): Promise<OfferOutcome> {
  await latency();
  return { kind: "declined" };
}
