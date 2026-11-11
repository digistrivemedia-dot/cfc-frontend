import type { Id, Paise, Timestamp } from "./primitives";
import type { QuotationMaterialLine, QuotationStatus } from "./quotation";

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

/**
 * The quotation on a job, as the *pro* sees it. Pro 17.
 *
 * Carried on the job rather than fetched separately, and that is the point: the
 * pro's own status (`awaiting_quote`, labelled "Quote sent") is derived from
 * whether this is pending, so a job list that did not know about the quotation
 * would show "In progress" while the job screen showed "Quote sent".
 *
 * Both totals, always. When the office edits before approving, the pro has to
 * learn it from us rather than from the customer saying a different number at
 * the door — `edited` says it happened and `submittedTotalPaise` says what they
 * had asked for.
 */
export interface ProJobQuotation {
  id: Id;
  status: QuotationStatus;
  /** What the pro asked for. Never overwritten by an admin edit. */
  submittedTotalPaise: Paise;
  /** What the office approved. Equal to the above unless `edited`. */
  totalPaise: Paise;
  edited: boolean;
  /**
   * Minutes left of the **admin's edit window**. Null once it has closed.
   *
   * No longer a countdown to a decision — the quotation is already with the
   * customer. It is how long the office can still change the figures, which is
   * worth showing the pro: a quote that may still move is not one to start
   * buying parts against.
   */
  minutesRemaining: number | null;
  /**
   * When the admin's edit window closes, exactly.
   *
   * Carried as well as `minutesRemaining` so a screen can tick a real
   * second-by-second clock. Deriving mm:ss from a rounded minute count would
   * invent precision the figure does not have.
   */
  decisionBy: Timestamp;
  /** Why it was cancelled, and by whom. The pro has earned an explanation. */
  rejectionReason: string | null;

  /**
   * What the pro actually quoted.
   *
   * Carried so the work screen can show the material list and the quote form
   * can reopen with it rather than from blank. Withholding it was an omission,
   * not a decision — the pro wrote every word of it, and could previously see
   * that a quotation existed without seeing what was in it.
   */
  proNotes: string;
  materials: QuotationMaterialLine[];
  labourPaise: Paise;

  /**
   * What this professional may still do about their own quotation.
   *
   * Decided by the server and sent, rather than derived on a screen, so a
   * button and the endpoint behind it cannot disagree — an Edit that is then
   * refused is worse than no Edit at all.
   *
   * `mayRevise` closes when the **office** adjusts the quotation: two parties
   * editing a price in turns makes `submittedTotalPaise` meaningless and the
   * dispute it exists to settle unsettleable. `mayWithdraw` survives that,
   * because a professional must be able to take back a price they no longer
   * stand behind.
   *
   * Both close the moment the customer approves.
   */
  mayRevise: boolean;
  mayWithdraw: boolean;
  /** Why not, in words the pro can act on. Null when they may do both. */
  restriction: string | null;

  /**
   * Whether the customer's start code has been entered for the quoted work.
   *
   * **The code itself is never sent to the pro.** It is read aloud at the door,
   * and a code the pro could pull out of their own job response would prove
   * nothing — they could start, and be paid for, work the customer never
   * confirmed. The server compares it; this is only whether it happened.
   *
   * It gates completion: an accepted quotation that never started refuses to
   * close the job, because its money is already in the settlement.
   */
  workStarted: boolean;
}

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

  /**
   * The quotation raised on this job, or null if there is none.
   *
   * The most recent one: a rejected quote can be revised, and what the pro
   * needs to see is where they stand now.
   */
  quotation: ProJobQuotation | null;
}

/**
 * The tabs on Pro 20.
 *
 * `unclaimed` is **not** a status filter over the pro's own jobs like the
 * others — it is work belonging to nobody that this pro could take. It exists
 * because a 30-second offer that lapses leaves a booking `pending` with no
 * professional, and `selectPros` excludes anyone already offered it: with a
 * small roster the booking then has nobody left to ask and sits for ever.
 */
export const PRO_JOB_TABS = [
  "active",
  "upcoming",
  "unclaimed",
  "completed",
  "cancelled",
] as const;
export type ProJobTab = (typeof PRO_JOB_TABS)[number];

export const PRO_JOB_TAB_LABEL: Record<ProJobTab, string> = {
  active: "Active",
  upcoming: "Upcoming",
  // Not "Unclaimed": the pro reading this wants to know there is work going
  // spare, not to learn a piece of dispatch vocabulary.
  unclaimed: "Open jobs",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Which statuses each tab collects. */
export const PRO_JOB_TAB_STATUSES: Record<ProJobTab, ProJobStatus[]> = {
  active: ["on_the_way", "in_progress", "awaiting_quote"],
  upcoming: ["upcoming"],
  // Empty: this tab is not a filter over the pro's own jobs, it has its own
  // endpoint. Present so the record stays exhaustive and a new tab cannot be
  // added without deciding what it collects.
  unclaimed: [],
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
