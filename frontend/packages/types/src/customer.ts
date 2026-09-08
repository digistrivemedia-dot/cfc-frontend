import type { BookingStatus } from "./booking";
import type { Id, Paise, Timestamp } from "./primitives";

export interface CustomerListItem {
  id: Id;
  name: string;
  phone: string;
  area: string;
  totalBookings: number;
  totalSpentPaise: Paise;
  walletPaise: Paise;
  blocked: boolean;
  joinedAt: Timestamp;
}

export interface CustomerDetail extends CustomerListItem {
  email: string | null;
  addresses: string[];
  complaintCount: number;
  noShowCount: number;
}

/**
 * A complaint raised by a customer. Admin 20 — "complaints".
 *
 * Kept separate from support tickets: a ticket is a conversation, a complaint is
 * a mark on a booking that an operator weighs when deciding whether a refund or
 * a block is warranted.
 */
export interface CustomerComplaint {
  id: Id;
  /** The booking it was raised against. */
  bookingRef: string;
  subject: string;
  raisedAt: Timestamp;
  resolved: boolean;
  /** How it was settled, once it has been. */
  outcome?: string | undefined;
}

/** A customer's booking, as their history shows it. Admin 20. */
export interface CustomerBooking {
  id: Id;
  reference: string;
  serviceName: string;
  proName: string | null;
  status: BookingStatus;
  scheduledAt: Timestamp;
  totalPaise: Paise;
}
