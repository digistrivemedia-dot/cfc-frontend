import type { Paise } from "./primitives";
import type { BookingStatus } from "./booking";

/** Admin 3 — Main dashboard KPI cards. */
export interface DashboardKpis {
  newBookingsToday: number;
  pendingQuotes: number;
  activeJobs: number;
  totalEarningTodayPaise: Paise;
}

/** One row in the live job feed on the main dashboard. */
export interface JobFeedItem {
  id: string;
  reference: string;
  customerName: string;
  proName: string | null;
  status: BookingStatus;
  serviceName: string;
  /** ISO timestamp of the event this feed row represents. */
  at: string;
}
