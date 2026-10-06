import type {
  EarningsPeriod,
  EarningsSummary,
  Paise,
  ProEarning,
} from "@cfc/types";
import {
  CFC_COMMISSION_BPS,
  COMMISSION_FREE_JOBS,
} from "@cfc/types";
import { pros } from "../fixtures/pros";
import { applyScenario, latency } from "../control";

/**
 * Pro 19, 22, 23 — what a pro earns.
 *
 * The single place the pro's money is computed. Three screens read it and none
 * of them does its own arithmetic, because a pro's income assembled separately
 * on three screens is a pro's income that will eventually be three different
 * numbers.
 *
 * See `@cfc/types/pro-earnings` for the two rules: 15% commission with the
 * first 20 jobs free, and **GST is not deducted from the pro** — it applies to
 * the platform fee charged to the customer, which is a different number.
 */

/**
 * The commission on one job.
 *
 * `jobsCompletedBefore` is how many jobs the pro had finished *before* this
 * one, which is what makes the boundary unambiguous: with the offer at 20, job
 * number 20 arrives with 19 behind it and is free; job 21 arrives with 20
 * behind it and is charged.
 *
 * Rounded down. A fractional paisa in CFC's favour would mean the pro's net
 * plus the fee did not equal the gross, and a settlement that does not
 * reconcile is worse than a rupee.
 */
export function commissionFor(
  grossPaise: Paise,
  jobsCompletedBefore: number,
): { cfcFeePaise: Paise; cfcFeeBps: number; commissionFree: boolean } {
  const commissionFree = jobsCompletedBefore < COMMISSION_FREE_JOBS;
  if (commissionFree) {
    return { cfcFeePaise: 0, cfcFeeBps: 0, commissionFree: true };
  }
  return {
    cfcFeePaise: Math.floor((grossPaise * CFC_COMMISSION_BPS) / 10_000),
    cfcFeeBps: CFC_COMMISSION_BPS,
    commissionFree: false,
  };
}

/**
 * One job's settlement.
 *
 * `netPaise` is derived by subtraction rather than computed independently, so
 * gross, fee and net always reconcile exactly.
 */
export function settleJob(
  bookingId: string,
  grossPaise: Paise,
  jobsCompletedBefore: number,
  completedAt: string,
): ProEarning {
  const { cfcFeePaise, cfcFeeBps, commissionFree } = commissionFor(
    grossPaise,
    jobsCompletedBefore,
  );
  return {
    bookingId,
    grossPaise,
    cfcFeePaise,
    cfcFeeBps,
    commissionFree,
    netPaise: grossPaise - cfcFeePaise,
    completedAt,
  };
}

/**
 * A pro's settled jobs, newest first.
 *
 * Generated from the pro's own `jobsCompleted` so the ledger length matches
 * the profile — a pro showing "142 jobs" against a history of 6 is the first
 * thing that makes a screen look fake. Capped at 60 rows because no screen
 * paginates further back than that, and the summaries only span a month.
 */
const HISTORY_CAP = 60;

