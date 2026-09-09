import type { Id, Timestamp } from "./primitives";

/**
 * Pro 31 — notifications, and Pro 30 — reviews.
 *
 * `AppNotification` already exists for the customer, and its `kind` union is
 * `booking | quotation | offer | reminder`. That is genuinely the wrong set
 * here: the inventory asks for "job alerts, payout updates, platform
 * announcements, warnings", and a **warning** is not a category a customer has
 * at all — it is a disciplinary notice with a penalty attached and an
 * escalation path behind it.
 *
 * Reusing the customer union would have meant either a fifth kind on a type
 * customer screens read, or filing warnings under "reminder", which would bury
 * the single most consequential message this app can deliver.
 */

export const PRO_NOTIFICATION_KINDS = [
  /** A job was offered, accepted elsewhere, cancelled, or rescheduled. */
  "job",
  /** Money: a settlement cleared, a payout was sent, one failed. */
  "payout",
  /** A quotation was approved or rejected by an admin. */
  "quotation",
  /** From CFC to all pros — new services, policy changes, downtime. */
  "announcement",
  /** A disciplinary notice. Never grouped with anything else. */
  "warning",
] as const;

export type ProNotificationKind = (typeof PRO_NOTIFICATION_KINDS)[number];

export const PRO_NOTIFICATION_KIND_LABEL: Record<
  ProNotificationKind,
  string
> = {
  job: "Jobs",
  payout: "Payments",
  quotation: "Quotations",
  announcement: "Announcements",
  warning: "Warnings",
};

export interface ProNotification {
  id: Id;
  kind: ProNotificationKind;
  title: string;
  body: string;
  at: Timestamp;
  read: boolean;
  /**
   * Where tapping it goes.
   *
   * Null only when there is genuinely nowhere — an announcement with no
   * further detail. A notification that opens nothing is worse than none: it
   * says something happened and leaves the pro to find it.
   */
  href: string | null;
}

/**
 * Pro 30 — the rating breakdown.
 *
 * A single average tells a pro nothing they can act on. Four 5-star jobs and
 * one 1-star average to 4.2, and so do five 4-star jobs — but only one of those
 * pros has a problem to fix. The distribution is what makes the average
 * readable.
 */
export interface RatingBreakdown {
  average: number;
  total: number;
  /** Count per star, indexed 1-5. */
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}
