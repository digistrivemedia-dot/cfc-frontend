import type {
  ProDayStats,
  ProJob,
  ProJobStatus,
  ProJobTab,
} from "@cfc/types";
import { PRO_JOB_TAB_STATUSES } from "@cfc/types";
import { AREAS, CUSTOMER_NAMES, SERVICE_CATALOG } from "../fixtures/seed";
import { pros } from "../fixtures/pros";
import { commissionFor } from "./pro-earnings";
import { applyScenario, latency } from "../control";

/**
 * Pro 10, 12, 13, 15, 18, 20, 21 — the pro's jobs.
 *
 * Generated per pro rather than filtered out of the admin `bookings` fixture,
 * because the two are answering different questions. The admin fixture is a
 * platform-wide table with a `proName` column; a pro needs *their* jobs with a
 * distance and a net figure, and there is nothing in the admin rows to derive a
 * distance from.
 *
 * Deterministic per pro, so a reload does not reshuffle someone's day.
 */

/** Deterministic hash-seeded generator. Same pro, same jobs, every load. */
function seededFrom(key: string): () => number {
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

/**
 * A customer's name as the pro sees it before accepting.
 *
 * First name plus a surname initial. A pro needs enough to greet someone and
 * confirm they have the right door; they do not need the full legal name of
 * every customer whose job they were merely *offered*. Three pros are alerted
 * per job and only one accepts — the other two should not walk away with a
 * complete identity.
 */
function shortName(full: string): string {
  const parts = full.split(" ");
  const first = parts[0] ?? full;
  const surname = parts[1];
  return surname ? `${first} ${surname.charAt(0)}.` : first;
}

/** A plausible Trichy door number. Only released after acceptance. */
function addressFor(rand: () => number, area: string): string {
  const door = 1 + Math.floor(rand() * 180);
  const streets = [
    "East Street",
    "Bharathi Salai",
    "Kamarajar Street",
    "Big Bazaar Road",
    "Anna Nagar Main Road",
    "Gandhi Market Road",
  ];
  const street = streets[Math.floor(rand() * streets.length)] ?? streets[0];
  return `${door}, ${street}, ${area}, Tiruchirappalli`;
}

/** The completion code the customer reads out. Pro 18. */
function otpFor(rand: () => number): string {
  return String(1000 + Math.floor(rand() * 9000));
}

interface Built {
  jobs: ProJob[];
  stats: ProDayStats;
}

function build(proId: string): Built {
  const pro = pros.find((p) => p.id === proId);
  if (!pro || pro.approvalStatus !== "approved") {
    return {
      jobs: [],
      stats: {
        todayNetPaise: 0,
        todayJobCount: 0,
        activeCount: 0,
        upcomingCount: 0,
        completedTotal: 0,
        rating: 0,
        totalEarnedNetPaise: 0,
      },
    };
  }

  const rand = seededFrom(`jobs:${proId}`);
  const jobs: ProJob[] = [];

  // The pro's own skills decide what they are offered. A plumber being sent
  // salon jobs is the fastest way to make a demo look untrue.
  const skills = pro.services;
  const matching = SERVICE_CATALOG.filter((s) => skills.includes(s[2]));
  const pool = matching.length > 0 ? matching : SERVICE_CATALOG.slice(0, 3);

  let seq = 0;
  const make = (
    status: ProJobStatus,
    offsetMs: number,
    opts: { accepted: boolean; onSite?: boolean },
  ): ProJob => {
    seq += 1;
    const svc = pool[Math.floor(rand() * pool.length)] ?? pool[0]!;
    const [, , serviceName, minPaise, maxPaise] = svc;
    // The customer paid somewhere in the service's band; the pro's gross is
    // that, and the net follows the commission rule.
    const grossEarningPaise =
      minPaise + Math.floor(rand() * Math.max(1, maxPaise - minPaise));
    // The pro is past their free jobs if their career count says so.
    const { cfcFeePaise } = commissionFor(grossEarningPaise, pro.jobsCompleted);

    // Jobs come from the pro's own area and the ones next to it, so distances
    // stay believable rather than spanning the district.
    const area =
      rand() < 0.55
        ? pro.area
        : (AREAS[Math.floor(rand() * AREAS.length)] ?? pro.area);
    const distanceKm = Math.round((0.4 + rand() * 7.6) * 10) / 10;

    const customerFull =
      CUSTOMER_NAMES[Math.floor(rand() * CUSTOMER_NAMES.length)] ??
      CUSTOMER_NAMES[0]!;

    const accepted = opts.accepted;

    return {
      id: `job_${proId}_${seq}`,
      reference: `CFC${10_000_000 + Math.floor(rand() * 89_999_999)}`,
      serviceName,
      status,
      scheduledAt: new Date(Date.now() + offsetMs).toISOString(),
      customerName: shortName(customerFull),
      area,
      // Withheld until accepted. See `ProJob.address`.
      address: accepted ? addressFor(rand, area) : null,
      customerPhone: accepted
        ? `+91 ${9_000_000_000 + Math.floor(rand() * 999_999_999)}`
        : null,
      landmark: accepted && rand() < 0.6 ? "Near the water tank" : null,
      notes:
        rand() < 0.45
          ? "Please call before arriving — the gate is locked."
          : null,
      distanceKm,
      netEarningPaise: grossEarningPaise - cfcFeePaise,
      grossEarningPaise,
      // Only released once the pro is on site, and only the customer can read
      // it out. Pro 18.
      completionOtp: opts.onSite === true ? otpFor(rand) : null,
    };
  };

  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  // One job in progress right now — so the dashboard has something live to
  // show and the "active" tab is never empty on first look.
  jobs.push(make("in_progress", -1 * HOUR, { accepted: true, onSite: true }));

  // One travelling, one waiting on a quotation.
  jobs.push(make("on_the_way", 0.5 * HOUR, { accepted: true }));
  if (rand() < 0.7) {
    jobs.push(make("awaiting_quote", 2 * HOUR, { accepted: true }));
  }

  // Today's remaining work, then the days after.
  const upcomingCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < upcomingCount; i += 1) {
    jobs.push(make("upcoming", (4 + i * 20) * HOUR, { accepted: true }));
  }

  // Completed history. Enough to fill the tab and the day's earnings.
  const completedToday = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < completedToday; i += 1) {
    jobs.push(make("completed", -(2 + i * 2) * HOUR, { accepted: true }));
  }
  for (let i = 0; i < 6; i += 1) {
    jobs.push(make("completed", -(1 + i) * DAY, { accepted: true }));
  }

  if (rand() < 0.8) {
    jobs.push(make("cancelled", -3 * DAY, { accepted: true }));
  }

  // Newest first within the offered/active set, soonest first for upcoming —
  // handled by the callers, which sort for their own screen.

  const startOfToday = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ).getTime();

  const completedTodayJobs = jobs.filter(
    (j) =>
      j.status === "completed" &&
      new Date(j.scheduledAt).getTime() >= startOfToday,
  );

  const stats: ProDayStats = {
    todayNetPaise: completedTodayJobs.reduce(
      (t, j) => t + j.netEarningPaise,
      0,
    ),
    todayJobCount: completedTodayJobs.length,
    activeCount: jobs.filter((j) =>
      PRO_JOB_TAB_STATUSES.active.includes(j.status),
    ).length,
    upcomingCount: jobs.filter((j) => j.status === "upcoming").length,
    // The career figures come from the pro's own record, not from this
    // generated slice — the slice is a recent window, not their whole history.
    completedTotal: pro.jobsCompleted,
    rating: pro.rating,
    // Net, because it is what reached them. The fixture's `totalEarnedPaise`
    // is gross, so the commission comes off — and a pro still inside the free
    // jobs offer has had nothing taken.
    totalEarnedNetPaise:
      pro.totalEarnedPaise -
      commissionFor(pro.totalEarnedPaise, pro.jobsCompleted).cfcFeePaise,
  };

  return { jobs, stats };
}

