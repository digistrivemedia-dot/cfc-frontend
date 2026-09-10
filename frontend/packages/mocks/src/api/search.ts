import { services } from "../fixtures/catalog";
import { applyScenario, latency } from "../control";

/** The text a service can be found by, lowercased once per row per search. */
function haystack(s: (typeof services)[number]): string {
  return `${s.name} ${s.categoryName} ${s.subCategoryName}`.toLowerCase();
}

/**
 * Customer 8, 9 — search.
 *
 * Search matches the service name, its category and its sub-category, so
 * "cleaning" finds every service under Cleaning rather than only the ones with
 * the word in their own name. A customer searching a category term and getting
 * nothing is the most common way search feels broken.
 *
 * Matching is per-WORD, not per-phrase. It used to test the whole query as one
 * substring, so "ac repair" against a catalogue entry named "AC service &
 * repair" failed outright — every word the customer typed exists in that name,
 * just not consecutively, and a real customer searching two words almost never
 * types them in the exact order and adjacency the catalogue happens to use.
 * Splitting the query and requiring each word to appear somewhere (order and
 * position both free) is what makes "ac repair" find "AC service & repair".
 */
export async function searchServices(query: string) {
  await latency();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return applyScenario([], []);

  const rows = services.filter((s) => {
    if (!s.active) return false;
    const text = haystack(s);
    return words.every((w) => text.includes(w));
  });

  return applyScenario(rows, []);
}

/**
 * Customer 8 — live suggestions while typing.
 *
 * A name only, not a full `ServiceDetail`: the dropdown shown under the search
 * box while a customer is still typing is a list of things to tap, not a
 * results grid — that is what pressing Enter (or tapping a suggestion) leads
 * to. Capped short because a dropdown that fills the screen defeats the point
 * of a quick suggestion list.
 */
export async function suggestServices(query: string, limit = 6) {
  await latency();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return applyScenario([], []);

  const rows = services
    .filter((s) => s.active && words.every((w) => haystack(s).includes(w)))
    // Most-booked first, same ordering logic as trending — a suggestion list
    // is more useful leading with what people actually book.
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, limit)
    .map((s) => ({ id: s.id, name: s.name, subCategoryName: s.subCategoryName }));

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
