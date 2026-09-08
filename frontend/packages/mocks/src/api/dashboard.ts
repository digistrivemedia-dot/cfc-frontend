import type { DashboardKpis, JobFeedItem } from "@cfc/types";
import { bookings } from "../fixtures/bookings";
import { quotations } from "../fixtures/quotations";
import { applyScenario, latency } from "../control";

/**
 * Admin 3 — main dashboard.
 *
 * Derived from the same bookings/quotations fixtures every other screen reads,
 * rather than invented separately — the dashboard's "New bookings today" and
 * the bookings list's own count must agree, the way they would against one
 * real backend.
 */

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  await latency();

  const newBookingsToday = bookings.filter((b) => isToday(b.scheduledAt)).length;
  const pendingQuotes = quotations.filter((q) => q.status === "pending").length;
  const activeJobs = bookings.filter(
    (b) => b.status === "assigned" || b.status === "in_progress",
  ).length;
  const totalEarningTodayPaise = bookings
    .filter((b) => b.status === "completed" && isToday(b.scheduledAt))
    .reduce((sum, b) => sum + b.totalPaise, 0);

  return applyScenario<DashboardKpis>(
    { newBookingsToday, pendingQuotes, activeJobs, totalEarningTodayPaise },
    { newBookingsToday: 0, pendingQuotes: 0, activeJobs: 0, totalEarningTodayPaise: 0 },
  );
}

/** Most recent bookings, newest first — the "live job feed". */
export async function getJobFeed(limit = 8): Promise<JobFeedItem[]> {
  await latency();

  const items: JobFeedItem[] = [...bookings]
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, limit)
    .map((b) => ({
      id: b.id,
      reference: b.reference,
      customerName: b.customerName,
      proName: b.proName,
      status: b.status,
      serviceName: b.serviceName,
      at: b.scheduledAt,
    }));

  return applyScenario<JobFeedItem[]>(items, []);
}
