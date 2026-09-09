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
