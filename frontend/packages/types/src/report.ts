import type { Paise } from "./primitives";

/** Admin 31, 38–42 — revenue, bookings, pro performance, demand, customers. */

export interface RevenuePoint {
  /** "04 Sep" style label, already formatted — a chart never formats a date. */
  label: string;
  revenuePaise: Paise;
  platformFeePaise: Paise;
  gstPaise: Paise;
}

export interface BookingsPoint {
  label: string;
  completed: number;
  cancelled: number;
}

export interface ProPerformanceRow {
  proName: string;
  /**
   * The area this pro works.
   *
   * Added so the Pro performance report can be filtered by state / city /
   * area like the rest of admin. A pro belongs to an area, so this is a real
   * property of the row rather than a label bolted on.
   *
   * NOT added to `RevenueBreakdownRow`, `CustomerGrowthPoint` or `PeakHourRow`:
   * those rows are already aggregates ("Tuesday: 340 bookings"), and an area on
   * a total that spans every area would be a field with no true value. Those
   * reports need the geography applied BEFORE aggregation, which is a backend
   * query parameter, not a row field.
   *
   * Optional because the backend will own it.
   */
  area?: string | undefined;
  completionRateBps: number;
  avgRating: number;
  jobsCompleted: number;
  noShowCount: number;
  earnedPaise: Paise;
}

export interface ServiceDemandRow {
  serviceName: string;
  bookingCount: number;
  area: string;
}

export interface CustomerGrowthPoint {
  label: string;
  newSignups: number;
  repeatBookingRateBps: number;
}

/** Revenue split by category or area. Admin 38. */
export interface RevenueBreakdownRow {
  /** Category name, or area name, depending on which breakdown this is. */
  label: string;
  revenuePaise: Paise;
  platformFeePaise: Paise;
  bookingCount: number;
}

/**
 * Bookings by hour of day. Admin 39 — "peak hours".
 *
 * Twenty-four rows, midnight to 11pm. This is a staffing question: knowing the
 * evening peak is when pros are needed online is what auto-assign failures at
 * 7pm are actually about.
 */
export interface PeakHourRow {
  /** "6 pm" style label, already formatted. */
  label: string;
  hour: number;
  bookingCount: number;
}

/** Average rating across the platform over time. Admin 40 — "ratings trends". */
export interface RatingTrendPoint {
  label: string;
  avgRating: number;
  /** How many ratings that average is built from. */
  ratingCount: number;
}

/**
 * Active users. Admin 42 — "MAU/DAU".
 *
 * Both are carried per point so the ratio can be read directly: DAU over MAU is
 * the standard stickiness measure, and computing it from two separate series
 * invites them drifting out of step.
 */
export interface ActiveUsersPoint {
  label: string;
  dau: number;
  mau: number;
}
