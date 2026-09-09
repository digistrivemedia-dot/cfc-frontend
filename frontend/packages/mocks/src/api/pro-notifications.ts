import type {
  ProNotification,
  ProNotificationKind,
  RatingBreakdown,
  Review,
} from "@cfc/types";
import { pros } from "../fixtures/pros";
import { reviews } from "../fixtures/reviews";
import { applyScenario, latency } from "../control";

/**
 * Pro 30 and 31 — reviews and notifications.
 *
 * The notification list is generated per pro from their real record — their
 * warning count, their payout balance, their job history — rather than being a
 * fixed fixture. A pro with no warnings should not see a warning notification,
 * and a blocked pro should see the notice that explains it. A static list would
 * contradict the profile screen sitting one tap away.
 */

function seeded(key: string): () => number {
  let h = 2_166_136_261;
  for (const ch of key) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16_777_619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100_000) / 100_000;
  };
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

function build(proId: string): ProNotification[] {
  const pro = pros.find((p) => p.id === proId);
  if (!pro) return [];

  const rand = seeded(`notif:${proId}`);
  const out: ProNotification[] = [];
  let n = 0;
  const add = (
    kind: ProNotificationKind,
    title: string,
    body: string,
    agoMs: number,
    href: string | null,
    read: boolean,
  ) => {
    n += 1;
    out.push({
      id: `pn_${proId}_${n}`,
      kind,
      title,
      body,
      at: new Date(Date.now() - agoMs).toISOString(),
      read,
      href,
    });
  };

  // Warnings first in the generation order, and derived from the pro's real
  // warning count — so this list can never claim a warning the profile screen
  // does not show.
  if (pro.blocked) {
    add(
      "warning",
      "Your account has been blocked",
      "You will not receive job alerts until this is resolved. Contact the CFC office to find out what is needed.",
      6 * HOUR,
      "/warnings",
      false,
    );
  }
  for (let i = 0; i < Math.min(pro.warningCount, 3); i += 1) {
    add(
      "warning",
      "A warning was added to your account",
      "Read the reason and the penalty applied. Three active warnings can lead to your account being blocked.",
      (2 + i * 5) * DAY,
      "/warnings",
      i > 0,
    );
  }

  // Money. The 48-hour rule is the reason a settlement is worth a notification
  // at all — it tells the pro the wait was normal and is over.
  if (pro.pendingPayoutPaise > 0) {
    add(
      "payout",
      "Your earnings have cleared",
      "Money from your recent jobs is available to withdraw.",
      3 * HOUR,
      "/earnings/payout",
      false,
    );
  }
  add(
    "payout",
    "Payout sent to your bank",
    `Transferred to your account ending ${pro.bankAccountLast4}. It usually arrives within a day.`,
    2 * DAY,
    "/earnings/transactions",
    true,
  );

  // Jobs.
  add(
    "job",
    "A job near you was taken",
    "Another professional accepted it first. Staying online gets you alerted sooner.",
    5 * HOUR,
    "/jobs",
    rand() < 0.5,
  );
  add(
    "job",
    "Tomorrow’s job is confirmed",
    "The customer confirmed the time. Check the address before you set out.",
    20 * HOUR,
    "/jobs?tab=upcoming",
    true,
  );

  // Quotations, only where they make sense for this pro.
  add(
    "quotation",
    "Your quotation was approved",
    "The customer has been sent the quotation and pays the 50% advance to confirm.",
    28 * HOUR,
    "/jobs",
    true,
  );

  // Announcements. Real platform facts only — no invented features.
  add(
    "announcement",
    "Daily payouts are now available",
    "You can request a payout of your cleared balance any day, to your bank account or UPI.",
    4 * DAY,
    "/earnings/payout",
    true,
  );
  add(
    "announcement",
    "Reminder: photos protect you",
    "Before and after photos are your evidence if a customer reports a problem. Take them on every job.",
    9 * DAY,
    null,
    true,
  );

  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/** Per-pro, so marking one read persists for the session. */
const store = new Map<string, ProNotification[]>();

function listFor(proId: string): ProNotification[] {
  let rows = store.get(proId);
  if (rows === undefined) {
    rows = build(proId);
    store.set(proId, rows);
  }
  return rows;
}

export type ProNotificationFilter = "all" | ProNotificationKind;

export async function getProNotifications(
  proId: string,
  filter: ProNotificationFilter = "all",
): Promise<ProNotification[]> {
  await latency();
  const rows = listFor(proId);
  return applyScenario(
    filter === "all" ? rows : rows.filter((r) => r.kind === filter),
    [],
  );
}

/** Drives the bell in the shell. */
export async function getProUnreadCount(proId: string): Promise<number> {
  await latency();
  return applyScenario(listFor(proId).filter((r) => !r.read).length, 0);
}

export async function markProNotificationRead(
  proId: string,
  id: string,
): Promise<void> {
  await latency();
  const found = listFor(proId).find((r) => r.id === id);
  if (found) found.read = true;
}

export async function markAllProNotificationsRead(
  proId: string,
): Promise<void> {
  await latency();
  for (const row of listFor(proId)) row.read = true;
}

/**
 * Pro 30 — the pro's reviews.
 *
 * Drawn from the same placeholder set as the consumer side, so
 * `REVIEWS_ARE_PLACEHOLDER` governs both and there is one flag to clear when
 * real reviews arrive. Rotated deterministically per pro rather than sliced
 * from the top: a profile that shows the same three reviews for every
 * professional reads as fake even when the copy admits it is placeholder.
 */
export async function getProOwnReviews(
  proId: string,
  limit = 20,
): Promise<Review[]> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro || pro.rating === 0) return applyScenario([], []);

  const offset =
    [...proId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % reviews.length;
  const rotated = [...reviews.slice(offset), ...reviews.slice(0, offset)];
  return applyScenario(rotated.slice(0, limit), []);
}

