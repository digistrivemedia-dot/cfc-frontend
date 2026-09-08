import { reviews } from "../fixtures/reviews";
import { applyScenario, latency } from "../control";

/**
 * Customer 7 — reviews shown on the home screen.
 *
 * `placeholder: true` is deliberate and load-bearing: the copy in the fixture
 * is written by us, not by customers, and the screen rendering it must label
 * it as sample content. When the client supplies real reviews, this flag flips
 * and the label disappears — the screen needs no other change.
 */
export async function getReviews(limit?: number) {
  await latency();
  const rows = [...reviews].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return applyScenario(limit ? rows.slice(0, limit) : rows, []);
}

/** Whether the reviews above are sample copy rather than real submissions. */
export const REVIEWS_ARE_PLACEHOLDER = true;
