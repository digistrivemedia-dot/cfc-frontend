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

export async function getRevenueSeries() {
  await latency();
  return applyScenario(revenueSeries, []);
}
export async function getBookingsSeries() {
  await latency();
  return applyScenario(bookingsSeries, []);
}
export async function getProPerformance() {
  await latency();
  return applyScenario(proPerformance, []);
}
export async function getServiceDemand() {
  await latency();
  return applyScenario(serviceDemand, []);
}
export async function getCustomerGrowth() {
  await latency();
  return applyScenario(customerGrowth, []);
}

/** Admin 38 — revenue split by category. */
export async function getRevenueByCategory() {
  await latency();
  return applyScenario(revenueByCategory, []);
}

/** Admin 38 — revenue split by area. */
export async function getRevenueByArea() {
  await latency();
  return applyScenario(revenueByArea, []);
}

/** Admin 39 — bookings by hour of day. */
export async function getPeakHours() {
  await latency();
  return applyScenario(peakHours, []);
}

/** Admin 40 — platform rating over time. */
export async function getRatingTrend() {
  await latency();
  return applyScenario(ratingTrend, []);
}

/** Admin 42 — daily and monthly active users. */
export async function getActiveUsers() {
  await latency();
  return applyScenario(activeUsers, []);
}
