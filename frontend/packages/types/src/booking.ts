import type { Id, Paise, Timestamp } from "./primitives";

/**
 * Booking shapes needed to render Admin 6 — all bookings.
 *
 * The backend team owns the real model. This is the minimum a screen needs so
 * it is not written against `any`, and it aligns to their schema when published.
 */

export const BOOKING_STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Human label for a status. One mapping, never re-written per screen. */
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** A row in the bookings table. Deliberately flat — it is a list projection. */
export interface BookingListItem {
  id: Id;
  /** Customer-facing reference, e.g. CFC12345678. */
  reference: string;
  customerName: string;
  /** Null until a Pro is assigned. */
  proName: string | null;
  serviceName: string;
  status: BookingStatus;
  scheduledAt: Timestamp;
  totalPaise: Paise;
  area: string;
}

/**
 * Query parameters the bookings list accepts.
 *
 * Each optional field explicitly admits `undefined`. Under
 * `exactOptionalPropertyTypes` an absent key and a key set to `undefined` are
 * different types, and a screen building a query object from filter state
 * naturally produces the latter — "no search term" is `search: undefined`, not
 * a missing property.
 */
export interface BookingQuery {
  search?: string | undefined;
  status?: BookingStatus | "all" | undefined;
  from?: Timestamp | undefined;
  to?: Timestamp | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  sortBy?: "scheduledAt" | "totalPaise" | "reference" | undefined;
  sortDir?: "asc" | "desc" | undefined;
}

/** One entry in a booking's history. Admin 7 — "timeline". */
export interface BookingEvent {
  /** What happened, in the operator's words. */
  label: string;
  at: Timestamp;
  /** Who caused it — a customer, a pro, the system, or a named admin. */
  actor: string;
  /** Set when an admin forced this state rather than it occurring naturally. */
  forced?: boolean | undefined;
}

/**
 * One booking, in full. Admin 7 — "Full booking info, user+Pro info, timeline,
 * status override".
 *
 * Extends the list projection rather than replacing it, so a row already in
 * hand needs no reconciling against the detail.
 */
export interface BookingDetail extends BookingListItem {
  customerPhone: string;
  /** Null until a pro is assigned. */
  proPhone: string | null;
  address: string;
  landmark: string | null;
  /** What the customer typed when booking. */
  notes: string | null;
  /** Oldest first. */
  timeline: BookingEvent[];
  /** Money, split the way Admin 32 settles it. */
  platformFeePaise: Paise;
  /** CGST + SGST, charged on the platform fee only. */
  gstPaise: Paise;
  proPayoutPaise: Paise;
  paymentMethod: "upi" | "card" | "cash" | "wallet";
  paid: boolean;
}
