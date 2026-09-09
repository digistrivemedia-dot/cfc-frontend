import type { Id, Paise, Timestamp } from "./primitives";

/**
 * A job as the *pro* sees it.
 *
 * The admin's `BookingListItem` is the wrong shape here and not by a little:
 * it leads with `customerName` and `proName`, because an operator is deciding
 * who to assign. A pro already knows who they are; what they need to decide is
 * whether to take this job, and that decision is made on four things —
 *
 *   what the work is · how far away it is · when it is · **what they clear**
 *
 * The last one is `netEarningPaise`, not the booking total. A pro who decides
 * on gross and is paid net will feel short-changed every single time, and the
 * fix is to never show them gross at the point of decision.
 *
 * `distanceKm` has no equivalent on the admin type at all, and it is arguably
 * the most important field: a ₹300 job next door beats a ₹400 job across the
 * city, and only the pro can weigh that.
 */

/**
 * Where a job sits in the pro's own workflow.
 *
 * Deliberately narrower than `BookingStatus` and named from the pro's side.
 * "assigned" tells an operator a pro was allocated; it tells the pro nothing
 * about what to do next. These say what to do next.
 */
export const PRO_JOB_STATUSES = [
  /** Offered, not yet accepted. The 30-second window (Pro 12). */
  "offered",
  /** Accepted, travelling. Pro 13. */
  "on_the_way",
  /** Arrived and working. Pro 15. */
  "in_progress",
  /** A quotation is with the admin for approval. Pro 17. */
  "awaiting_quote",
  /** Scheduled for later. Pro 20, "Upcoming". */
  "upcoming",
  "completed",
  "cancelled",
] as const;

export type ProJobStatus = (typeof PRO_JOB_STATUSES)[number];

/**
 * What the pro should do, in their words.
 *
 * One mapping so a status never renders as "on_the_way" on one screen and
 * "On the way" on another.
 */
export const PRO_JOB_STATUS_LABEL: Record<ProJobStatus, string> = {
  offered: "New job",
  on_the_way: "On the way",
  in_progress: "In progress",
  awaiting_quote: "Quote sent",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

export interface ProJob {
  id: Id;
  /** Customer-facing reference, e.g. CFC12345678. Both sides quote it. */
  reference: string;
  serviceName: string;
  status: ProJobStatus;
  scheduledAt: Timestamp;

  /** First name plus an initial. A pro does not need the full name to travel. */
  customerName: string;
  area: string;
  /**
   * The full address, and the phone.
   *
   * **Null until the job is accepted.** A pro deciding on an offer needs the
   * area and the distance, not a stranger's door number — releasing the exact
   * address to three pros so one can accept would hand it to two who did not.
   */
  address: string | null;
  customerPhone: string | null;
  landmark: string | null;
  /** What the customer typed when booking. */
  notes: string | null;

  /** Straight-line distance from the pro. The figure a pro decides on. */
  distanceKm: number;
  /**
   * The customer's location, for the 100 m completion gate (Pro 15, 18).
   *
   * **Null until the job is accepted**, like the address it belongs to. A
   * coordinate is an address by another name, so withholding the street and
   * publishing the exact latitude would defeat the point entirely.
   */
  location: { lat: number; lng: number } | null;

  /** What the pro clears after CFC's commission. The decision figure. */
  netEarningPaise: Paise;
  /** Before commission. Shown on the settlement, not at the decision. */
  grossEarningPaise: Paise;

  /** The customer's completion code. Null until they are on site (Pro 18). */
  completionOtp: string | null;

  /**
   * What the service includes. Pro 21 — "service checklist".
   *
   * The admin defines this per service, so the pro and the customer are working
   * from the same list. It is what stops a "deep clean" meaning one thing to
   * the person who booked it and another to the person doing it — which is the
   * root of most disputes a platform like this sees.
   */
  checklist: string[];

  /**
   * Photos taken on this job. Empty until the pro uploads any.
   *
   * Separated because they answer different questions in a dispute: `before`
   * shows what the pro walked into, `after` shows what they left. A single
   * merged array loses exactly the distinction that matters.
   */
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
}

/** The four tabs on Pro 20. */
export const PRO_JOB_TABS = [
  "active",
  "upcoming",
  "completed",
  "cancelled",
] as const;
export type ProJobTab = (typeof PRO_JOB_TABS)[number];

export const PRO_JOB_TAB_LABEL: Record<ProJobTab, string> = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Which statuses each tab collects. */
export const PRO_JOB_TAB_STATUSES: Record<ProJobTab, ProJobStatus[]> = {
  active: ["on_the_way", "in_progress", "awaiting_quote"],
  upcoming: ["upcoming"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

/**
 * The pro's day, for Pro 10.
 *
 * `todayNetPaise` rather than gross, for the same reason as above: the number
 * on the dashboard has to be the number that reaches their bank.
 */
export interface ProDayStats {
  todayNetPaise: Paise;
  todayJobCount: number;
  /** Jobs accepted and not yet finished. */
  activeCount: number;
  /** Scheduled beyond today. */
  upcomingCount: number;
  completedTotal: number;
  rating: number;
  totalEarnedNetPaise: Paise;
}

/**
 * A charge added on site, mid-job. Pro 15.
 *
 * Deliberately not a quotation. A quotation is a priced proposal an admin
 * reviews and the customer accepts with a 50% advance; this is a small,
 * explainable addition to work already under way — a part, a second visit
 * charge. Conflating the two is how a pro ends up routing ₹4,000 of work around
 * the approval flow, so they are separate types with separate screens.
 */
export interface ExtraCharge {
  id: Id;
  /** What the charge is for, in words the customer will read. */
  label: string;
  amountPaise: Paise;
}