const cache = new Map<string, Built>();

function builtFor(proId: string): Built {
  let b = cache.get(proId);
  if (!b) {
    b = build(proId);
    cache.set(proId, b);
  }
  return b;
}

/** Pro 10 — the dashboard's figures. */
export async function getProDayStats(proId: string): Promise<ProDayStats> {
  await latency();
  return applyScenario(builtFor(proId).stats, {
    todayNetPaise: 0,
    todayJobCount: 0,
    activeCount: 0,
    upcomingCount: 0,
    completedTotal: 0,
    rating: 0,
    totalEarnedNetPaise: 0,
  });
}

/**
 * Pro 10 — what is happening now.
 *
 * The active work, soonest first. This is the dashboard's list, not the jobs
 * screen's: it answers "what am I doing next", so it is deliberately short.
 */
export async function getProActiveJobs(
  proId: string,
  limit = 4,
): Promise<ProJob[]> {
  await latency();
  const rows = builtFor(proId)
    .jobs.filter((j) => PRO_JOB_TAB_STATUSES.active.includes(j.status))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
    .slice(0, limit);
  return applyScenario(rows, []);
}

/** Pro 20 — one tab's worth. */
export async function getProJobs(
  proId: string,
  tab: ProJobTab,
): Promise<ProJob[]> {
  await latency();
  const statuses = PRO_JOB_TAB_STATUSES[tab];
  const rows = builtFor(proId)
    .jobs.filter((j) => statuses.includes(j.status))
    .sort((a, b) => {
      const at = new Date(a.scheduledAt).getTime();
      const bt = new Date(b.scheduledAt).getTime();
      // Upcoming reads forwards — the next job first. History reads backwards.
      return tab === "upcoming" ? at - bt : bt - at;
    });
  return applyScenario(rows, []);
}

/** Pro 20 — the tab badges. Fetched with the list so they cannot disagree. */
export async function getProJobCounts(
  proId: string,
): Promise<Record<ProJobTab, number>> {
  await latency();
  const jobs = builtFor(proId).jobs;
  const counts = {
    active: jobs.filter((j) => PRO_JOB_TAB_STATUSES.active.includes(j.status))
      .length,
    upcoming: jobs.filter((j) => j.status === "upcoming").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    cancelled: jobs.filter((j) => j.status === "cancelled").length,
  };
  return applyScenario(counts, {
    active: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
}

/** Pro 21 — one job in full. */
export async function getProJob(
  proId: string,
  jobId: string,
): Promise<ProJob | null> {
  await latency();
  const found = builtFor(proId).jobs.find((j) => j.id === jobId) ?? null;
  return applyScenario(found, null);
}
