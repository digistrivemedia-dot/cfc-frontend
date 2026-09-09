import { services } from "../fixtures/catalog";
import { applyScenario, latency } from "../control";

/**
 * Customer 8, 9 — search.
 *
 * Search matches the service name, its category and its sub-category, so
 * "cleaning" finds every service under Cleaning rather than only the ones with
 * the word in their own name. A customer searching a category term and getting
 * nothing is the most common way search feels broken.
 */
export async function searchServices(query: string) {
  await latency();
  const q = query.trim().toLowerCase();
  if (q === "") return applyScenario([], []);

  const rows = services.filter((s) => {
    if (!s.active) return false;
    return (
      s.name.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q) ||
      s.subCategoryName.toLowerCase().includes(q)
    );
  });

  return applyScenario(rows, []);
}

/**
 * What people are booking, as search suggestions.
 *
 * Genuinely derived from `bookingCount` rather than hand-picked — the same
 * figure "Most booked" on the home screen sorts by. A curated list wearing a
 * "trending" label is the kind of thing that quietly becomes untrue.
 */
export async function getTrendingSearches(limit = 6) {
  await latency();
  const rows = [...services]
    .filter((s) => s.active)
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, limit)
    .map((s) => s.name);

  return applyScenario(rows, []);
}