/**
 * Pro 30 — the rating distribution.
 *
 * Derived from the pro's own average rather than counted from the review list,
 * because the review list is a placeholder set of five and the rating on the
 * pro record is the real number. Counting the placeholders would produce a
 * distribution that contradicts the average shown beside it.
 *
 * The shape is built so the counts average back to the pro's actual rating —
 * which is the only property that matters here, since a breakdown whose bars
 * do not add up to the headline is the first thing anyone checks.
 */
export async function getProRatingBreakdown(
  proId: string,
): Promise<RatingBreakdown> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  const empty: RatingBreakdown = {
    average: 0,
    total: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  if (!pro || pro.rating === 0 || pro.jobsCompleted === 0) {
    return applyScenario(empty, empty);
  }

  // Not every completed job is rated. A plausible share, held steady per pro.
  const rand = seeded(`rating:${proId}`);
  const total = Math.max(1, Math.round(pro.jobsCompleted * (0.55 + rand() * 0.25)));
  const target = pro.rating;

  // Distribute so the mean lands on the pro's rating. Start from a shape
  // weighted to the target star, then correct the remainder onto the two
  // adjacent stars so the average is exact rather than approximate.
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const floor = Math.max(1, Math.min(4, Math.floor(target)));
  const ceil = (floor + 1) as 2 | 3 | 4 | 5;
  // A small tail of lower ratings, because a profile with literally no review
  // below 4 stars across 200 jobs is not credible.
  const tail = Math.min(total - 1, Math.round(total * 0.06));
  counts[Math.max(1, floor - 1) as 1 | 2 | 3 | 4] = tail;

  // Solve the split between `floor` and `ceil` for the remaining reviews so
  // the weighted mean equals the target.
  const remaining = total - tail;
  const tailStar = Math.max(1, floor - 1);
  const tailSum = tail * tailStar;
  const wantedSum = target * total;
  // ceil * x + floor * (remaining - x) + tailSum = wantedSum
  const x = Math.round((wantedSum - tailSum - floor * remaining) / (ceil - floor));
  const atCeil = Math.max(0, Math.min(remaining, x));
  counts[ceil] += atCeil;
  counts[floor as 1 | 2 | 3 | 4] += remaining - atCeil;

  const sum =
    counts[1] * 1 + counts[2] * 2 + counts[3] * 3 + counts[4] * 4 + counts[5] * 5;

  const breakdown: RatingBreakdown = {
    // Recomputed from the counts, not copied from the record — so the number
    // shown always matches the bars underneath it.
    average: Math.round((sum / total) * 10) / 10,
    total,
    counts,
  };

  return applyScenario(breakdown, empty);
}

/**
 * Pro 30 — reply to a review.
 *
 * The inventory asks for a "response option". A pro's reply is public and
 * permanent, so the real implementation will want moderation; this exists so
 * the flow is built and the backend has a shape to fill.
 */
export async function replyToReview(
  _reviewId: string,
  body: string,
): Promise<{ body: string; at: string }> {
  await latency();
  return { body, at: new Date().toISOString() };
}
