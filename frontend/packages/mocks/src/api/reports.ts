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
import {
  activeUsers,
  bookingsSeries,
  customerGrowth,
  peakHours,
  proPerformance,
  ratingTrend,
  revenueByArea,
  revenueByCategory,
  revenueSeries,
  serviceDemand,
} from "../fixtures/reports";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

export async function getRevenueSeries() {
  if (isLive("getRevenueSeries")) {
    return fetchJson<RevenuePoint[]>("/admin/reports/revenue-series");
  }
  await latency();
  return applyScenario(revenueSeries, []);
}
export async function getBookingsSeries() {
  if (isLive("getBookingsSeries")) {
    return fetchJson<BookingsPoint[]>("/admin/reports/bookings-series");
  }
  await latency();
  return applyScenario(bookingsSeries, []);
}
export async function getProPerformance() {
  if (isLive("getProPerformance")) {
    return fetchJson<ProPerformanceRow[]>("/admin/reports/pro-performance");
  }
  await latency();
  return applyScenario(proPerformance, []);
}
export async function getServiceDemand() {
  if (isLive("getServiceDemand")) {
    return fetchJson<ServiceDemandRow[]>("/admin/reports/service-demand");
  }
  await latency();
  return applyScenario(serviceDemand, []);
}
export async function getCustomerGrowth() {
  if (isLive("getCustomerGrowth")) {
    return fetchJson<CustomerGrowthPoint[]>("/admin/reports/customer-growth");
  }
  await latency();
  return applyScenario(customerGrowth, []);
}

/** Admin 38 — revenue split by category. */
export async function getRevenueByCategory() {
  if (isLive("getRevenueByCategory")) {
    return fetchJson<RevenueBreakdownRow[]>("/admin/reports/revenue-by-category");
  }
  await latency();
  return applyScenario(revenueByCategory, []);
}

/** Admin 38 — revenue split by area. */
export async function getRevenueByArea() {
  if (isLive("getRevenueByArea")) {
    return fetchJson<RevenueBreakdownRow[]>("/admin/reports/revenue-by-area");
  }
  await latency();
  return applyScenario(revenueByArea, []);
}

/** Admin 39 — bookings by hour of day. */
export async function getPeakHours() {
  if (isLive("getPeakHours")) {
    return fetchJson<PeakHourRow[]>("/admin/reports/peak-hours");
  }
  await latency();
  return applyScenario(peakHours, []);
}

/** Admin 40 — platform rating over time. */
export async function getRatingTrend() {
  if (isLive("getRatingTrend")) {
    return fetchJson<RatingTrendPoint[]>("/admin/reports/rating-trend");
  }
  await latency();
  return applyScenario(ratingTrend, []);
}

/** Admin 42 — daily and monthly active users. */
export async function getActiveUsers() {
  if (isLive("getActiveUsers")) {
    return fetchJson<ActiveUsersPoint[]>("/admin/reports/active-users");
  }
  await latency();
  return applyScenario(activeUsers, []);
}
