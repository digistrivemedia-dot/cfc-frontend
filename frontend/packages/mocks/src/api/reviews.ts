import type { Review } from "@cfc/types";
import { reviews } from "../fixtures/reviews";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

/**
 * Customer 7 — reviews shown on the home screen.
 *
 * `placeholder: true` is deliberate and load-bearing: the copy in the fixture
 * is written by us, not by customers, and the screen rendering it must label
 * it as sample content. When the client supplies real reviews, this flag flips
 * and the label disappears — the screen needs no other change.
 */
export async function getReviews(limit?: number) {
  if (isLive("getReviews")) {
    return fetchJson<Review[]>("/public/reviews", {
      ...(limit !== undefined ? { query: { limit } } : {}),
    });
  }
  await latency();
  const rows = [...reviews].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return applyScenario(limit ? rows.slice(0, limit) : rows, []);
}

/**
 * Whether the reviews above are sample copy rather than real submissions.
 *
 * Derived from the live flag rather than hand-set. Once `getReviews` is served
 * by the API every row is a real customer's rating of an OTP-closed job, so
 * the "sample content" label the screens render must disappear — and tying the
 * two together means it cannot be left on by somebody forgetting to flip it.
 */
export const REVIEWS_ARE_PLACEHOLDER = !isLive("getReviews");

/**
 * Customer 12 — reviews for one service.
 *
 * The service detail screen used to call `getReviews(4)`, which returns the
 * newest reviews on the whole platform. A customer reading "Recent reviews"
 * under Bathroom Cleaning was shown reviews of plumbing and salon jobs — the
 * ratings on the same screen are service-specific, so the two disagreed in
 * plain sight.
 *
 * Matched on `serviceName` because that is what a review actually records;
 * the catalogue id is not stored on a review.
 */
export async function getServiceReviews(serviceName: string, limit?: number) {
  if (isLive("getServiceReviews")) {
    return fetchJson<Review[]>("/public/reviews", {
      query: { serviceName, ...(limit !== undefined ? { limit } : {}) },
    });
  }
  await latency();
  const rows = reviews
    .filter((r) => r.serviceName === serviceName)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return applyScenario(limit ? rows.slice(0, limit) : rows, []);
}

/** How many reviews exist for a service, for a "see all" count. */
export async function getServiceReviewCount(serviceName: string) {
  if (isLive("getServiceReviewCount")) {
    const r = await fetchJson<{ count: number }>("/public/reviews/count", {
      query: { serviceName },
    });
    return r.count;
  }
  await latency();
  return applyScenario(
    reviews.filter((r) => r.serviceName === serviceName).length,
    0,
  );
}
