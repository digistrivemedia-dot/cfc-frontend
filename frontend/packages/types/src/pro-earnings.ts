import type { Id, Paise, Timestamp } from "./primitives";

/**
 * What a pro actually earns from a job, itemised.
 *
 * One shape, computed in one place, so the job-completed screen (Pro 19), the
 * earnings screen (Pro 22) and the transaction history (Pro 23) cannot disagree
 * about a number. This is the pro's income; three screens assembling it
 * separately is three screens that will eventually assemble it differently.
 *
 * ## The two rules that matter
 *
 * **1. CFC commission is 15% of the pro's gross — and 0% for their first 20
 * jobs.** The onboarding offer is a real term from the agreement, so a new
 * pro's first twenty settlements show a zero fee. If that renders as a blank or
 * a missing row rather than an explicit "₹0 — first 20 jobs free", the pro
 * cannot tell the offer from a bug.
 *
 * **2. GST is NOT deducted from the pro.** CGST 9% + SGST 9% apply to the
 * *platform fee charged to the customer*, which is a different number from the
 * commission taken from the pro. On a pro screen GST is therefore a **note**,
 * never a deduction line. Showing it as a deduction would understate the pro's
 * income and is exactly the class of error that, computed the wrong way round
 * on the customer side, would have overcharged ₹279 a booking.
 *
 * So: `net = gross - cfcFee`. Nothing else comes out.
 */
export interface ProEarning {
  /** The job this settles. */
  bookingId: Id;
  /** What the customer paid for the pro's work, before CFC's cut. */
  grossPaise: Paise;
  /** CFC's commission. Zero while the free-jobs offer applies. */
  cfcFeePaise: Paise;
  /**
   * The rate actually applied, in basis points — 1500 for 15%, 0 while free.
   * Carried rather than recomputed so a screen can state the rate it charged
   * without having to know the offer's rules.
   */
  cfcFeeBps: number;
  /** True while this job fell inside the first-20-jobs offer. */
  commissionFree: boolean;
  /** What reaches the pro's wallet. `gross - cfcFee`. */
  netPaise: Paise;
  /** When the job completed. Payout follows within 48 hours. */
  completedAt: Timestamp;
}

/** CFC's commission on a pro's earning: 15%. */
export const CFC_COMMISSION_BPS = 1500;

/**
 * The onboarding offer: a pro's first 20 completed jobs carry no commission.
 *
 * The boundary is "the pro had completed fewer than this many jobs *before*
 * this one", so job 20 is free and job 21 is charged.
 */
export const COMMISSION_FREE_JOBS = 20;

/**
 * A period's earnings, for Pro 22.
 *
 * `jobCount` is here because the headline figures are meaningless without it —
 * ₹8,000 across four jobs and across forty are different weeks.
 */
export interface EarningsSummary {
  grossPaise: Paise;
  cfcFeePaise: Paise;
  netPaise: Paise;
  jobCount: number;
  /** Jobs in this period that carried no commission. */
  commissionFreeJobs: number;
}

/** The three ranges Pro 22 offers. */
export const EARNINGS_PERIODS = ["today", "week", "month"] as const;
export type EarningsPeriod = (typeof EARNINGS_PERIODS)[number];

export const EARNINGS_PERIOD_LABEL: Record<EarningsPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};