/** Deterministic per pro, so a reload does not reshuffle their income. */
function seededFrom(id: string): () => number {
  let h = 2_166_136_261;
  for (const ch of id) {
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

function buildHistory(proId: string): ProEarning[] {
  const pro = pros.find((p) => p.id === proId);
  if (!pro || pro.approvalStatus !== "approved") return [];

  const rand = seededFrom(proId);
  const total = pro.jobsCompleted;
  const rows = Math.min(total, HISTORY_CAP);
  const out: ProEarning[] = [];

  // Walk backwards from the most recent job. `index` is the job's position in
  // the pro's whole career, which is what decides whether the offer applied.
  for (let i = 0; i < rows; i += 1) {
    const careerIndex = total - 1 - i; // jobs completed before this one
    // A plausible spread of job values: ₹300 to ₹2,500, in whole rupees.
    const grossPaise = (30_000 + Math.floor(rand() * 220_000)) - ((30_000 + Math.floor(rand() * 220_000)) % 100);
    // Roughly one job a day going back, with some gaps.
    const daysAgo = Math.floor(i * 1.4);
    const completedAt = new Date(
      Date.now() - daysAgo * 86_400_000 - Math.floor(rand() * 36_000_000),
    ).toISOString();

    out.push(settleJob(`bkg_${proId}_${careerIndex}`, grossPaise, careerIndex, completedAt));
  }

  return out;
}

/** Built once per pro, on first request. */
const historyCache = new Map<string, ProEarning[]>();

function historyFor(proId: string): ProEarning[] {
  let rows = historyCache.get(proId);
  if (!rows) {
    rows = buildHistory(proId);
    historyCache.set(proId, rows);
  }
  return rows;
}

export async function getProEarnings(proId: string): Promise<ProEarning[]> {
  await latency();
  return applyScenario(historyFor(proId), []);
}

/** The window each period covers, as a cutoff timestamp. */
function cutoffFor(period: EarningsPeriod): number {
  const now = new Date();
  if (period === "today") {
    // Local midnight, not "24 hours ago". A pro asking what they earned today
    // means since this morning.
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
  }
  if (period === "week") {
    // Monday as the week's start, which is how a work week is counted here.
    const day = now.getDay(); // 0 = Sunday
    const daysSinceMonday = (day + 6) % 7;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysSinceMonday,
    );
    return monday.getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/**
 * Pro 22 — the headline figures for one period.
 *
 * Totals are summed from the same rows the history screen shows, so the
 * headline and the list behind it cannot disagree.
 */
export async function getEarningsSummary(
  proId: string,
  period: EarningsPeriod,
): Promise<EarningsSummary> {
  await latency();

  const cutoff = cutoffFor(period);
  const rows = historyFor(proId).filter(
    (r) => new Date(r.completedAt).getTime() >= cutoff,
  );

  const summary: EarningsSummary = {
    grossPaise: rows.reduce((t, r) => t + r.grossPaise, 0),
    cfcFeePaise: rows.reduce((t, r) => t + r.cfcFeePaise, 0),
    netPaise: rows.reduce((t, r) => t + r.netPaise, 0),
    jobCount: rows.length,
    commissionFreeJobs: rows.filter((r) => r.commissionFree).length,
  };

  return applyScenario(summary, {
    grossPaise: 0,
    cfcFeePaise: 0,
    netPaise: 0,
    jobCount: 0,
    commissionFreeJobs: 0,
  });
}

/**
 * How many commission-free jobs a pro has left.
 *
 * Pro 10 and 22 show this while it lasts. Zero means the offer is over and the
 * banner disappears — a "0 free jobs remaining" badge is worse than none.
 */
export async function getCommissionFreeRemaining(
  proId: string,
): Promise<number> {
  await latency();
  const pro = pros.find((p) => p.id === proId);
  const done = pro?.jobsCompleted ?? 0;
  return applyScenario(Math.max(0, COMMISSION_FREE_JOBS - done), 0);
}

/**
 * Pro 22 - a daily series for the chart.
 *
 * Built from the same settled rows the summary sums, so the chart and the
 * headline figure cannot disagree. Days with no work are included as zero
 * rather than skipped: a gap in a line chart reads as missing data, while a
 * zero reads as a day off, and only one of those is true.
 */
export interface EarningsPoint {
  /** "Mon 8", for the axis. */
  day: string;
  netPaise: Paise;
  jobs: number;
}

export async function getEarningsSeries(
  proId: string,
  period: EarningsPeriod,
): Promise<EarningsPoint[]> {
  await latency();

  // The SAME cutoff the summary uses.
  //
  // This previously walked back a fixed 7 or 30 days while the summary counted
  // from the start of the calendar week or month. Both are defensible windows
  // and that was exactly the problem: on a Wednesday the chart summed nine
  // days against a headline covering three, so the two disagreed by
  // Rs1,200 on the same screen. A chart that does not add up to the figure
  // above it destroys trust in both.
  const cutoff = cutoffFor(period);

  // One bucket per calendar day from the cutoff to today, inclusive. Days with
  // no work are kept as zero rather than skipped: a gap in a line reads as
  // missing data, a zero reads as a day off, and only one of those is true.
  const buckets = new Map<string, { netPaise: Paise; jobs: number }>();
  const cursor = new Date(cutoff);
  const end = new Date();
  while (cursor <= end) {
    buckets.set(cursor.toDateString(), { netPaise: 0, jobs: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of historyFor(proId)) {
    if (new Date(row.completedAt).getTime() < cutoff) continue;
    const bucket = buckets.get(new Date(row.completedAt).toDateString());
    if (bucket !== undefined) {
      bucket.netPaise += row.netPaise;
      bucket.jobs += 1;
    }
  }

  // Weekday labels while the window is short enough for them to be unique;
  // a date once it is not. "Mon" appearing five times down a month's axis is
  // worse than no label.
  const short = buckets.size <= 7;

  const points: EarningsPoint[] = [...buckets.entries()].map(([key, v]) => {
    const d = new Date(key);
    return {
      day: d.toLocaleDateString("en-IN", {
        ...(short ? { weekday: "short" as const } : {}),
        day: "numeric",
        ...(short ? {} : { month: "short" as const }),
      }),
      netPaise: v.netPaise,
      jobs: v.jobs,
    };
  });

  return applyScenario(points, []);
}

/**
 * Pro 25 - jobs completed where the money has not arrived yet.
 *
 * "Pending" here means inside the 48-hour settlement window, which is the only
 * reason a completed job's money is not in the pro's account. Saying so is the
 * whole point of the screen: a pro looking at a completed job with no payment
 * needs to know whether to wait or to raise a ticket.
 */
export interface PendingSettlement {
  earning: ProEarning;
  /** Hours until the 48-hour window closes. Negative means it is overdue. */
  hoursRemaining: number;
}

/** The agreement's settlement window. */
export const PAYOUT_WINDOW_HOURS = 48;

export async function getPendingSettlements(
  proId: string,
): Promise<PendingSettlement[]> {
  await latency();

  const cutoff = Date.now() - PAYOUT_WINDOW_HOURS * 3_600_000;
  const rows = historyFor(proId)
    .filter((r) => new Date(r.completedAt).getTime() >= cutoff)
    .map((r) => ({
      earning: r,
      hoursRemaining:
        (new Date(r.completedAt).getTime() +
          PAYOUT_WINDOW_HOURS * 3_600_000 -
          Date.now()) /
        3_600_000,
    }));

  return applyScenario(rows, []);
}

/**
 * Pro 24 - what is available to withdraw.
 *
 * The withdrawable balance is NOT the same as everything earned: money inside
 * the 48-hour window has not settled yet. Conflating the two would show a pro a
 * balance they cannot actually take, which is worse than showing a smaller
 * honest number.
 *
 * `securityBalancePaise` is the **Pro security balance**: an amount that stays
 * in the account and cannot be withdrawn. The client set it at Rs500 in their
 * revision list (Pro correction 3), which is the source this figure has - the
 * agreement itself is silent, which is why it was 0 until now
 * (PRO-OPEN-ITEMS 1.2).
 *
 * It is a RETAINED balance, not a qualifying threshold. A pro with Rs700
 * settled can withdraw Rs200, not Rs700, and not nothing - so it is subtracted
 * from what is available rather than used as a gate on whether a payout is
 * allowed at all.
 */
export interface PayoutBalance {
  /**
   * Everything that has cleared, BEFORE the security balance comes off.
   *
   * Shown so the subtraction is visible. Without it a pro sees only the figure
   * after the deduction and cannot tell whether the Rs500 has already been
   * taken or is about to be - which is the one thing they need to know before
   * tapping a button that moves their money.
   */
  settledPaise: Paise;
  /** Settled, less the security balance - what a payout would actually send. */
  availablePaise: Paise;
  /** Completed but still inside the 48-hour window. */
  pendingPaise: Paise;
  /** Held back and not withdrawable. See above. */
  securityBalancePaise: Paise;
  /** Whether a payout can be requested right now. */
  canWithdraw: boolean;
}

/**
 * Rs500, from the client's Pro correction 3: "display the text as 'After
 * minimum Pro security balance' in the amount Rs500".
 *
 * This was 0 while the agreement was silent, because a screen stating a minimum
 * the client had not agreed to is a commitment a developer is not entitled to
 * make. The client has now stated it, so it is set.
 */
const SECURITY_BALANCE_PAISE = 50_000;

export async function getPayoutBalance(proId: string): Promise<PayoutBalance> {
  await latency();

  const cutoffMs = Date.now() - PAYOUT_WINDOW_HOURS * 3_600_000;
  const rows = historyFor(proId);

  const pendingPaise = rows
    .filter((r) => new Date(r.completedAt).getTime() >= cutoffMs)
    .reduce((t, r) => t + r.netPaise, 0);

  // Settled earnings, less what the pro has already been paid. The fixture
  // carries a pending payout balance on the pro record, which is the figure
  // the admin panel settles against - so it is the source of truth here too.
  const pro = pros.find((p) => p.id === proId);
  const settledPaise = pro?.pendingPayoutPaise ?? 0;

  // What a payout would send: everything settled, less the security balance.
  // Clamped at zero so a pro below the security balance sees 0 rather than a
  // negative figure.
  const availablePaise = Math.max(0, settledPaise - SECURITY_BALANCE_PAISE);

  const balance: PayoutBalance = {
    settledPaise,
    availablePaise,
    pendingPaise,
    securityBalancePaise: SECURITY_BALANCE_PAISE,
    canWithdraw: availablePaise > 0,
  };

  return applyScenario(balance, {
    settledPaise: 0,
    availablePaise: 0,
    pendingPaise: 0,
    securityBalancePaise: SECURITY_BALANCE_PAISE,
    canWithdraw: false,
  });
}

/** Where a payout goes. Pro 7 collects these; Pro 24 chooses between them. */
export interface PayoutDestination {
  kind: "bank" | "upi";
  label: string;
  /** Last four of the account, or the UPI handle. */
  detail: string;
}

export async function getPayoutDestinations(
  proId: string,
): Promise<PayoutDestination[]> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro) return applyScenario([], []);

  const out: PayoutDestination[] = [
    {
      kind: "bank",
      label: "Bank account",
      detail: "•••• " + pro.bankAccountLast4 + " · " + pro.ifsc,
    },
  ];
  if (pro.upiId !== null) {
    out.push({ kind: "upi", label: "UPI", detail: pro.upiId });
  }
  return applyScenario(out, []);
}

export type PayoutRequest =
  | {
      ok: true;
      amountPaise: Paise;
      destination: PayoutDestination;
      expectedBy: string;
    }
  | { ok: false; reason: "below-minimum" | "nothing-available" };

/**
 * Pro 24 - request the daily payout.
 *
 * The agreement offers a daily payout with auto-transfer within 48 hours, so
 * this is a request against a settled balance rather than an instant transfer.
 * Saying "requested" and giving a date is honest; saying "paid" would not be.
 */
export async function requestPayout(
  proId: string,
  destination: PayoutDestination,
): Promise<PayoutRequest> {
  await latency();

  const balance = await getPayoutBalance(proId);
  // `availablePaise` already has the security balance taken off, so there is
  // one check, not two: nothing withdrawable covers both "no earnings yet" and
  // "everything settled is still inside the security balance".
  if (balance.availablePaise <= 0) {
    return { ok: false, reason: "nothing-available" };
  }

  return {
    ok: true,
    amountPaise: balance.availablePaise,
    destination,
    expectedBy: new Date(Date.now() + 24 * 3_600_000).toISOString(),
  };
}
