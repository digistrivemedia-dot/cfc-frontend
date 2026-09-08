import type { Id, Paise, Timestamp } from "./primitives";

/** Admin 35–37 — coupons and banners. */

/**
 * Who may redeem a coupon. Admin 36 — "user restrictions".
 *
 * Separate from `firstBookingOnly`, which the inventory lists on its own: that
 * is a single flag about a customer's history, while these narrow WHERE and on
 * WHAT the code works. A monsoon offer for Srirangam on bookings above ₹500 is
 * three different limits, and collapsing them into one field means an operator
 * cannot express the campaign they were asked for.
 */
export interface CouponRestrictions {
  /** Empty means every area. */
  areas: string[];
  /** Empty means every service. */
  serviceNames: string[];
  /** 0 means no floor. Guards against a flat discount exceeding the booking. */
  minOrderPaise: Paise;
  /** 0 means uncapped. Caps a percentage discount in rupees. */
  maxDiscountPaise: Paise;
  /** How many times one customer may use it. 0 means no per-customer limit. */
  perCustomerLimit: number;
}

export interface Coupon {
  id: Id;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: Timestamp;
  firstBookingOnly: boolean;
  restrictions: CouponRestrictions;
  active: boolean;
}

export interface Banner {
  id: Id;
  imageUrl: string;
  title: string;
  linkType: "category" | "service" | "none";
  linkTarget: string | null;
  sortOrder: number;
  active: boolean;
  scheduledFrom: Timestamp | null;
  scheduledTo: Timestamp | null;
}

/** Admin 43–44 — support tickets. */
export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface TicketListItem {
  id: Id;
  subject: string;
  fromName: string;
  fromRole: "customer" | "pro";
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  updatedAt: Timestamp;
}

export interface TicketMessage {
  id: Id;
  author: string;
  isInternal: boolean;
  body: string;
  sentAt: Timestamp;
}

export interface TicketDetail extends TicketListItem {
  messages: TicketMessage[];
}
