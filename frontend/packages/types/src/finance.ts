import type { BasisPoints, Id, Paise, Timestamp } from "./primitives";

/** Admin 30–34 — transactions, revenue, settlement, refunds, GST. */

export const TRANSACTION_METHODS = ["upi", "card", "wallet", "cash"] as const;
export type TransactionMethod = (typeof TRANSACTION_METHODS)[number];

export const TRANSACTION_METHOD_LABEL: Record<TransactionMethod, string> = {
  upi: "UPI",
  card: "Card",
  wallet: "Wallet",
  cash: "Cash",
};

export const TRANSACTION_STATUSES = [
  "success",
  "pending",
  "failed",
  "refunded",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export interface TransactionListItem {
  id: Id;
  bookingRef: string;
  customerName: string;
  amountPaise: Paise;
  method: TransactionMethod;
  status: TransactionStatus;
  createdAt: Timestamp;
  /**
   * Where the booking happened.
   *
   * Carried on the money records so admin can filter payments, settlements and
   * refunds by state / city / area — the client asked for that on every menu,
   * and without this field those screens had three dropdowns that could only
   * ever empty the table.
   *
   * It is the booking's area, copied onto the money record rather than joined
   * at read time: a settlement is a historical document, and if a customer
   * later moves, last quarter's report must not change underneath it.
   *
   * Optional because the BACKEND will own this. Every existing caller keeps
   * working without it, and a record that arrives without an area is excluded
   * from a location filter rather than silently passing it.
   */
  area?: string | undefined;
}

/**
 * Per-booking internal settlement: what the customer paid, the pro's share,
 * the platform fee, and the GST breakdown. GST is admin-editable and is never
 * a literal in a component — it arrives as basis points on the record.
 */
export interface Settlement {
  id: Id;
  bookingRef: string;
  customerName: string;
  proName: string;
  customerPaidPaise: Paise;
  proSharePaise: Paise;
  platformFeePaise: Paise;
  cgstBps: BasisPoints;
  sgstBps: BasisPoints;
  gstPaise: Paise;
  netToProPaise: Paise;
  settledAt: Timestamp;
  /**
   * Where the booking happened.
   *
   * Carried on the money records so admin can filter payments, settlements and
   * refunds by state / city / area — the client asked for that on every menu,
   * and without this field those screens had three dropdowns that could only
   * ever empty the table.
   *
   * It is the booking's area, copied onto the money record rather than joined
   * at read time: a settlement is a historical document, and if a customer
   * later moves, last quarter's report must not change underneath it.
   *
   * Optional because the BACKEND will own this. Every existing caller keeps
   * working without it, and a record that arrives without an area is excluded
   * from a location filter rather than silently passing it.
   */
  area?: string | undefined;
}

export const REFUND_STATUSES = ["requested", "approved", "rejected", "paid"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export interface RefundRequest {
  id: Id;
  bookingRef: string;
  customerName: string;
  amountPaise: Paise;
  reason: string;
  status: RefundStatus;
  requestedAt: Timestamp;
  /**
   * Where the booking happened.
   *
   * Carried on the money records so admin can filter payments, settlements and
   * refunds by state / city / area — the client asked for that on every menu,
   * and without this field those screens had three dropdowns that could only
   * ever empty the table.
   *
   * It is the booking's area, copied onto the money record rather than joined
   * at read time: a settlement is a historical document, and if a customer
   * later moves, last quarter's report must not change underneath it.
   *
   * Optional because the BACKEND will own this. Every existing caller keeps
   * working without it, and a record that arrives without an area is excluded
   * from a location filter rather than silently passing it.
   */
  area?: string | undefined;
}

export interface GstReportRow {
  month: string;
  cgstPaise: Paise;
  sgstPaise: Paise;
  totalPaise: Paise;
  bookingCount: number;
}
