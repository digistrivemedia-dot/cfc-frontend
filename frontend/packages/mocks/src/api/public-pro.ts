import type { PublicPro, Review } from "@cfc/types";
import { pros } from "../fixtures/pros";
import { reviews } from "../fixtures/reviews";
import { applyScenario, latency } from "../control";

/**
 * Customer 13 — a professional's public profile.
 *
 * The projection is the point of this file. `getPro` in `api/pros.ts` returns
 * the admin shape, which includes bank details, total earnings, pending payout
 * and warning count. This returns only what a customer should see, so a
 * consumer screen cannot leak the rest even by accident.
 *
 * A blocked professional is not found rather than shown as blocked: a customer
 * has no reason to know CFC removed someone, and a profile that says so
 * invites questions support cannot answer.
 */
export async function getPublicPro(id: string) {
  await latency();

  const found = pros.find((p) => p.id === id);
  if (!found || found.blocked || found.approvalStatus !== "approved") {
    return applyScenario(null, null);
  }

  const view: PublicPro = {
    id: found.id,
    name: found.name,
    photoUrl: found.photoUrl,
    bio: found.bio,
    services: found.services,
    area: found.area,
    rating: found.rating,
    jobsCompleted: found.jobsCompleted,
    experienceYears: found.experienceYears,
    // Approval means KYC cleared, which is what the badge claims.
    //
    // Note this is constant-by-construction, not a live signal: the guard
    // above already returns null for anything other than "approved", so every
    // pro this endpoint can return is verified and the badge never hides. That
    // is correct today - an unverified pro has no public profile at all - but
    // if profiles are ever opened to pending applicants, this needs to become
    // a real check rather than a field that cannot be false.
    verified: found.approvalStatus === "approved",
    joinedAt: found.joinedAt,
  };

  return applyScenario(view, null);
}

/**
 * Reviews on one professional.
 *
 * Filtered on `proId`, so a profile shows only work this professional actually
 * did. It used to rotate the GLOBAL review pool by a hash of the pro's id -
 * deterministic, but drawn from every review on the platform, so a plumber's
 * profile listed washing-machine and salon jobs with the mismatched service
 * name printed on each review, directly beneath their own skill tags. Adjacent
 * pro ids also shared four of five reviews, since their hashes differed by one.
 *
 * Newest first: a profile is judged on recent work, and a five-year-old review
 * at the top reads as a professional with nothing lately.
 *
 * The copy is still placeholder (`REVIEWS_ARE_PLACEHOLDER`), and the screen
 * says so - but it is now at least attributed to the right person.
 */
export async function getProReviews(proId: string, limit = 5) {
  await latency();
  const mine: Review[] = reviews
    .filter((r) => r.proId === proId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return applyScenario(mine.slice(0, limit), []);
}
