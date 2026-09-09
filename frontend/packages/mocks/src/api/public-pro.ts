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
    verified: found.approvalStatus === "approved",
    joinedAt: found.joinedAt,
  };

  return applyScenario(view, null);
}

/**
 * Reviews on one professional.
 *
 * Drawn from the same placeholder set the home screen uses, so the
 * `REVIEWS_ARE_PLACEHOLDER` flag governs both. When real reviews arrive they
 * will carry a `proId` and this filters on it instead of slicing.
 */
export async function getProReviews(proId: string, limit = 5) {
  await latency();
  // Deterministic per pro, so a profile does not shuffle its reviews on every
  // visit — which reads as fake even when the copy is honest about being copy.
  const offset =
    [...proId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % reviews.length;
  const rotated: Review[] = [
    ...reviews.slice(offset),
    ...reviews.slice(0, offset),
  ];
  return applyScenario(rotated.slice(0, limit), []);
}
