import type {
  ActiveUsersPoint,
  BookingsPoint,
  CustomerGrowthPoint,
  PeakHourRow,
  ProPerformanceRow,
  RatingTrendPoint,
  RevenueBreakdownRow,
  RevenuePoint,
  ServiceDemandRow,
} from "@cfc/types";
import { AREAS, PRO_NAMES, SERVICE_CATALOG, seeded, pickFrom } from "./seed";

const rand = seeded(20260911);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

const DAY_LABELS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86_400_000);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
});

export const revenueSeries: RevenuePoint[] = DAY_LABELS.map((label) => {
  const revenuePaise = Math.floor(1_800_00 + rand() * 3_200_00) * 100;
  const platformFeePaise = Math.round(revenuePaise * 0.08);
  return {
    label,
    revenuePaise,
    platformFeePaise,
    gstPaise: Math.round(platformFeePaise * 0.18),
  };
});

export const bookingsSeries: BookingsPoint[] = DAY_LABELS.map((label) => ({
  label,
  completed: Math.floor(30 + rand() * 60),
  cancelled: Math.floor(rand() * 8),
}));

export const proPerformance: ProPerformanceRow[] = PRO_NAMES.map((proName) => ({
  proName,
  completionRateBps: Math.floor(8500 + rand() * 1400),
  avgRating: Math.round((3.6 + rand() * 1.4) * 10) / 10,
  jobsCompleted: Math.floor(20 + rand() * 380),
  noShowCount: Math.floor(rand() * 4),
  earnedPaise: Math.floor(20 + rand() * 380) * Math.floor(60000 + rand() * 40000),
})).sort((a, b) => b.jobsCompleted - a.jobsCompleted);

export const serviceDemand: ServiceDemandRow[] = SERVICE_CATALOG.map(
  ([, , serviceName]) => ({
    serviceName,
    bookingCount: Math.floor(20 + rand() * 400),
    area: pick(AREAS),
  }),
).sort((a, b) => b.bookingCount - a.bookingCount);

export const customerGrowth: CustomerGrowthPoint[] = DAY_LABELS.map((label) => ({
  label,
  newSignups: Math.floor(5 + rand() * 25),
  repeatBookingRateBps: Math.floor(3000 + rand() * 3000),
}));

/** Admin 38 — revenue split by category. */
export const revenueByCategory: RevenueBreakdownRow[] = [
  ...new Set(SERVICE_CATALOG.map(([category]) => category)),
].map((label) => {
  const bookingCount = Math.floor(40 + rand() * 400);
  const revenuePaise = bookingCount * Math.floor(40_000 + rand() * 180_000);
  return {
    label,
    revenuePaise,
    // 15% platform commission, as the agreement sets it.
    platformFeePaise: Math.round(revenuePaise * 0.15),
    bookingCount,
  };
}).sort((a, b) => b.revenuePaise - a.revenuePaise);

/** Admin 38 — revenue split by area. */
export const revenueByArea: RevenueBreakdownRow[] = AREAS.map((label) => {
  const bookingCount = Math.floor(30 + rand() * 300);
  const revenuePaise = bookingCount * Math.floor(40_000 + rand() * 160_000);
  return {
    label,
    revenuePaise,
    platformFeePaise: Math.round(revenuePaise * 0.15),
    bookingCount,
  };
}).sort((a, b) => b.revenuePaise - a.revenuePaise);

/**
 * Admin 39 — bookings by hour.
 *
 * Shaped like a real home-services day rather than uniformly random: a morning
 * rise, a lunchtime dip, and an evening peak when people are home from work.
 * A flat distribution would make the screen useless for the staffing decision
 * it exists to inform.
 */
const HOUR_WEIGHT = [
  1, 1, 1, 1, 2, 4, 10, 18, 30, 42, 48, 44,
  32, 30, 34, 40, 52, 68, 82, 74, 50, 28, 12, 4,
];

export const peakHours: PeakHourRow[] = HOUR_WEIGHT.map((weight, hour) => ({
  hour,
  label:
    hour === 0
      ? "12 am"
      : hour < 12
        ? `${hour} am`
        : hour === 12
          ? "12 pm"
          : `${hour - 12} pm`,
  bookingCount: Math.round(weight * (0.8 + rand() * 0.4)),
}));

/** Admin 40 — platform-wide rating over time. */
export const ratingTrend: RatingTrendPoint[] = DAY_LABELS.map((label) => ({
  label,
  avgRating: Number((4.1 + rand() * 0.6).toFixed(2)),
  ratingCount: Math.floor(20 + rand() * 60),
}));

/**
 * Admin 42 — active users.
 *
 * MAU is generated first and DAU derived from it, so the ratio stays plausible.
 * Two independent series would eventually produce a day with more daily users
 * than monthly ones.
 */
export const activeUsers: ActiveUsersPoint[] = DAY_LABELS.map((label) => {
  const mau = Math.floor(1800 + rand() * 700);
  return {
    label,
    mau,
    dau: Math.round(mau * (0.14 + rand() * 0.08)),
  };
});
